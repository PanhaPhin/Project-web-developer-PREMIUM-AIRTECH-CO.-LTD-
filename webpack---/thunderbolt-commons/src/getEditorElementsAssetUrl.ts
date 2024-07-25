import { whitelistedEndpoints } from './whitelistedEndpoints'

export const EditorElementsPath = `services/editor-elements/dist/`

export const isSafeUrl = (urlFromTestsOrFileVersion: URL, validUrls: Array<URL> = whitelistedEndpoints) => {
	return validUrls.some((endpoint) => {
		return (
			urlFromTestsOrFileVersion.hostname === endpoint.hostname &&
			urlFromTestsOrFileVersion.protocol === endpoint.protocol &&
			urlFromTestsOrFileVersion.pathname.startsWith(endpoint.pathname)
		)
	})
}

export const getEditorElementsAssetUrl = (urlFromTestsOrFileVersion: string, fileRepoUrl: string): string => {
	const baseUrl = new URL(EditorElementsPath, fileRepoUrl)
	const url = new URL(urlFromTestsOrFileVersion, baseUrl)
	const validUrls = [...whitelistedEndpoints, baseUrl]
	if (isSafeUrl(url, validUrls)) {
		return url.href
	}

	throw new Error('Invalid editor-elements url')
}
