import { named, withDependencies } from '@wix/thunderbolt-ioc'
import {
	DynamicPagesAPI,
	ICurrentRouteInfo,
	IRoutingMiddleware,
	IUrlHistoryManager,
	UrlHistoryManagerSymbol,
} from 'feature-router'
import { isSSR } from '@wix/thunderbolt-commons'
import {
	Fetch,
	IFetchApi,
	SiteFeatureConfigSymbol,
	CurrentRouteInfoSymbol,
	BrowserWindow,
	BrowserWindowSymbol,
	ExperimentsSymbol,
	Experiments,
} from '@wix/thunderbolt-symbols'
import type {
	DynamicPagesSiteConfig,
	IDynamicPagesResponseHandler,
	IDynamicPagesWarmupData,
	IPermissionsHandlerProvider,
} from './types'
import { DynamicPagesResponseHandlerSymbol, name, PermissionsHandlerProviderSymbol } from './symbols'
import { errorPagesIds, getRouterPrefix, getRouterSuffix } from './utils'
import { IWarmupDataProvider, WarmupDataProviderSymbol } from 'feature-warmup-data'
import { RouterFetchSymbol, RouterFetchAPI, RouterFetchRequestTypes } from 'feature-router-fetch'

async function jsonStringifyGzipBase64(obj: any) {
	// ReferenceError: Blob is not defined
	const jsonBlob = new Blob([JSON.stringify(obj)], { type: 'application/json' })
	const compressionStream = new (window as any).CompressionStream('gzip')
	const compressedStream = jsonBlob.stream().pipeThrough(compressionStream)
	const compressedBlob = await new (window as any).Response(compressedStream).blob()

	return new Promise((resolve, reject) => {
		const reader = new (window as any).FileReader()
		reader.onloadend = () => resolve(reader.result.split(',')[1])
		reader.onerror = reject
		reader.readAsDataURL(compressedBlob)
	})
}

export const DynamicPages = withDependencies(
	[
		named(SiteFeatureConfigSymbol, name),
		BrowserWindowSymbol,
		Fetch,
		UrlHistoryManagerSymbol,
		DynamicPagesResponseHandlerSymbol,
		PermissionsHandlerProviderSymbol,
		CurrentRouteInfoSymbol,
		WarmupDataProviderSymbol,
		RouterFetchSymbol,
		ExperimentsSymbol,
	],
	(
		{ prefixToRouterFetchData, routerPagesSeoToIdMap }: DynamicPagesSiteConfig,
		browserWindow: BrowserWindow,
		fetchApi: IFetchApi,
		urlHistoryManager: IUrlHistoryManager,
		{ handleResponse }: IDynamicPagesResponseHandler,
		permissionsHandlerProvider: IPermissionsHandlerProvider,
		currentRouteInfo: ICurrentRouteInfo,
		warmupDataProvider: IWarmupDataProvider,
		{ getFetchParams }: RouterFetchAPI,
		experiments: Experiments
	): IRoutingMiddleware & DynamicPagesAPI => {
		const getWarmupDynamicRouteInfo = () => {
			const currentRoute = currentRouteInfo.getCurrentRouteInfo()
			if (!experiments['specs.thunderbolt.dynamicPagesWarmupData2'] || currentRoute) {
				return null
			}

			// we don't want to wait for it, only use it if we already have it (i.e. documentReady)
			return warmupDataProvider.getWarmupData<IDynamicPagesWarmupData>(name, { timeout: 0 })
		}

		return {
			getSitemapFetchParams(routerPrefix) {
				const routerFetchData = prefixToRouterFetchData[routerPrefix]
				if (!routerFetchData) {
					return null
				}

				const relativeEncodedUrl = urlHistoryManager.getRelativeEncodedUrl()
				const queryParams = urlHistoryManager.getParsedUrl().search
				const routerSuffix = getRouterSuffix(relativeEncodedUrl)
				return getFetchParams(RouterFetchRequestTypes.SITEMAP, routerFetchData, { routerSuffix, queryParams })
			},
			async handle(routeInfo) {
				if (!routeInfo.pageId && routeInfo.relativeUrl && routeInfo.parsedUrl && routeInfo.relativeEncodedUrl) {
					const routerPrefix = getRouterPrefix(routeInfo.relativeUrl)
					const routerFetchData = prefixToRouterFetchData[routerPrefix]

					if (!routerFetchData) {
						if (routerPagesSeoToIdMap[routerPrefix]) {
							return {
								...routeInfo,
								pageId: errorPagesIds.NOT_FOUND,
							}
						}
						return routeInfo
					}

					const warmupDynamicRouteInfo = await getWarmupDynamicRouteInfo()
					if (warmupDynamicRouteInfo) {
						return {
							...routeInfo,
							...warmupDynamicRouteInfo,
						}
					}

					const routerSuffix = getRouterSuffix(routeInfo.relativeEncodedUrl)
					const queryParams = routeInfo.parsedUrl.search
					const { url, options } = getFetchParams(RouterFetchRequestTypes.PAGES, routerFetchData, {
						routerSuffix,
						queryParams,
					})

					if (experiments['specs.thunderbolt.DPRPagesGet'] && !isSSR(browserWindow)) {
						try {
							const requestUrl = new URL(url)
							const urlParams = Object.fromEntries(requestUrl.searchParams)
							delete urlParams.instance
							const compressedEncodedBody = (await jsonStringifyGzipBase64({
								urlParams,
								body: JSON.parse(options.body as string),
							})) as string

							if (compressedEncodedBody.length <= 2048) {
								const fetchUrl = `${requestUrl.origin}${requestUrl.pathname}?${compressedEncodedBody}`
								const fetchOptions = { method: 'GET', headers: options.headers }

								const routeInfoFromResponsePromise = handleResponse(
									fetchApi.envFetch(fetchUrl, fetchOptions),
									routeInfo
								)
								return permissionsHandlerProvider
									.getHandler()
									.handle(routeInfoFromResponsePromise, routeInfo)
							}
						} catch {}
					}
					const routeInfoFromResponsePromise = handleResponse(fetchApi.envFetch(url, options), routeInfo)
					return permissionsHandlerProvider.getHandler().handle(routeInfoFromResponsePromise, routeInfo)
				}

				return routeInfo
			},
		}
	}
)
