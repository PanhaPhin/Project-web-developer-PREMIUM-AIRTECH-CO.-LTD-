import { makeStringClear } from '../helpers'

const CLIENT_HEADER = 'client-binding'

const blockedAllowedPaths = ['/_api/v1/access-tokens', '/_api/v2/dynamicmodel']

const cleanHeaders = (headers: Record<string, string> | Headers) => {
	if (headers instanceof Headers) {
		headers.forEach((_, header) => {
			if (decodeURIComponent(header).toLowerCase() === CLIENT_HEADER) {
				headers.delete(header)
			}
		})
	} else {
		Object.keys(headers).forEach((header) => {
			const decodedHeader = decodeURIComponent(header)
			if (decodedHeader.toLowerCase() === CLIENT_HEADER) {
				delete headers[header]
			}
		})
	}
	return headers
}

const getURLPath = (resource: RequestInfo | URL) => {
	let urlString
	if (globalThis.Request && resource instanceof Request) {
		urlString = resource.url
	} else if (typeof resource?.toString === 'function') {
		urlString = resource.toString()
	} else {
		throw new Error('Unsupported type for url')
	}

	let urlPath
	try {
		return new URL(urlString).pathname
	} catch (e) {
		// If it fails to parse the URL, it means it's a relative path
		urlPath = urlString.replace(/#.+/gi, '').split('?').shift()!
		return urlPath.startsWith('/') ? urlPath : `/${urlPath}`
	}
}

const isAllowedHTTPCall = (resource: RequestInfo | URL) => {
	let requestAllowed = true

	const urlPath = getURLPath(resource)
	const clearUrlPath = makeStringClear(urlPath)

	if (blockedAllowedPaths.some((path) => clearUrlPath.includes(path))) {
		requestAllowed = false
	}
	return requestAllowed
}

const processHeaders = (args: IArguments) => {
	if (globalThis.Request && args[0] instanceof Request && args[0]?.headers) {
		const filteredHeaders = cleanHeaders(args[0].headers)
		args[0] = new Request(args[0].url, { ...args[0], headers: filteredHeaders })
	} else if (args[0] instanceof URL && args[1]?.headers instanceof Headers) {
		args[1].headers = cleanHeaders(args[1].headers)
	} else if (args[1]?.headers) {
		args[1].headers = cleanHeaders(args[1].headers)
	}

	return args
}

export const overrideFetch = (module: any = globalThis) => {
	const originalFetch = fetch

	// Overriding the global fetch - blocking specific URLs
	// @ts-ignore
	module.defineStrictProperty('fetch', function () {
		const cleanArgs = processHeaders(arguments)
		if (!isAllowedHTTPCall(arguments[0])) {
			return new Promise((_resolve, reject) => {
				reject(new Error('TB002'))
			})
		} else {
			return originalFetch.apply(module, Array.from(cleanArgs) as [RequestInfo | URL, RequestInit?])
		}
	})
}

export const overrideXHR = (module: any = globalThis) => {
	const originalXMLHttpRequest = XMLHttpRequest

	// @ts-ignore
	module.defineStrictProperty('XMLHttpRequest', function () {
		const newRequest = new originalXMLHttpRequest()
		const originalOpen = newRequest.open
		const originalSetHeaders = newRequest.setRequestHeader
		newRequest.open = function () {
			const url = arguments[1]
			if (arguments.length < 2 || isAllowedHTTPCall(url)) {
				return originalOpen.apply(newRequest, Array.from(arguments) as any)
			} else {
				throw new Error('TB002')
			}
		}
		newRequest.setRequestHeader = function (key, value) {
			const headerName = decodeURIComponent(key)
			if (headerName.toLowerCase() !== CLIENT_HEADER) {
				originalSetHeaders.call(newRequest, key, value)
			}
		}
		return newRequest
	})
}
