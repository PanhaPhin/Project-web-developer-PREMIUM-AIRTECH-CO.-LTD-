import { ICurrentRouteInfo, CandidateRouteInfo, IRoutingMiddleware } from '@wix/thunderbolt-symbols'

export const getPageBackgroundId = (pageId: string) => `pageBackground_${pageId}`

export const refetchDynamicPageData = async (
	currentRouteInfo: ICurrentRouteInfo,
	dynamicPagesRoutingMiddleware?: IRoutingMiddleware
) => {
	const routeInfo = currentRouteInfo.getCurrentRouteInfo()

	if (routeInfo?.dynamicRouteData && dynamicPagesRoutingMiddleware) {
		// Call the handler to get the new dynamicRouteData after update
		const dynamicRouteInfo = await dynamicPagesRoutingMiddleware.handle({
			...routeInfo,
			// This needs to be undefined in order for the handler to trigger again
			pageId: undefined,
		} as Partial<CandidateRouteInfo>)
		if (dynamicRouteInfo?.dynamicRouteData) {
			// Update it on currentRouteInfo symbol
			currentRouteInfo.updateCurrentDynamicRouteInfo(dynamicRouteInfo.dynamicRouteData)
		}
	}
}
