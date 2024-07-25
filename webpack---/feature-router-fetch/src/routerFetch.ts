import { withDependencies, named, optional } from '@wix/thunderbolt-ioc'
import {
	SiteFeatureConfigSymbol,
	RouterFetchData,
	ISessionManager,
	IMultilingual,
	BrowserWindow,
	BrowserWindowSymbol,
	ExperimentsSymbol,
	Experiments,
} from '@wix/thunderbolt-symbols'
import { FetchParams } from 'feature-router'
import { SessionManagerSymbol } from 'feature-session-manager'
import { CommonConfigSymbol, ICommonConfig } from 'feature-common-config'
import { MultilingualSymbol } from 'feature-multilingual'
import { getCSRFToken } from '@wix/thunderbolt-commons'
import type { RouterFetchRequestTypes, RouterFetchAPI, RouterFetchAdditionalData, RouterFetchSiteConfig } from './types'
import { name } from './symbols'

const addQueryParam = (url: string, paramName: string, paramValue: string): string => {
	const parsedUrl = new URL(url)
	parsedUrl.searchParams.append(paramName, paramValue)

	return parsedUrl.toString()
}

export const RouterFetch = withDependencies(
	[
		named(SiteFeatureConfigSymbol, name),
		SessionManagerSymbol,
		CommonConfigSymbol,
		BrowserWindowSymbol,
		ExperimentsSymbol,
		optional(MultilingualSymbol),
	],
	(
		{ externalBaseUrl, viewMode }: RouterFetchSiteConfig,
		sessionManager: ISessionManager,
		commonConfigAPI: ICommonConfig,
		window: BrowserWindow,
		experiments: Experiments,
		multiLingual?: IMultilingual
	): RouterFetchAPI => {
		const getHeaders = (routerFetchData: RouterFetchData) => {
			// Hard coded UUID for multilingual support https://wix.slack.com/archives/C04BFK71QHW/p1676992832913939 .
			const multiLingualUUID = '00000000-0000-0000-0000-000000000000'

			return {
				...(process.env.PACKAGE_NAME === 'thunderbolt-ds'
					? {}
					: { commonConfig: JSON.stringify(commonConfigAPI.getCommonConfig()) }),
				...routerFetchData.optionsData.headers,
				...(multiLingual
					? {
							'x-wix-linguist': `${multiLingual!.currentLanguage.languageCode}|${
								multiLingual!.currentLanguage.locale
							}|${multiLingual!.currentLanguage.isPrimaryLanguage}|${multiLingualUUID}`,
					  }
					: {}),
			}
		}

		const getData = (routerFetchData: RouterFetchData, additionalData: RouterFetchAdditionalData): string => {
			const { routerPrefix, config, pageRoles, roleVariations } = routerFetchData.optionsData.bodyData
			const commonData = {
				routerPrefix,
				config,
				pageRoles,
				requestInfo: {
					env: process.env.browser ? 'browser' : 'backend',
					formFactor: viewMode,
				},
			}

			if ('lightboxId' in additionalData) {
				const { lightboxId } = additionalData
				return JSON.stringify({ ...commonData, lightboxId })
			} else {
				const { routerSuffix, queryParams } = additionalData
				const fullUrl = `${externalBaseUrl}${routerPrefix}${routerSuffix}${queryParams}`
				return JSON.stringify({ ...commonData, routerSuffix, fullUrl, roleVariations })
			}
		}

		const getFetchParams = (
			requestType: RouterFetchRequestTypes,
			routerFetchData: RouterFetchData,
			additionalData: RouterFetchAdditionalData
		): FetchParams => {
			const { basePath, queryParams, appDefinitionId } = routerFetchData.urlData

			const authorizationHeader = sessionManager.getAppInstanceByAppDefId(routerFetchData.wixCodeAppDefinitionId)
			if (authorizationHeader) {
				routerFetchData.optionsData.headers!['Authorization' as string] = authorizationHeader
			}
			if (process.env.browser) {
				routerFetchData.optionsData.headers!['X-XSRF-TOKEN' as string] = getCSRFToken(window?.document?.cookie)
			}

			const shouldSendGETRequest =
				!!experiments['specs.thunderbolt.dynamicPagesReplacePostWithGet'] && queryParams.includes('gridAppId')

			const method = shouldSendGETRequest ? 'GET' : 'POST'
			const data = getData(routerFetchData, additionalData)

			const url = `${basePath}/${requestType}?${queryParams}`
			const instance = sessionManager.getAppInstanceByAppDefId(appDefinitionId) as string
			const urlWithInstance = addQueryParam(url, 'instance', instance)
			const urlWithPayload = addQueryParam(url, 'payload', data)
			const requestUrl = shouldSendGETRequest ? urlWithPayload : urlWithInstance

			return {
				url: requestUrl,
				options: {
					method,
					headers: getHeaders(routerFetchData),
					...(shouldSendGETRequest ? {} : { body: data }),
					...(routerFetchData.optionsData.credentials
						? { credentials: routerFetchData.optionsData.credentials }
						: {}),
					...(routerFetchData.optionsData.mode ? { mode: routerFetchData.optionsData.mode } : {}),
				},
			}
		}

		return {
			getFetchParams,
		}
	}
)
