import { presetsTypes } from '@wix/fedops-presets'
import type { ViewerPlatformEssentials } from '@wix/fe-essentials-viewer-platform'
import type { FedopsConfig, Experiments } from '@wix/thunderbolt-symbols'
import {
	AppsMutingWhiteList,
	FEDOPS_WHITE_LIST,
	ThunderboltMutingBlackList,
	ThunderboltMutingWhiteList,
} from './constants'
// eslint-disable-next-line no-restricted-syntax
import type { FedopsLogger, IAppIdentifier } from '@wix/fedops-logger'
import { PanoramaPlatform, panoramaClientFactory } from '@wix/fe-essentials-viewer-platform/panorama-client'
import { getPanoramaGlobalConfig } from './panoramaConfig'

export type FedopsFactory = ViewerPlatformEssentials['createFedopsLogger']

export const createFedopsLogger = ({
	biLoggerFactory,
	customParams = {},
	phasesConfig = 'SEND_ON_FINISH',
	appName = 'thunderbolt',
	presetType = process.env.PACKAGE_NAME === 'thunderbolt-ds' ? presetsTypes.DS : presetsTypes.BOLT,
	reportBlackbox = false,
	paramsOverrides = {},
	factory,
	muteThunderboltEvents = false,
	experiments = {},
	monitoringData,
}: FedopsConfig & {
	factory: FedopsFactory
	experiments?: Experiments
	monitoringData: {
		metaSiteId: string
		dc: string
		isHeadless: boolean
		isCached: boolean
		rolloutData: {
			siteAssetsVersionsRollout: boolean
			isDACRollout: boolean
			isTBRollout?: boolean
		}
	}
}): FedopsLogger => {
	const fedopsLogger = factory(appName, {
		presetType,
		phasesConfig,
		isPersistent: true,
		isServerSide: !process.env.browser,
		reportBlackbox,
		customParams,
		biLoggerFactory,
		// @ts-ignore FEDINF-3725
		paramsOverrides,
		enableSampleRateForAppNames:
			!!experiments['specs.thunderbolt.fedops_enableSampleRateForAppNames'] ??
			(typeof window !== 'undefined' &&
				!!window?.viewerModel?.experiments['specs.thunderbolt.fedops_enableSampleRateForAppNames']),
	})

	const {
		interactionStarted,
		interactionEnded,
		appLoadingPhaseStart,
		appLoadingPhaseFinish,
		appLoadStarted,
		appLoaded,
	} = fedopsLogger

	const isPanoramaExperimentOpen = experiments['specs.thunderbolt.reportFedopsAndPanorama']
	const isFedopsMutingExperimentOpen = experiments['specs.thunderbolt.muteFedopsEvents']
	const shouldReportOnlyInPanorama = experiments['specs.thunderbolt.stopSendingAppLoadedInFedops']
	const isFedopsErrorMutingExperimentOpen = experiments['specs.thunderbolt.fedopsMuteErrors']

	const isWorker = () => process.env.browser && typeof window === 'undefined' // TODO: fix

	const isErrorReport = (overrides?: { evid?: string }) => overrides?.evid && parseInt(overrides.evid, 10) === 26

	const getPanoramaClient = () => {
		if (!process.env.browser || !isPanoramaExperimentOpen) {
			return null
		}

		const config = getPanoramaGlobalConfig()

		const msid = monitoringData?.metaSiteId ?? ''
		const dataCenter = monitoringData?.dc ?? ''
		const isHeadless = !!monitoringData?.isHeadless
		const isCached = !!monitoringData?.isCached
		const isRollout = !!monitoringData?.rolloutData?.isTBRollout
		const isDacRollout = !!monitoringData?.rolloutData?.isDACRollout
		const isSavRollout = !!monitoringData?.rolloutData?.siteAssetsVersionsRollout

		const panorama = panoramaClientFactory({
			baseParams: {
				platform: PanoramaPlatform.Viewer,
				msid,
				fullArtifactId: 'com.wixpress.html-client.wix-thunderbolt',
				componentId: appName,
			},
			data: {
				dataCenter,
				isHeadless,
				isCached,
				isRollout,
				isDacRollout,
				isSavRollout,
				isSsr: !process.env.browser,
				presetType,
				customParams,
			},
		}).withGlobalConfig(config)

		if (isWorker()) {
			panorama.withReporter((payload: any) => {
				const body = JSON.stringify({ messages: payload })

				fetch('https://panorama.wixapps.net/api/v1/bulklog', {
					method: 'POST',
					body,
					keepalive: true,
				}).catch((e) => {
					console.log(e)
				})

				return true
			})
		}

		return panorama.client()
	}

	const panoramaClient = getPanoramaClient()

	const reportPanoramaLoad = (isStartEvent: boolean) => {
		if (!panoramaClient || isWorker()) {
			return
		}

		if (isStartEvent) {
			panoramaClient.reportLoadStart()
		} else {
			panoramaClient.reportLoadFinish()
		}
	}

	const reportPanoramaError = (overrides: { errorInfo?: string; errorType?: string } = {}) => {
		if (!panoramaClient) {
			return
		}

		const { errorInfo, errorType } = overrides
		const error = new Error(errorInfo)

		panoramaClient?.errorMonitor().reportError(error, {
			errorName: errorType,
			environment: 'Viewer',
		})
	}

	const reportPanoramaTransaction = (eventName: string, isStartEvent: boolean) => {
		if (!panoramaClient) {
			return
		}

		const eventNameWithoutSpaces = eventName.replaceAll(' ', '_')

		if (isStartEvent) {
			panoramaClient.transaction(eventNameWithoutSpaces).start()
		} else {
			panoramaClient.transaction(eventNameWithoutSpaces).finish()
		}
	}

	const shouldReportToFedops = (event: string, params?: IAppIdentifier, overrides?: any) => {
		if (
			(isFedopsMutingExperimentOpen && !FEDOPS_WHITE_LIST.has(event)) ||
			(isFedopsErrorMutingExperimentOpen && isErrorReport(overrides))
		) {
			return false
		}

		// ONLY THUNDERBOLT (APP_ID===UNDEFINED) AND APPS THAT WERE WHITELISTED SHOULD BE SAMPLED
		const appShouldReportAll = params?.appId ? !AppsMutingWhiteList.has(params.appId) : false

		// muteThunderboltEvents = false => event shouldn't muted => event should be reported
		const shouldAlwaysReportEvent = ThunderboltMutingBlackList.has(event)
		const shouldAlwaysMuteEvent = ThunderboltMutingWhiteList.has(event)

		const isSiteAssetsModule = !!overrides?.siteAssetsModule
		if (isSiteAssetsModule) {
			// for specific site-assets requests without eventName
			return true
		}

		return shouldAlwaysReportEvent || appShouldReportAll || (!shouldAlwaysMuteEvent && !muteThunderboltEvents)
	}

	// This is done this way because FedopsLogger is a class and not an Object,
	// Therefor if we return an object it will crash because it operates on 'this' which does not exist in an object
	// so we can't make it immutable.

	fedopsLogger.interactionStarted = (interaction: string, params?) => {
		if (isErrorReport(params?.paramsOverrides)) {
			reportPanoramaError(params?.paramsOverrides)
		} else if (!isWorker()) {
			reportPanoramaTransaction(interaction, true)
		}

		if (shouldReportToFedops(interaction, undefined, params?.paramsOverrides)) {
			return interactionStarted.call(fedopsLogger, interaction, params)
		} else {
			try {
				performance.mark(`${interaction} started`)
			} catch {}
		}
		return { timeoutId: 0 }
	}

	fedopsLogger.interactionEnded = (interaction: string, params?) => {
		if (!isWorker()) {
			reportPanoramaTransaction(interaction, false)
		}

		if (shouldReportToFedops(interaction)) {
			interactionEnded.call(fedopsLogger, interaction, params)
		} else {
			try {
				performance.mark(`${interaction} ended`)
			} catch {}
		}
	}

	fedopsLogger.appLoadingPhaseStart = (phase: string, params?: IAppIdentifier) => {
		reportPanoramaTransaction(phase, true) // Will also report from worker

		if (shouldReportToFedops(phase, params)) {
			appLoadingPhaseStart.call(fedopsLogger, phase, params)
		} else {
			try {
				performance.mark(`${phase} started`)
			} catch {}
		}
	}

	fedopsLogger.appLoadingPhaseFinish = (phase: string, params?: IAppIdentifier, options?: any) => {
		reportPanoramaTransaction(phase, false) // Will also report from worker

		if (shouldReportToFedops(phase, params)) {
			appLoadingPhaseFinish.call(fedopsLogger, phase, params, options)
		} else {
			try {
				performance.mark(`${phase} finished`)
			} catch {}
		}
	}

	fedopsLogger.appLoadStarted = (params) => {
		reportPanoramaLoad(true)
		if (!shouldReportOnlyInPanorama) {
			appLoadStarted.call(fedopsLogger, params)
		}
	}

	fedopsLogger.appLoaded = (params) => {
		reportPanoramaLoad(false)
		if (!shouldReportOnlyInPanorama) {
			appLoaded.call(fedopsLogger, params)
		}
	}
	return fedopsLogger
}
