/* To enhance security for the access-tokens endpoint, when the thunderbolt app is ready, we are doing the following:
1. Creating and hardening window.tb.init function - if it already exists it means we've been compromised
2. Dispatching a tbReady event which which will be caught in the main-head.ejs file which loads handleAccessTokens.ts
3. Triggering The window.tb.init will be triggered in turn with the original fetch function (and not the hardened one which prevents calls to the access-tokens endpoint)
4. Resolving our promise with a function that fetches the access tokens */

import type { BrowserWindow, DynamicSessionModel, ILogger } from '@wix/thunderbolt-symbols'

type FetchFn = (input: RequestInfo, init?: RequestInit) => Promise<Response>

const THUNDERBOLT_READY_EVENT_NAME = 'tbReady'
const FETCH_TIMEOUT = 5000
const EVENT_TIMEOUT = 3000

const getAccessTokensHandler = (
	window: NonNullable<BrowserWindow>,
	fetchFn: FetchFn,
	fetchHeaders: Record<string, string>
) => (fetchArgs: RequestInit = {}): Promise<DynamicSessionModel | {}> => {
	const accessTokenEndpoint = window.viewerModel.accessTokensUrl

	const processedFetchArgs = { ...fetchArgs, headers: { ...(fetchArgs.headers || {}), ...fetchHeaders } }

	return new Promise(function (resolve, reject) {
		if (window.viewerModel.siteFeaturesConfigs.sessionManager.isRunningInDifferentSiteContext) {
			resolve({})
		} else {
			function fetchAccessTokens() {
				fetchFn(accessTokenEndpoint, processedFetchArgs)
					.then((res: Response) => {
						if (!res.ok) {
							throw new Error(`[${res.status}]${res.statusText}`)
						}
						return res.json()
					})
					.then((data: DynamicSessionModel) => {
						clearTimeout(timeoutId)
						resolve(data)
					})
					.catch((e: Error) => {
						clearTimeout(timeoutId)
						reject(e)
					})
			}

			const timeoutId = setTimeout(() => {
				reject(new Error('Timeout occurred while waiting for access tokens response.'))
			}, FETCH_TIMEOUT)

			fetchAccessTokens()
		}
	})
}

const hardenThunderboltInit = (
	window: NonNullable<BrowserWindow>,
	resolve: Function,
	timeoutId: NodeJS.Timeout,
	logger: ILogger
) => {
	try {
		Object.defineProperty(window, 'tb', {
			value: {},
			writable: false,
			enumerable: false,
			configurable: false,
		})
		// @ts-ignore
		Object.defineProperty(window.tb, 'init', {
			value: ({ fetch, fetchHeaders }: { fetch: FetchFn; fetchHeaders: Record<string, string> }) => {
				resolve(getAccessTokensHandler(window, fetch, fetchHeaders))
				clearTimeout(timeoutId)
			},
			writable: false,
			enumerable: false,
			configurable: false,
		})
	} catch (e) {
		logger.captureError(new Error('TB001'), { tags: { feature: 'feature-thunderbolt-initializer' } })

		if (window?.viewerModel?.mode.debug) {
			console.error(e)
		}
	}
}

// This event is dispatched when thunderbolt app loaded
// We receive the original fetch here and use it to generate a function to fetch the access tokens
export const tbReady = (
	window: NonNullable<BrowserWindow>,
	logger: ILogger
): Promise<(fetchArgs?: RequestInit) => Promise<DynamicSessionModel>> => {
	return new Promise(function (resolve, reject) {
		const timeoutId = setTimeout(() => {
			reject(new Error(`Timeout occurred while waiting for ${THUNDERBOLT_READY_EVENT_NAME} event.`))
		}, EVENT_TIMEOUT)

		hardenThunderboltInit(window, resolve, timeoutId, logger)
		window.dispatchEvent(new CustomEvent(THUNDERBOLT_READY_EVENT_NAME, { detail: { logger } }))
	})
}
