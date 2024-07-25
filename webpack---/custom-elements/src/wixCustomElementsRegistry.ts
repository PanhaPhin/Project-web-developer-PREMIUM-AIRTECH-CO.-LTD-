// @ts-nocheck

import { throttleToAnimationFrame } from './utils/utils'
import wixBgMediaWrapper from './elements/wixBgMedia/wixBgMedia'
import wixElementWrapper from './elements/wixElement'
import getMultiColumnRepeaterElement, { customElementName as multiColName } from './elements/MultiColumnLayouter'
import nativeShim from './shims/native-shim'
import { initResizeService } from './utils/initResizeService'

function init(services, contextWindow = window) {
	nativeShim(contextWindow)

	const windowResizeService = {
		registry: new Set(),
		observe(element) {
			windowResizeService.registry.add(element)
		},
		unobserve(element) {
			windowResizeService.registry.delete(element)
		},
	}

	services.windowResizeService.init(
		throttleToAnimationFrame(() => windowResizeService.registry.forEach((element) => element.reLayout())),
		contextWindow
	)

	const resizeService = initResizeService()

	const defineCustomElement = (elementName, elementClass) => {
		if (contextWindow.customElements.get(elementName) === undefined) {
			contextWindow.customElements.define(elementName, elementClass)
		}
	}

	const WixElement = wixElementWrapper({ resizeService }, contextWindow)
	contextWindow.customElementNamespace = { WixElement }
	defineCustomElement('wix-element', WixElement)

	const defineWixBgMedia = (externalServices) => {
		const WixBgMedia = wixBgMediaWrapper(WixElement, { windowResizeService, ...externalServices }, contextWindow)
		defineCustomElement('wix-bg-media', WixBgMedia)
	}
	const defineMultiColumnRepeaterElement = () => {
		const MultiColRepeater = getMultiColumnRepeaterElement()
		defineCustomElement(multiColName, MultiColRepeater)
	}

	return {
		contextWindow,
		defineWixBgMedia,
		defineMultiColumnRepeaterElement,
	}
}

export default {
	init,
}
