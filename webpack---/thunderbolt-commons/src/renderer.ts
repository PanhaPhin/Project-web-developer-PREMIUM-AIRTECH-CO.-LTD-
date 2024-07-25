import type { FetchFn } from '@wix/thunderbolt-symbols'

export const rendererTypeQueryParam = 'wix-renderer-type'

export const fetchMainGridAppId = async (fetchFn: FetchFn, siteId: string) => {
	const mainGridAppId = await fetchFn(
		`https://www.wix.com/_serverless/thunderless/getGridAppId?siteId=${siteId}`
	).then((res) => res.json())
	return mainGridAppId?.gridAppId
}
