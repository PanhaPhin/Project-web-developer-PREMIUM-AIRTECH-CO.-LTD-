import type { IocContainer } from '@wix/thunderbolt-ioc'
import type { RendererProps } from 'feature-react-renderer'
import type { Environment } from '@wix/thunderbolt-environment'
import { createEnvLoader } from '@wix/thunderbolt-environment'
import {
	MasterPageFeatureConfigSymbol,
	PageAssetsLoaderSymbol,
	RendererSymbol,
	DynamicModelSymbol,
	FetchAccessTokensSymbol,
	BrowserWindowSymbol,
} from '@wix/thunderbolt-symbols'
import type {
	BIReporter,
	DynamicSessionModel,
	FetchDynamicModel,
	FeatureName,
	IFetchApi,
	ILogger,
	IPageAssetsLoader,
	IRenderer,
	BrowserWindow,
} from '@wix/thunderbolt-symbols'
import { taskify, yieldToMain } from '@wix/thunderbolt-commons'
import { tbReady } from './security'
import type { IThunderbolt, IThunderboltInitializer } from './types'
import { Thunderbolt } from './symbols'

const RENDERER_FEATURES: Set<FeatureName> = new Set([
	'renderer',
	'ooi',
	'componentsLoader',
	'stores',
	'translations',
	'businessLogger',
	'assetsLoader',
	'sessionManager',
	'consentPolicy',
	'commonConfig',
	'componentsReact',
	'router',
	'navigationManager',
	'warmupData',
	'thunderboltInitializer',
])

export const loadMasterPageFeaturesConfigs = async (container: IocContainer) => {
	// This adds the master page structure and props to the fetchCache
	const assetsLoader = await container.getAsync<IPageAssetsLoader>(PageAssetsLoaderSymbol)
	const siteFeaturesConfigs = await assetsLoader.load('masterPage').siteFeaturesConfigs

	Object.entries(siteFeaturesConfigs).forEach(([featureName, featureConfig]) => {
		container.bind(MasterPageFeatureConfigSymbol).toConstantValue(featureConfig).whenTargetNamed(featureName)
	})
}

const loadDynamicModel = ({
	accessTokensHandler,
	biReporter,
	logger,
	window,
}: {
	accessTokensHandler?: FetchDynamicModel
	biReporter: BIReporter
	logger: ILogger
	fetchApi: IFetchApi
	window: NonNullable<BrowserWindow>
}) => {
	const applyModelData = ({ visitorId, siteMemberId }: DynamicSessionModel) => {
		biReporter.setDynamicSessionData({ visitorId, siteMemberId })
	}
	const onDynamicModelError = (e: Error, attempt: number) =>
		logger.captureError(e, {
			tags: { feature: 'feature-thunderbolt-initializer', fetchFail: 'dynamicModel' },
			extra: { errorMessage: e.message, attempt },
		})

	let dynamicModelPromise = window.dynamicModelPromise

	const isHardenFetchAndXHR =
		window.viewerModel.experiments['specs.thunderbolt.hardenFetchAndXHR'] && !!accessTokensHandler
	if (isHardenFetchAndXHR) {
		dynamicModelPromise = accessTokensHandler()
	}

	// @ts-ignore
	window?.sentryBuffer?.forEach((error: Error) => {
		logger.captureError(error, { tags: { feature: 'sentryBuffer' } })
	})

	return dynamicModelPromise
		.then((dynamicModel) => {
			applyModelData(dynamicModel as DynamicSessionModel)
			return dynamicModel
		})
		.catch((err) => {
			onDynamicModelError(err, 1)

			if (!isHardenFetchAndXHR) {
				window.dynamicModelPromise = window.fetchDynamicModel()
			}

			dynamicModelPromise = isHardenFetchAndXHR ? accessTokensHandler() : window.dynamicModelPromise

			return dynamicModelPromise
				.then((dynamicModel) => {
					applyModelData(dynamicModel as DynamicSessionModel)
					return dynamicModel
				})
				.catch((e) => {
					onDynamicModelError(e, 2)
				})
		}) as Promise<DynamicSessionModel>
}

export const getThunderboltInitializer = (container: IocContainer): IThunderboltInitializer => {
	let environment: Environment | null = null

	const initializer: IThunderboltInitializer = {
		getRenderer: async <T>() => {
			const { specificEnvFeaturesLoaders, biReporter, viewerModel, fetchApi, logger, experiments } = environment!
			try {
				logger.phaseStarted(`loadSiteFeatures_renderFeaturesOnly`)
				await yieldToMain()
				await specificEnvFeaturesLoaders.loadSiteFeatures(
					container,
					viewerModel.siteFeatures.filter((x) => RENDERER_FEATURES.has(x))
				)

				logger.phaseEnded(`loadSiteFeatures_renderFeaturesOnly`)
				logger.phaseStarted(`loadMasterPageFeaturesConfigs`)
				await yieldToMain()
				await loadMasterPageFeaturesConfigs(container)
				await yieldToMain()
				logger.phaseEnded(`loadMasterPageFeaturesConfigs`)
				if (process.env.browser) {
					const window: NonNullable<BrowserWindow> = container.get(BrowserWindowSymbol)
					if (experiments['specs.thunderbolt.reactScriptsBeforeApp']) {
						await window.externalsRegistry.react.loaded
					}
					logger.phaseStarted(`loadDynamicModel`)
					let accessTokensHandler: FetchDynamicModel | undefined
					if (window.viewerModel.experiments['specs.thunderbolt.hardenFetchAndXHR']) {
						accessTokensHandler = await tbReady(window, logger)
					}
					const dynamicModel = await taskify(() =>
						loadDynamicModel({ accessTokensHandler, biReporter, logger, fetchApi, window })
					)
					container.bind(FetchAccessTokensSymbol).toConstantValue(accessTokensHandler)
					container.bind(DynamicModelSymbol).toConstantValue(dynamicModel)
					logger.phaseEnded(`loadDynamicModel`)
				}
			} catch (e) {
				logger.captureError(e, {
					tags: { feature: 'feature-thunderbolt-initializer', phase: 'get_renderer' },
					groupErrorsBy: 'values',
				})
				throw e
			}
			return container.getAsync<IRenderer<RendererProps, T>>(RendererSymbol)
		},
		loadEnvironment: (env) => {
			environment = env
			container.load(createEnvLoader(environment))
		},
		loadSiteFeatures: async () => {
			const { viewerModel, specificEnvFeaturesLoaders, logger } = environment!
			logger.phaseStarted(`loadSiteFeatures`)
			await taskify(() =>
				specificEnvFeaturesLoaders.loadSiteFeatures(
					container,
					viewerModel.siteFeatures.filter((x) => !RENDERER_FEATURES.has(x))
				)
			)
			logger.phaseEnded(`loadSiteFeatures`)
		},
		getThunderboltInvoker: async <T extends IThunderbolt>() => {
			return async () => {
				const { logger } = environment!
				logger.phaseStarted(`container_get_thunderbolt`)
				const thunderbolt = await container.getAsync<T>(Thunderbolt)
				logger.phaseEnded(`container_get_thunderbolt`)
				logger.phaseEnded(`container_get_thunderbolt`)
				logger.phaseStarted(`thunderbolt_ready`)
				await taskify(() => thunderbolt.ready())
				logger.phaseEnded(`thunderbolt_ready`)
				return thunderbolt
			}
		},
	}

	return initializer
}
