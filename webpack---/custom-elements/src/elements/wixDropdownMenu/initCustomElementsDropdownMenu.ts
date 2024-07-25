// @ts-nocheck
import fastdom from 'fastdom'
import wixDropdownMenuWrapper from './wixDropdownMenu'
import { initResizeService } from '../../utils/initResizeService'

export const initCustomElementsDropdownMenu = (contextWindow = window) => {
	if (contextWindow.customElements && !contextWindow.customElements.get('wix-dropdown-menu')) {
		const resizeService = initResizeService()
		const WixElement = contextWindow.customElementNamespace?.WixElement

		const WixDropdownMenu = wixDropdownMenuWrapper(
			WixElement,
			{ resizeService, mutationService: fastdom },
			contextWindow
		)
		contextWindow.customElements.define('wix-dropdown-menu', WixDropdownMenu)
	}
}
