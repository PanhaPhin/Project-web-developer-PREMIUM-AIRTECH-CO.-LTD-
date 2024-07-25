import { createPromise } from './promiseUtils'

export function getCompClassType(componentType: string, uiType?: string) {
	return uiType ? `${componentType}_${uiType}` : componentType
}

const viewer_components_id_prefixes = [
	'MENU_AS_CONTAINER_TOGGLE',
	'MENU_AS_CONTAINER_EXPANDABLE_MENU',
	'BACK_TO_TOP_BUTTON',
	'SCROLL_TO_',
	'TPAMultiSection_',
	'TPASection_',
	'comp-',
	'TINY_MENU',
	'MENU_AS_CONTAINER',
	'SITE_HEADER',
	'SITE_FOOTER',
	'SITE_PAGES',
	'PAGES_CONTAINER',
	'BACKGROUND_GROUP',
	'POPUPS_ROOT',
]

const comp_type_attribute = 'data-comp-type'

export function getClosestCompIdByHtmlElement(htmlElement: HTMLElement): string {
	let closestElement
	for (const prefix of viewer_components_id_prefixes) {
		closestElement = htmlElement.closest(`[id^="${prefix}"]`)
		if (closestElement) {
			break
		}
	}
	return closestElement?.id || ''
}

export function extractClosestCompTypeFromHtmlElement(htmlElement: HTMLElement): string {
	const closestElement = htmlElement.closest(`[${comp_type_attribute}]`)
	return closestElement?.getAttribute(comp_type_attribute) || ''
}

export type LazyComponentTrigger = 'viewport'
export type LazyComponentOptions = {
	triggers?: Array<LazyComponentTrigger>
	componentResolver: () => Promise<React.ComponentType<any>>
}
export type LazyComponentLoaderResponse = {
	componentPromise: Promise<React.ComponentType<any>>
	clearComponentListeners: () => void
}

export const isForwardRef = (Component: React.ComponentType<any>) =>
	Component.prototype &&
	Component.prototype.hasOwnProperty('$$typeof') &&
	Component.prototype.$$typeof.toString() === 'Symbol(react.forward_ref)'

export const getTargetElementByCompId = (compId: string) => document.getElementById(compId)

export const createViewportObserver = (compId: string) => {
	const targetElement = getTargetElementByCompId(compId)
	const { promise, resolver } = createPromise()
	if (!targetElement) {
		// If there was a mismatch (or navigation) we want to hydrate immediatly and not wait for intersection
		// as the target element might be null and promise will remain hanging
		resolver()
		return {
			promise,
			cleaner: () => {},
		}
	}

	const observer = new IntersectionObserver(
		([entry]) => {
			if (entry.isIntersecting) {
				resolver()
				observer.disconnect()
			}
		},
		{ root: null }
	)
	observer.observe(targetElement)

	return {
		promise,
		cleaner: () => observer.disconnect(),
	}
}
