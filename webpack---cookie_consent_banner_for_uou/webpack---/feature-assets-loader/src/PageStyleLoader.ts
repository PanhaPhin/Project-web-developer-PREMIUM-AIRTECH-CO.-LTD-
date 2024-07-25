import { multi, withDependencies } from '@wix/thunderbolt-ioc'
import {
	CssFetcherSymbol,
	CssSiteAssetsParams,
	DomReadySymbol,
	Experiments,
	ExperimentsSymbol,
	HeadContentSymbol,
	ICssFetcher,
	IHeadContent,
	ILogger,
	IPageResourceFetcher,
	LoggerSymbol,
	PageResourceFetcherSymbol,
	ViewerModel,
	ViewerModelSym,
} from '@wix/thunderbolt-symbols'
import { LocalClientCssFetcher } from './LocalClientPageStyleLoader'

// compCssMappers has to be the last feature to run

const featuresToIgnoreList = ['stylableCss', 'compCssMappers']
const getFeaturesToRunInIsolation = (requestUrl: string) =>
	new URL(requestUrl).searchParams.get('cssFeaturesToIsolate')?.split(',') || featuresToIgnoreList

const fetchCssInParallel = async (
	featuresToRunInIsolation: Array<string>,
	fetcher: (params: Partial<CssSiteAssetsParams>) => Promise<{ css: string }>
) => {
	const results = await Promise.all([
		fetcher({ featuresToIgnore: featuresToRunInIsolation.join(',') }),
		...featuresToRunInIsolation.map((feature) => fetcher({ featuresToRun: feature })),
	])
	return results.map((result) => result.css).join('\n')
}

export type ILoadPageStyle = {
	load(pageId: string): Promise<void>
}

export const PageMainCssFetcher = withDependencies<ICssFetcher>(
	[PageResourceFetcherSymbol],
	(pageResourceFetcher: IPageResourceFetcher) => ({
		id: 'css',
		fetch: (pageId, extraModuleParams) => pageResourceFetcher.fetchResource(pageId, 'css', extraModuleParams),
	})
)

export const toDomId = (id: string, pageId: string) => `${id}_${pageId}`

export const ClientPageStyleLoader = withDependencies<ILoadPageStyle>(
	[DomReadySymbol, multi(CssFetcherSymbol), ViewerModelSym, ExperimentsSymbol, LoggerSymbol],
	(
		domReadyPromise: Promise<void>,
		cssFetchers: Array<ICssFetcher>,
		viewerModel: ViewerModel,
		experiments: Experiments,
		logger: ILogger
	) => {
		const featuresToRunInIsolation = getFeaturesToRunInIsolation(viewerModel.requestUrl)
		return {
			async load(pageId): Promise<void> {
				await domReadyPromise
				await logger.runAsyncAndReport(
					async () =>
						Promise.all(
							cssFetchers.map(async (cssFetcher) => {
								if (viewerModel.siteAssets.modulesParams.css.shouldRunCssInBrowser) {
									return LocalClientCssFetcher(cssFetcher, pageId, viewerModel)
								}
								const id = toDomId(cssFetcher.id, pageId)
								if (document.getElementById(id)) {
									return
								}

								const shouldSplitCssGeneration =
									experiments['specs.thunderbolt.splitCssRequest'] && pageId !== 'masterPage'
								let css = ''
								if (shouldSplitCssGeneration) {
									css = await fetchCssInParallel(featuresToRunInIsolation, (config) =>
										cssFetcher.fetch(pageId, config)
									)
								} else {
									const all = await cssFetcher.fetch(pageId)
									css = all.css
								}

								const styleElement = window.document.createElement('style')
								styleElement.setAttribute('id', id)
								styleElement.innerHTML = css
								if (window.viewerModel.experiments['specs.thunderbolt.pagesCssInHead']) {
									window.document.head.appendChild(styleElement)
								} else {
									window.document.getElementById('pages-css')!.appendChild(styleElement)
								}
							})
						),
					'ClientPageStyleLoader',
					'fetchClientCss'
				)
			},
		}
	}
)

export const ServerPageStyleLoader = withDependencies<ILoadPageStyle>(
	[HeadContentSymbol, multi(CssFetcherSymbol), ExperimentsSymbol, LoggerSymbol, ViewerModelSym],
	(
		headContent: IHeadContent,
		cssFetchers: Array<ICssFetcher>,
		experiments: Experiments,
		logger: ILogger,
		viewerModel: ViewerModel
	) => {
		const featuresToRunInIsolation = getFeaturesToRunInIsolation(viewerModel.requestUrl)

		return {
			async load(pageId) {
				await logger.runAsyncAndReport(
					async () => {
						const shouldSplitCssGeneration =
							experiments['specs.thunderbolt.splitCssRequest'] && pageId !== 'masterPage'
						let styles = []
						if (shouldSplitCssGeneration) {
							styles = await Promise.all(
								cssFetchers.map(async ({ id, fetch }) => {
									const css = await fetchCssInParallel(featuresToRunInIsolation, (config) =>
										fetch(pageId, config)
									)

									return {
										id,
										css,
									}
								})
							)
						} else {
							styles = await Promise.all(
								cssFetchers.map(async ({ id, fetch }) => {
									const { css } = await fetch(pageId)
									return {
										id,
										css,
									}
								})
							)
						}

						styles.forEach(({ id, css }) => {
							headContent.addPageCss(`<style id="${toDomId(id, pageId)}">${css}</style>`)
						})
					},
					'ServerPageStyleLoader',
					'fetchServerCss'
				)
			},
		}
	}
)
