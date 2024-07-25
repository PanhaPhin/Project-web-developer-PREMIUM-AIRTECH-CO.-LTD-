import _ from 'lodash'
import { transfer as comlinkTransfer } from 'comlink/dist/esm/comlink.js' // eslint-disable-line no-restricted-syntax
import {
	createFedopsLogger,
	logSdkError,
	ConsentPolicyInteraction,
	createConsentPolicyLogger,
} from '@wix/thunderbolt-commons'
import {
	WixWindow,
	ScrollToOptions,
	OpenPopupOptions,
	WixCodeApiFactoryArgs,
	ConsentPolicyChangedHandler,
} from '@wix/thunderbolt-symbols'
import { ConsentPolicy } from '@wix/cookie-consent-policy-client'
import {
	LightboxContext,
	LightboxParentContext,
	namespace,
	WindowWixCodeSdkHandlers,
	WindowWixCodeSdkPageConfig,
	WindowWixCodeSdkSiteConfig,
} from '..'
import type { Language } from '@wix/thunderbolt-becky-types'

const lightboxHandles: {
	[lightboxPageId: string]: {
		lightboxParentContext: LightboxParentContext
		lightboxContext: LightboxContext
	}
} = {}

export function WindowSdkFactory({
	featureConfig,
	handlers,
	platformUtils,
	platformEnvData,
	appDefinitionId,
}: WixCodeApiFactoryArgs<WindowWixCodeSdkSiteConfig, WindowWixCodeSdkPageConfig, WindowWixCodeSdkHandlers>): {
	[namespace]: WixWindow
} {
	const {
		locale,
		isMobileFriendly,
		isPopup,
		popupNameToPageId,
		popupPageIdToName,
		pageId,
		formFactor,
		pageIdToRouterAppDefinitionId,
		isAppReflowWithLightboxesEnabled,
	} = featureConfig

	const {
		getCurrentGeolocation,
		openModal,
		openLightbox,
		closeLightbox,
		scrollToHandler,
		scrollByHandler,
		copyToClipboard,
		trackEvent,
		setCurrentLanguage,
		openTpaPopup,
		getBoundingRectHandler,
		postMessageHandler,
		scrollToElement,
	} = handlers

	const {
		multilingual,
		site: { viewMode },
		window: { isSSR, browserLocale, csrfToken },
		document: { referrer },
		router: { dynamicRouteData },
		popups,
		bi,
	} = platformEnvData

	const consentPolicyManager = platformUtils.consentPolicyManager

	const { warmupData, biUtils, essentials } = platformUtils

	const fedopsLogger = createFedopsLogger({
		appName: 'window-wix-code-sdk',
		biLoggerFactory: biUtils.createBiLoggerFactoryForFedops(),
		phasesConfig: 'SEND_START_AND_FINISH',
		customParams: {
			viewerName: 'thunderbolt',
		},
		factory: essentials.createFedopsLogger,
		experiments: essentials.experiments.all(),
		monitoringData: {
			metaSiteId: platformEnvData.location.metaSiteId,
			dc: bi.dc,
			isHeadless: bi.isjp, // name is weird because legacy
			isCached: bi.isCached,
			rolloutData: bi.rolloutData,
		},
	})

	const { executeAndLog, executeAndLogAsync } = createConsentPolicyLogger(fedopsLogger)

	function validate(value: number | object | undefined, param: string, type: string) {
		if (typeof value !== type) {
			return {
				param,
				value,
				expectedType: type,
			}
		}
	}

	function haltInSSR() {
		if (isSSR) {
			// hang the promise by design so not to invoke then()s or catch()s in ssr
			return new Promise(() => {})
		} else {
			return Promise.resolve()
		}
	}

	async function openLightboxById(lightboxId: string, lightboxParentContext?: LightboxParentContext) {
		await haltInSSR()
		if (!_.isString(lightboxId)) {
			throw new Error('Lightbox id is not a valid input')
		}
		if (!popupPageIdToName[lightboxId]) {
			throw new Error(`There is no lightbox with the id "${lightboxId}".`)
		}

		const lightboxName = popupPageIdToName[lightboxId]

		return _openLightbox(lightboxName, lightboxId, lightboxParentContext)
	}

	async function openLightboxByName(lightboxName: string, lightboxParentContext?: LightboxParentContext) {
		await haltInSSR()
		if (!_.isString(lightboxName)) {
			throw new Error('Lightbox title is not a valid input')
		}
		if (!popupNameToPageId[lightboxName]) {
			throw new Error(`There is no lightbox with the title "${lightboxName}".`)
		}

		const lightboxPageId = popupNameToPageId[lightboxName]

		return _openLightbox(lightboxName, lightboxPageId, lightboxParentContext)
	}

	function _openLightbox(
		lightboxName: string,
		lightboxPageId: string,
		lightboxParentContext?: LightboxParentContext
	) {
		return new Promise((resolve, reject) => {
			lightboxHandles[lightboxPageId] = {
				lightboxParentContext,
				lightboxContext: null,
			}

			const closeHandler = () => {
				resolve(lightboxHandles[lightboxPageId].lightboxContext)
			}

			openLightbox(lightboxPageId, lightboxName, isPopup ? null : closeHandler).catch((err: Error) => {
				reject(err)
			})
		})
	}

	function _closeLightBox(lightboxContext: LightboxContext) {
		if (!isPopup) {
			logSdkError('The current page is not a lightbox and therefore cannot be closed')
			return
		}
		if (lightboxHandles[pageId]) {
			// lightbox was opened via corvid
			lightboxHandles[pageId].lightboxContext = lightboxContext
		}
		closeLightbox()
	}

	function scrollTo(x: number, y: number, options?: ScrollToOptions) {
		if (isSSR) {
			return Promise.resolve()
		}

		return new Promise((resolve, reject) => {
			if (_.isNil(x)) {
				x = 0
			}
			if (_.isNil(y)) {
				y = 0
			}
			let validationErrorInfo = validate(x, 'x', 'number')
			if (!validationErrorInfo) {
				validationErrorInfo = validate(y, 'y', 'number')
			}
			if (!validationErrorInfo && options) {
				validationErrorInfo = validate(options, 'options', 'object')
			}
			if (validationErrorInfo) {
				const { param, value, expectedType } = validationErrorInfo
				logSdkError(
					`The ${param} parameter that is passed to the scrollTo method cannot be set to the value ${value}. It must be of type ${expectedType}.`
				)
				reject({})
				return
			}

			const shouldAnimate = options?.scrollAnimation !== false
			scrollToHandler(x, y, shouldAnimate).then(resolve).catch(reject)
		})
	}

	function scrollBy(x: number, y: number) {
		if (isSSR) {
			return Promise.resolve()
		}

		return new Promise((resolve, reject) => {
			if (_.isNil(x)) {
				x = 0
			}
			if (_.isNil(y)) {
				y = 0
			}
			let validationErrorInfo = validate(x, 'x', 'number')
			if (!validationErrorInfo) {
				validationErrorInfo = validate(y, 'y', 'number')
			}
			if (validationErrorInfo) {
				const { param, value, expectedType } = validationErrorInfo
				logSdkError(
					`The ${param} parameter that is passed to the scrollBy method cannot be set to the value ${value}. It must be of type ${expectedType}.`
				)
				reject({})
				return
			}

			scrollByHandler(x, y).then(resolve).catch(reject)
		})
	}

	const _copyToClipboard = (text: string) => {
		if (isSSR) {
			return Promise.resolve()
		}
		if (!text) {
			return Promise.reject({ error: 'unable to copy null value' })
		}
		return copyToClipboard(text)
	}

	const _openTpaPopup = (url: string, options: OpenPopupOptions, compId: string, persistent: boolean) => {
		if (isSSR) {
			return Promise.resolve()
		}

		return openTpaPopup(
			url,
			{
				..._.defaults(options, { position: { origin: 'FIXED', placement: 'CENTER' } }),
				persistent,
			},
			compId
		)
	}

	return {
		[namespace]: {
			getComponentViewportState: () =>
				Promise.resolve({
					// TODO: remove this once proGallery is in TB https://jira.wixpress.com/browse/PLAT-526
					in: true,
				}),
			multilingual: {
				siteLanguages: multilingual?.siteLanguages || [],
				isEnabled: !!multilingual,
				get currentLanguage() {
					return (multilingual?.currentLanguage?.languageCode as Language) || ''
				},
				set currentLanguage(languageCode: Language) {
					if (isSSR) {
						return
					}
					setCurrentLanguage(languageCode)
				},
			},
			browserLocale,
			formFactor,
			locale,
			referrer,
			viewMode,
			getCurrentGeolocation,
			rendering: {
				env: isSSR ? 'backend' : 'browser',
				renderCycle: 1,
			},
			openModal: isSSR ? () => Promise.resolve() : openModal,
			openLightboxById,
			openLightbox: openLightboxByName,
			lightbox: {
				getContext: () => (lightboxHandles[pageId] || {}).lightboxParentContext,
				close: _closeLightBox,
			},
			warmupData: {
				get(key: string) {
					return warmupData.getAppData(appDefinitionId, key)
				},
				set(key: string, data: unknown) {
					return warmupData.setAppData(appDefinitionId, key, data)
				},
			},
			copyToClipboard: _copyToClipboard,
			scrollTo,
			scrollToElement: (elementId: string) => scrollToElement(elementId, appDefinitionId),
			scrollBy,
			trackEvent: isSSR ? () => Promise.resolve() : trackEvent,
			openPopup: (url: string, options: OpenPopupOptions, compId: string) =>
				_openTpaPopup(url, options, compId, false),
			openPersistentPopup: (url: string, options: OpenPopupOptions, compId: string) =>
				_openTpaPopup(url, options, compId, true),
			isMobileFriendly,
			getBoundingRect: isSSR ? () => null : getBoundingRectHandler,
			postMessage(message: any, target?: string, targetOrigin?: string, transfer?: Array<any>) {
				if (isSSR) {
					console.error('postMessage is not supported on the backend')
					return
				}

				if (transfer !== undefined) {
					postMessageHandler(message, target, targetOrigin, comlinkTransfer(transfer, transfer))
				} else {
					postMessageHandler(message, target, targetOrigin, undefined)
				}
			},
			getRouterData: () =>
				pageIdToRouterAppDefinitionId[pageId] === appDefinitionId ? dynamicRouteData?.pageData : null,
			getRouterPublicData: () => {
				console.warn(
					'[deprecation] site.getRouterPublicData() is deprecated, use site.getAppPageData() instead.'
				)
				return dynamicRouteData?.publicData
			},
			getAppPageData: () => {
				if (isAppReflowWithLightboxesEnabled && isPopup) {
					return popups?.lightboxRouteData?.publicData
				}
				return dynamicRouteData?.publicData
			},
			consentPolicy: {
				getCurrentConsentPolicy() {
					return executeAndLog(
						consentPolicyManager.getDetails,
						ConsentPolicyInteraction.GET_CURRENT_CONSENT_POLICY
					)
				},
				_getConsentPolicyHeader() {
					return consentPolicyManager.getHeader()
				},
				setConsentPolicy(policy: ConsentPolicy) {
					return executeAndLogAsync(
						() => consentPolicyManager.setPolicy(policy),
						ConsentPolicyInteraction.SET_CONSENT_POLICY
					)
				},
				resetConsentPolicy() {
					return executeAndLogAsync(
						consentPolicyManager.resetPolicy,
						ConsentPolicyInteraction.RESET_CONSENT_POLICY
					)
				},
				onConsentPolicyChanged(handler: ConsentPolicyChangedHandler) {
					return executeAndLog(
						() => consentPolicyManager.onChanged(handler),
						ConsentPolicyInteraction.ON_CONSENT_POLICY_CHANGED
					)
				},
			},
			csrfToken,
		},
	}
}
