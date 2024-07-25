import { withDependencies, optional } from '@wix/thunderbolt-ioc'
import {
	CurrentRouteInfoSymbol,
	IPageResourceFetcher,
	SiteAssetsClientSym,
	ViewerModel,
	ViewerModelSym,
	ILogger,
	LoggerSymbol,
} from '@wix/thunderbolt-symbols'
import { SiteAssetsClientAdapter } from 'thunderbolt-site-assets-client'
import { errorPagesIds } from '@wix/thunderbolt-commons'
import { ICurrentRouteInfo } from 'feature-router'
import { IProtectedPagesApi, ProtectedPagesApiSymbol } from 'feature-protected-pages'

export const resourceFetcher: (
	viewerModel: ViewerModel,
	siteAssetsClient: SiteAssetsClientAdapter,
	currentRouteInfo: ICurrentRouteInfo,
	logger: ILogger,
	protectedPagesApiProvider?: IProtectedPagesApi
) => IPageResourceFetcher = (viewerModel, siteAssetsClient, currentRouteInfo, logger, protectedPagesApiProvider) => ({
	fetchResource(pageCompId, resourceType, extraModuleParams = {}) {
		const {
			siteAssets: { modulesParams, siteScopeParams },
			mode: { siteAssetsFallback },
		} = viewerModel

		const moduleParams = { ...modulesParams[resourceType], ...extraModuleParams }
		const isErrorPage = !!errorPagesIds[pageCompId]

		const pageJsonFileNames = siteScopeParams.pageJsonFileNames
		const pageJsonFileName =
			pageJsonFileNames[pageCompId] ||
			protectedPagesApiProvider?.getPageJsonFileName(pageCompId) ||
			currentRouteInfo.getCurrentRouteInfo()?.pageJsonFileName
		const bypassSsrInternalCache = viewerModel.experiments.bypassSsrInternalCache === true
		const shouldReportBi = !process.env.browser && resourceType === 'css' // reporting from SSR only and only the css
		if (shouldReportBi) {
			logger.interactionStarted(`site_assets_execute_${resourceType}`)
		}
		const siteAssetsResult = siteAssetsClient.execute(
			{
				moduleParams,
				pageCompId,
				...(pageJsonFileName ? { pageJsonFileName } : {}),
				...(isErrorPage
					? {
							pageCompId: isErrorPage ? 'masterPage' : pageCompId,
							errorPageId: pageCompId,
							pageJsonFileName: pageJsonFileNames.masterPage,
					  }
					: {}),
				bypassSsrInternalCache,
			},
			siteAssetsFallback
		)
		if (shouldReportBi) {
			logger.interactionEnded(`site_assets_execute_${resourceType}`)
		}
		return siteAssetsResult
	},
	getResourceUrl(pageCompId, resourceType): string {
		const {
			siteAssets: { modulesParams, siteScopeParams },
		} = viewerModel

		const moduleParams = modulesParams[resourceType]
		const isErrorPage = !!errorPagesIds[pageCompId]

		const pageJsonFileNames = siteScopeParams.pageJsonFileNames
		const pageJsonFileName =
			pageJsonFileNames[pageCompId] || currentRouteInfo.getCurrentRouteInfo()?.pageJsonFileName

		return siteAssetsClient.calcPublicModuleUrl({
			moduleParams,
			pageCompId,
			...(pageJsonFileName ? { pageJsonFileName } : {}),
			...(isErrorPage
				? {
						pageCompId: isErrorPage ? 'masterPage' : pageCompId,
						errorPageId: pageCompId,
						pageJsonFileName: pageJsonFileNames.masterPage,
				  }
				: {}),
		})
	},
})

export const PageResourceFetcher = withDependencies<IPageResourceFetcher>(
	[ViewerModelSym, SiteAssetsClientSym, CurrentRouteInfoSymbol, LoggerSymbol, optional(ProtectedPagesApiSymbol)],
	resourceFetcher
)
