import { withDependencies, named } from '@wix/thunderbolt-ioc'
import { ILogger, LoggerSymbol, SiteFeatureConfigSymbol } from '@wix/thunderbolt-symbols'
import { loadScriptTag, loadModuleScriptTag } from '@wix/thunderbolt-commons'
import type { CustomElementComponent, IWixCustomElementComponent, WixCustomElementComponentSiteConfig } from './types'
import { generateWixCodeUrl, tryToGetCustomElementConnectedToWidget } from './utils'
import { name } from './symbols'

export const WixCustomElementComponentAPI = withDependencies(
	[named(SiteFeatureConfigSymbol, name), LoggerSymbol],
	(
		{
			wixCodeBundlersUrlData,
			shouldLoadAllExternalScripts,
			widgetsToRenderOnFreeSites,
			customElementWidgets,
		}: WixCustomElementComponentSiteConfig,
		logger: ILogger
	): IWixCustomElementComponent => {
		const customElementsTagNameMap: Record<string, boolean> = {}
		const customElementsUrlMap: Record<string, boolean> = {}

		const loadCustomElementScript = async (customElement: CustomElementComponent) => {
			const {
				url: initialUrl,
				appDefId,
				tagName,
				hostedInCorvid,
				scriptType,
			} = tryToGetCustomElementConnectedToWidget(customElement, customElementWidgets)

			const url = hostedInCorvid
				? generateWixCodeUrl({
						wixCodeBundlersUrlData,
						url: initialUrl,
						appDefId,
				  })
				: initialUrl

			if (customElementsTagNameMap[tagName] || customElementsUrlMap[url]) {
				return
			}

			customElementsTagNameMap[tagName] = true
			customElementsUrlMap[url] = true

			try {
				if (hostedInCorvid) {
					// request for wix code bundler to remove this dependency: https://wix.slack.com/archives/CGJREGM7B/p1653330082949059
					// @ts-ignore
					await import('regenerator-runtime/runtime')
				}
				if (scriptType === 'module') {
					await loadModuleScriptTag(url)
				} else {
					await loadScriptTag(url)
				}
			} catch (e) {
				if (hostedInCorvid) {
					logger.captureError(new Error(`failed to load custom element corvid file with url: ${url}`), {
						tags: { feature: 'wixCustomElementComponentAPI' },
					})
				}
			}
		}

		return {
			loadCustomElementsScripts: (customElements: Array<CustomElementComponent>) =>
				Promise.all(
					shouldLoadAllExternalScripts
						? customElements.map(loadCustomElementScript)
						: customElements
								.filter(({ widgetId }) => {
									return widgetId && widgetsToRenderOnFreeSites[widgetId]
								})
								.map(loadCustomElementScript)
				),
			isCustomElementEnabled: (widgetId) => {
				return shouldLoadAllExternalScripts || !!(widgetId && widgetsToRenderOnFreeSites[widgetId])
			},
			customElementWidgets,
		}
	}
)
