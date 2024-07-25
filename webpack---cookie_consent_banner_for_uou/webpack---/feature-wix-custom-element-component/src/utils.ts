import { CustomElementComponent, CustomElementWidgets, WixCustomElementComponentSiteConfig } from './types'

export const generateWixCodeUrl = ({
	wixCodeBundlersUrlData,
	url: fileUrl,
	cacheKillerCounter,
	appDefId = '',
}: {
	wixCodeBundlersUrlData: WixCustomElementComponentSiteConfig['wixCodeBundlersUrlData']
	url: string
	cacheKillerCounter?: number
	appDefId?: string
}) => {
	const { url, queryParams } =
		wixCodeBundlersUrlData.appDefIdToWixCodeBundlerUrlData[appDefId] ?? wixCodeBundlersUrlData

	const head = url + fileUrl.replace('public/', '')
	const tail = [
		'no-umd=true',
		queryParams,
		typeof cacheKillerCounter === 'undefined' ? '' : `cacheKiller=${cacheKillerCounter}`,
	]
		.filter((v) => v !== '')
		.join('&')
	return `${head}?${tail}`
}

export const tryToGetCustomElementConnectedToWidget = (
	customElement: CustomElementComponent,
	customElementWidgets: CustomElementWidgets
): CustomElementComponent => {
	if (!customElement.isConnectedToWidget) {
		return customElement
	}

	const connectedWidget = customElementWidgets[`${customElement.appDefId}-${customElement.widgetId}`]

	if (!connectedWidget) {
		return customElement
	}

	const scriptType = connectedWidget.scriptType === 'ES_MODULE' ? 'module' : 'none'

	return {
		...customElement,
		hostedInCorvid: false,
		url: connectedWidget.scriptUrl,
		tagName: connectedWidget.tagName,
		scriptType,
	}
}
