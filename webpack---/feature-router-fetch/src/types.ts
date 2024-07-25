import { RouterFetchData, ViewerModel } from '@wix/thunderbolt-symbols'
import { FetchParams } from 'feature-router'

export type RouterFetchSiteConfig = { externalBaseUrl: string; viewMode: ViewerModel['viewMode'] }

export enum RouterFetchRequestTypes {
	PAGES = 'pages',
	SITEMAP = 'sitemap',
	Lightboxes = 'lightboxes',
}

type LightboxesFetchAdditionalData = { lightboxId: string }
type DynamicPagesFetchAdditionalData = { routerSuffix: string; queryParams: string }
export type RouterFetchAdditionalData = LightboxesFetchAdditionalData | DynamicPagesFetchAdditionalData

export type RouterFetchAPI = {
	getFetchParams: (
		requestType: RouterFetchRequestTypes,
		routerFetchData: RouterFetchData,
		additionalData: RouterFetchAdditionalData
	) => FetchParams
}
