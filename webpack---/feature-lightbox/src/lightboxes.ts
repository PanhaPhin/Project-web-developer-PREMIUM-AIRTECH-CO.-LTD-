import { withDependencies, named } from '@wix/thunderbolt-ioc'
import {
	LifeCycle,
	BrowserWindow,
	BrowserWindowSymbol,
	FeatureStateSymbol,
	MasterPageFeatureConfigSymbol,
	IPageWillUnmountHandler,
	CurrentRouteInfoSymbol,
	ICyclicTabbing,
	SiteFeatureConfigSymbol,
	Experiments,
	ExperimentsSymbol,
	IFetchApi,
	Fetch,
} from '@wix/thunderbolt-symbols'
import type { IFeatureState } from 'thunderbolt-feature-state'
import { isSSR } from '@wix/thunderbolt-commons'
import { CyclicTabbingSymbol } from 'feature-cyclic-tabbing'
import { IPageInitializer, IPageProvider, PageInitializerSymbol, PageProviderSymbol } from 'feature-pages'
import type {
	ILightbox,
	LightboxFeatureState,
	LightboxesMasterPageConfig,
	LightboxEvent,
	LightboxEventListener,
	ICurrentLightbox,
	ILightboxesAPI,
	LightboxSiteConfig,
	ILightboxesResponseHandler,
} from './types'
import { name, CurrentLightboxSymbol, LightboxesAPISymbol, LightboxesResponseHandlerSymbol } from './symbols'
import { INavigationManager, NavigationManagerSymbol } from 'feature-navigation-manager'
import { ICurrentRouteInfo } from 'feature-router'
import { RouterFetchSymbol, RouterFetchAPI, RouterFetchRequestTypes } from 'feature-router-fetch'

const lightboxesFactory = (
	{ initPage }: IPageInitializer,
	window: BrowserWindow,
	featureState: IFeatureState<LightboxFeatureState>,
	{ pageIdToRouterFetchData }: LightboxSiteConfig,
	masterPageConfig: LightboxesMasterPageConfig,
	pageProvider: IPageProvider,
	navigationManager: INavigationManager,
	currentRouteInfo: ICurrentRouteInfo,
	currentLightbox: ICurrentLightbox,
	cyclicTabbing: ICyclicTabbing,
	lightboxesAPI: ILightboxesAPI,
	{ handleResponse }: ILightboxesResponseHandler,
	fetchApi: IFetchApi,
	{ getFetchParams }: RouterFetchAPI,
	experiments: Experiments
): ILightbox => {
	const lightboxOpenEventListeners: Array<LightboxEventListener> = []
	const lightboxCloseEventListeners: Array<LightboxEventListener> = []
	let lightboxCloseHandler: LightboxEventListener = null
	let propagatePageScroll: LightboxEventListener

	const onKeyDown = (e: Event) => {
		const keyboardEvent = e as KeyboardEvent
		if (keyboardEvent.key === 'Escape') {
			closeLightbox()
		}
	}

	const closeLightbox = async () => {
		const lightboxId = getCurrentLightboxId() as string
		if (!lightboxId) {
			return
		}

		const { pendingLightboxId } = featureState.get() || {}
		const isOpeningLightboxFromWithinAnotherLightbox = pendingLightboxId && pendingLightboxId !== lightboxId
		const currentLightboxCloseHandler = lightboxCloseHandler

		const pageReflector = await pageProvider(lightboxId, lightboxId)
		const handlers = await pageReflector.getAllImplementersOfAsync<IPageWillUnmountHandler>(
			LifeCycle.PageWillUnmountHandler
		)
		await Promise.all(
			handlers.map((handler) => handler.pageWillUnmount({ pageId: lightboxId, contextId: lightboxId }))
		)

		lightboxesAPI.removeLightboxFromDynamicStructure(lightboxId)
		currentLightboxCloseHandler?.()
		lightboxCloseEventListeners.forEach((eventHandler) => eventHandler?.())

		if (isOpeningLightboxFromWithinAnotherLightbox) {
			return
			// prevent popup close handler from tempering site level state if we're still rendering a popup
		}

		cyclicTabbing.disableCyclicTabbing(lightboxId)

		if (!isSSR(window)) {
			window.removeEventListener('keydown', onKeyDown)
		}
		const currentLightboxId = currentLightbox.isDuringReopen() ? getCurrentLightboxId() : undefined

		featureState.update((state) => ({
			...state,
			pageWillLoadHandler: null,
			currentLightboxId,
			pendingLightboxId: undefined,
			lightboxRouteData: undefined,
		}))
	}

	const getCurrentLightboxId = () => {
		return featureState.get() ? featureState.get().currentLightboxId : undefined
	}

	const isLightboxOpen = () => !!getCurrentLightboxId()

	const isLightboxAlreadyOpen = (lightboxId: string): boolean => {
		if (currentLightbox.isDuringReopen()) {
			return false
		}
		const state = featureState.get()
		return state?.currentLightboxId === lightboxId || state?.pendingLightboxId === lightboxId
	}

	const openLightbox: ILightbox['open'] = async (lightboxId, closeHandler) => {
		const isAppReflowWithLightboxesEnabled = !!experiments['specs.thunderbolt.app_reflow_with_lightboxes']
		if (isAppReflowWithLightboxesEnabled) {
			const routerFetchData = pageIdToRouterFetchData[lightboxId]
			if (routerFetchData) {
				const { url, options } = getFetchParams(RouterFetchRequestTypes.Lightboxes, routerFetchData, {
					lightboxId,
				})
				const { pageId: lightboxReplacerId } = await handleResponse(fetchApi.envFetch(url, options))
				lightboxId = lightboxReplacerId ?? lightboxId
			}
		}

		if (isLightboxAlreadyOpen(lightboxId)) {
			lightboxCloseHandler = lightboxCloseHandler || closeHandler
			return
		}
		featureState.update((state) => ({
			...state,
			pendingLightboxId: lightboxId,
		}))
		cyclicTabbing.enableCyclicTabbing(lightboxId)
		/*
		 custom signup popup is the only use-case where popup is opened before the underlying page navigation has ended.
		 Triggering start navigation from custom signup popup before the landing page was navigated to, messes with other flows that depend
		 on isFirstNavigation.
		 */
		const notLandingOnProtectedPage = !currentRouteInfo.isLandingOnProtectedPage()
		if (notLandingOnProtectedPage) {
			navigationManager.startNavigation()
			navigationManager.setShouldBlockRender(true)
		}
		await initPage({ pageId: lightboxId, contextId: lightboxId })
		lightboxCloseHandler = closeHandler
		if (lightboxOpenEventListeners.length > 0) {
			lightboxOpenEventListeners.forEach((eventHandler) => {
				if (eventHandler) {
					eventHandler(lightboxId)
				}
			})
		}
		if (!isSSR(window)) {
			window.addEventListener('keydown', onKeyDown)
		}
		notLandingOnProtectedPage && navigationManager.setShouldBlockRender(false)
		await lightboxesAPI.addLightboxToDynamicStructure(lightboxId)
		featureState.update((state) => ({
			...state,
			pageWillLoadHandler: closeLightbox,
			currentLightboxId: lightboxId,
		}))
		notLandingOnProtectedPage && navigationManager.endNavigation()
	}

	return {
		isLightbox(pageId) {
			return masterPageConfig.popupPages[pageId]
		},
		open(lightboxId, closeHandler = null) {
			const pendingLightboxPromise = featureState.get()?.pendingLightboxPromise || Promise.resolve()
			const openLightboxPromise = pendingLightboxPromise.then(() => openLightbox(lightboxId, closeHandler))
			featureState.update((state) => ({ ...state, pendingLightboxPromise: openLightboxPromise }))
			return openLightboxPromise
		},
		close: closeLightbox,
		registerToLightboxEvent(eventType: LightboxEvent, eventHandler: LightboxEventListener) {
			switch (eventType) {
				case 'popupScroll':
					propagatePageScroll = eventHandler

					const popupsRoot = window!.document.getElementById('POPUPS_ROOT')
					const ResponsivePopupContainerOverflowWrapper = popupsRoot?.querySelector(
						'div[class*="overflow-wrapper"]'
					)
					const lightboxesRoot = masterPageConfig.isResponsive
						? ResponsivePopupContainerOverflowWrapper || popupsRoot
						: popupsRoot
					lightboxesRoot && lightboxesRoot.addEventListener('scroll', propagatePageScroll as EventListener)
					break
				case 'popupOpen':
					lightboxOpenEventListeners.push(eventHandler)
					break
				case 'popupClose':
					lightboxCloseEventListeners.push(eventHandler)
					break
				default:
					break
			}
		},
		getCurrentLightboxId,
		isOpen: isLightboxOpen,
	}
}

export const Lightboxes = withDependencies(
	[
		PageInitializerSymbol,
		BrowserWindowSymbol,
		named(FeatureStateSymbol, name),
		named(SiteFeatureConfigSymbol, name),
		named(MasterPageFeatureConfigSymbol, name),
		PageProviderSymbol,
		NavigationManagerSymbol,
		CurrentRouteInfoSymbol,
		CurrentLightboxSymbol,
		CyclicTabbingSymbol,
		LightboxesAPISymbol,
		LightboxesResponseHandlerSymbol,
		Fetch,
		RouterFetchSymbol,
		ExperimentsSymbol,
	],
	lightboxesFactory
)
