import { named, withDependencies } from '@wix/thunderbolt-ioc'
import type { ISessionProvider, SessionManagerSiteConfig } from './types'
import {
	DynamicModelSymbol,
	FetchAccessTokensSymbol,
	Fetch,
	LoggerSymbol,
	SiteFeatureConfigSymbol,
	Experiments,
	ExperimentsSymbol,
} from '@wix/thunderbolt-symbols'
import type { IFetchApi, ILogger, DynamicSessionModel, FetchDynamicModel } from '@wix/thunderbolt-symbols'
import { name } from './symbols'

export const ClientSessionProvider = withDependencies(
	[
		DynamicModelSymbol,
		FetchAccessTokensSymbol,
		named(SiteFeatureConfigSymbol, name),
		Fetch,
		ExperimentsSymbol,
		LoggerSymbol,
	],
	(
		dynamicModel: DynamicSessionModel,
		fetchAccessTokens: FetchDynamicModel,
		siteFeatureConfig: SessionManagerSiteConfig,
		fetchApi: IFetchApi,
		experiments: Experiments,
		logger: ILogger
	): ISessionProvider => {
		let currentSession: Partial<DynamicSessionModel> = dynamicModel

		return {
			getCurrentSession: () => {
				return currentSession
			},
			loadNewSession: async ({ authorizationCode }) => {
				try {
					const accessTokensEndpoint = siteFeatureConfig.accessTokensApiUrl

					if (experiments['specs.thunderbolt.hardenFetchAndXHR']) {
						currentSession = await fetchAccessTokens({
							credentials: 'same-origin',
							...(authorizationCode && { headers: { authorization: authorizationCode } }),
						})

						return currentSession
					} else {
						const res = await fetchApi.envFetch(accessTokensEndpoint, {
							credentials: 'same-origin',
							...(authorizationCode && { headers: { authorization: authorizationCode } }),
						})

						if (!res.ok) {
							throw new Error(`[${res.status}]${res.statusText}`)
						}

						currentSession = await res.json()
						return currentSession
					}
				} catch (error) {
					logger.captureError(new Error(`failed fetching dynamicModel`), {
						tags: { feature: 'session-manager', fetchFail: 'dynamicModel' },
						extra: { errorMessage: error.message },
					})
					throw error
				}
			},
		}
	}
)
