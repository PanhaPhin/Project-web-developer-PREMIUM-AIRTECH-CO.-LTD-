import { optional, withDependencies } from '@wix/thunderbolt-ioc'
import {
	Component,
	IAppDidMountHandler,
	ILogger,
	IPerfReporterApi,
	IStructureAPI,
	LoggerSymbol,
	PerfReporterSymbol,
	Structure,
	ViewerModel,
	ViewerModelSym,
	IAppDidLoadPageHandler,
	NavigationManagerSymbol,
	INavigationManager,
} from '@wix/thunderbolt-symbols'
import { FeaturesLoaderSymbol, ILoadFeatures } from '@wix/thunderbolt-features'
import { OOICompDataSymbol, IOOICompData } from 'feature-ooi-tpa-shared-config'
import { getClosestCompIdByHtmlElement, extractClosestCompTypeFromHtmlElement, isSSR } from '@wix/thunderbolt-commons'
import { IWarmupDataProvider, WarmupDataProviderSymbol } from 'feature-warmup-data'
import { PageStructureWarmupData } from './types'
import { name } from './symbols'
import _ from 'lodash'

export default withDependencies<IAppDidMountHandler & IAppDidLoadPageHandler>(
	[
		FeaturesLoaderSymbol,
		ViewerModelSym,
		LoggerSymbol,
		Structure,
		WarmupDataProviderSymbol,
		NavigationManagerSymbol,
		optional(PerfReporterSymbol),
		optional(OOICompDataSymbol),
	],
	(
		featuresLoader: ILoadFeatures,
		viewerModel: ViewerModel,
		logger: ILogger,
		structureApi: IStructureAPI,
		warmupDataProvider: IWarmupDataProvider,
		navigationManager: INavigationManager,
		perfReporter?: IPerfReporterApi,
		ooiCompData?: IOOICompData
	) => {
		const compIdToTypeMap: { [compId: string]: string } = {}
		warmupDataProvider.getWarmupData<PageStructureWarmupData>(name).then((data) => {
			data && Object.assign(compIdToTypeMap, data.compIdToTypeMap)
		})
		return {
			appDidLoadPage() {
				Object.assign(
					compIdToTypeMap,
					_.mapValues(structureApi.getEntireStore(), (comp: Component) => comp.componentType)
				)
			},
			appDidMount: async () => {
				try {
					if (perfReporter) {
						const getCompDataByHtmlElement = (element: HTMLElement) => {
							const findClosestCompId = (currentElement: HTMLElement) => {
								let compId = getClosestCompIdByHtmlElement(currentElement)
								while (compId && !compIdToTypeMap[compId]) {
									const nextElement = document.getElementById(compId)?.parentElement
									if (!nextElement) {
										break
									}
									compId = getClosestCompIdByHtmlElement(nextElement)
								}
								return compId
							}
							const compId = findClosestCompId(element)
							if (!compId) {
								const compType = extractClosestCompTypeFromHtmlElement(element)
								return { compType: compType || 'not_found' }
							}
							// When navigating, sometimes the onINP is being sent after the structure was updated but before the page was rendered.
							// This means we successfully extract the compId from the html, but the component is no longer in the structure.
							const compType = compIdToTypeMap[compId]
							const basicData = {
								compType: compType || 'comp_not_found_in_structure',
								navigationParams: {
									lastNavigationTimings: navigationManager.getLastNavigationTimings(),
									isDuringNavigation: navigationManager.isDuringNavigation(),
								},
							}
							if (compType === 'tpaWidgetNative') {
								const ooiData = ooiCompData?.getCompDataByCompId(compId)
								return {
									widgetId: ooiData?.widgetId,
									appDefinitionId: ooiData?.appDefinitionId,
									...basicData,
								}
							}
							return basicData
						}
						if (!isSSR(window) && (process.env.NODE_ENV !== 'production' || viewerModel.mode.debug)) {
							// @ts-ignore
							window._getCompDataByHtmlElement = getCompDataByHtmlElement
						}

						perfReporter.update({ getHtmlElementMetadata: getCompDataByHtmlElement })
					}

					const features = [...featuresLoader.getLoadedPageFeatures(), ...viewerModel.siteFeatures]
					const components = Object.values(compIdToTypeMap)
					logger.meter(`page_features_loaded`, {
						customParams: {
							features,
							components,
						},
					})
				} catch {}
			},
		}
	}
)
