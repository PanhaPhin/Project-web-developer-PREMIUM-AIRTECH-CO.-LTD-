import { withDependencies, named, optional } from '@wix/thunderbolt-ioc'
import {
	IAppWillMountHandler,
	BrowserWindow,
	BrowserWindowSymbol,
	ViewerModelSym,
	ViewerModel,
	ILanguage,
	FeatureStateSymbol,
	LanguageSymbol,
	CurrentRouteInfoSymbol,
	SiteFeatureConfigSymbol,
	Experiments,
	ExperimentsSymbol,
	ILogger,
	LoggerSymbol,
} from '@wix/thunderbolt-symbols'
import { SiteMembersApiSymbol, ISiteMembersApi } from 'feature-site-members'
import { IFeatureState } from 'thunderbolt-feature-state'
import { SessionManagerSymbol, ISessionManager } from 'feature-session-manager'
import { WixEmbedsAPI, WixEmbedsAPISiteConfig, WixEmbedsAPIFeatureState } from './types'

import { ICurrentRouteInfo } from 'feature-router'

import { name } from './symbols'
import { generateWixEmbedsAPI } from './api'

const wixEmbedsApiSiteFactory = (
	config: WixEmbedsAPISiteConfig,
	featureState: IFeatureState<WixEmbedsAPIFeatureState>,
	sessionManager: ISessionManager,
	window: NonNullable<BrowserWindow>,
	viewerModel: ViewerModel,
	language: ILanguage,
	currentRouteInfo: ICurrentRouteInfo,
	logger: ILogger,
	experiments: Experiments,
	siteMembersApi?: ISiteMembersApi
): IAppWillMountHandler => {
	return {
		async appWillMount() {
			const state: WixEmbedsAPIFeatureState = { listeners: {}, firstMount: true }
			featureState.update(() => state)

			const { site } = viewerModel
			const api: WixEmbedsAPI = generateWixEmbedsAPI({
				window,
				site,
				language,
				currentRouteInfo,
				config,
				state,
				siteMembersApi,
				sessionManager,
				logger,
				experiments,
			})

			const customEventEmbedIsReady = async () => {
				// Both currentRouteInfo and wixEmbedsAPI are running in appWillMount and we need
				// to make sure that wixEmbedsAPI is ready after currentRouteInfo for other clients that needs the router to have a page id.
				const event = new Event('wixEmbedsAPIReady', { bubbles: true, cancelable: false })
				// since react umd bundles do not define named modules, we must load react before potentially loading requirejs.
				// further details here: https://requirejs.org/docs/errors.html#mismatch
				await window.reactAndReactDOMLoaded

				window.dispatchEvent(event)
			}

			Object.defineProperty(window, 'wixEmbedsAPI', {
				value: Object.freeze(api),
				writable: false,
				configurable: false,
				enumerable: true,
			})

			currentRouteInfo.onRouterInitDone(customEventEmbedIsReady)
		},
	}
}

export const WixEmbedsApiSite = withDependencies(
	[
		named(SiteFeatureConfigSymbol, name),
		named(FeatureStateSymbol, name),
		SessionManagerSymbol,
		BrowserWindowSymbol,
		ViewerModelSym,
		LanguageSymbol,
		CurrentRouteInfoSymbol,
		LoggerSymbol,
		ExperimentsSymbol,
		optional(SiteMembersApiSymbol),
	],
	wixEmbedsApiSiteFactory
)
