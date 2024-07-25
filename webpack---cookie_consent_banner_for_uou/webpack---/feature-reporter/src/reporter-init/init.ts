import { WixBiSession, BusinessLogger } from '@wix/thunderbolt-symbols'
import { IFeatureState } from 'thunderbolt-feature-state'
import { IConsentPolicy } from 'feature-consent-policy'
import { IUrlHistoryManager } from 'feature-router'
import { ReporterState, ReporterSiteConfig } from '..'
import { setState } from '../utils'
import { LoadedScripts } from '../tag-manager/types'
import { onTagManagerReady } from '../tag-manager'
import { getReporterProps } from './get-reporter-props'
import { storeUtmParams } from '../utm-params'

export async function init(
	siteConfig: ReporterSiteConfig,
	wixBiSession: WixBiSession,
	businessLogger: BusinessLogger,
	featureState: IFeatureState<ReporterState>,
	consentPolicy: IConsentPolicy,
	urlHistoryManager: IUrlHistoryManager
) {
	const api = await import('../api' /* webpackChunkName: "reporter-api" */)
	const reporterProps = getReporterProps(siteConfig, wixBiSession)

	initDefaultChannels()
	initEssentialChannels()
	onTagManagerReady(initNonEssentialChannels)
	storeUtmParams(urlHistoryManager, consentPolicy)

	function initDefaultChannels() {
		api.initDefaultChannels(reporterProps, businessLogger, consentPolicy)
	}

	function initEssentialChannels() {
		api.initChannels(reporterProps, {})
	}

	function initNonEssentialChannels(loadedScripts: LoadedScripts) {
		api.initChannels(reporterProps, loadedScripts)
		setState(featureState, { tagManagerReady: true })
		handleDeferredPageView()
	}

	function handleDeferredPageView() {
		featureState.get().sendDeferredPageView()
		setState(featureState, { sendDeferredPageView: () => {} })
	}
}
