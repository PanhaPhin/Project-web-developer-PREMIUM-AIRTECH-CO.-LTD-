import { withDependencies, named } from '@wix/thunderbolt-ioc'
import {
	BrowserWindow,
	BrowserWindowSymbol,
	CompsLifeCycleSym,
	ICompsLifeCycle,
	PageFeatureConfigSymbol,
} from '@wix/thunderbolt-symbols'
import { name, ReactionCreatorFactorySymbol } from './symbols'
import type {
	IReactionCreatorFactory,
	IViewportIntersectionHandler,
	OptionsToIntersectionObserver,
	TriggersAndReactionsPageConfig,
} from './types'
import type { ViewportTriggerParams } from '@wix/thunderbolt-becky-types'
import { stringifyOptions } from './utils'
import { getFullId, getRepeatedCompSelector } from '@wix/thunderbolt-commons'

export const ViewportIntersectionHandler = withDependencies(
	[named(PageFeatureConfigSymbol, name), ReactionCreatorFactorySymbol, BrowserWindowSymbol, CompsLifeCycleSym],
	(
		{ compsToTriggers, viewportTriggerCompsToParams }: TriggersAndReactionsPageConfig,
		reactionCreatorFactory: IReactionCreatorFactory,
		window: NonNullable<BrowserWindow>,
		compsLifeCycle: ICompsLifeCycle
	): IViewportIntersectionHandler => {
		const optionsToObserver: OptionsToIntersectionObserver = {}

		const enter = (srcCompId: string) => {
			const targetToTuples = compsToTriggers[getFullId(srcCompId)]['viewport-enter']!
			reactionCreatorFactory.handleReaction(null, targetToTuples, srcCompId, false)
		}

		const leave = (srcCompId: string) => {
			const targetToTuples = compsToTriggers[getFullId(srcCompId)]['viewport-leave']
			if (targetToTuples) {
				reactionCreatorFactory.handleReaction(null, targetToTuples, srcCompId, false)
			}
		}

		const skipFirstExecutionHandler = () => {
			let isFirstExecute = true

			// intersection observer invokes the handler in both cases - when calling intersectionObserver.observer and once
			// the element intersects with the viewport. the first isn't relevant to our flow, therefore we block it.
			return (entries: Array<IntersectionObserverEntry>) => {
				if (isFirstExecute) {
					entries.filter((entry) => entry.isIntersecting).forEach((entry) => enter(entry.target.id))
					isFirstExecute = false
					return
				}

				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						enter(entry.target.id)
					} else {
						leave(entry.target.id)
					}
				})
			}
		}

		const getIntersectionObserver = (params: Required<ViewportTriggerParams>) => {
			const key = stringifyOptions(params)
			const {
				threshold,
				margin: { top, bottom, left, right },
			} = params

			if (!optionsToObserver[key]) {
				optionsToObserver[key] = new window.IntersectionObserver(skipFirstExecutionHandler(), {
					threshold,
					rootMargin: `${top.value}${top.type} ${right.value}${right.type} ${bottom.value}${bottom.type} ${left.value}${left.type}`,
				})
			}

			return optionsToObserver[key]
		}

		const init = () => {
			const siteContainerElement: HTMLElement = window!.document.getElementById('SITE_CONTAINER')!
			const viewportHeight = window!.innerHeight
			Object.entries(viewportTriggerCompsToParams).forEach(([compId, params]) => {
				const applyAnimation = () => {
					const elementsToAnimate = siteContainerElement.querySelectorAll(
						`#${compId}, ${getRepeatedCompSelector(compId)}`
					)
					elementsToAnimate.forEach((element) => {
						if (element) {
							if ((element as HTMLElement).offsetHeight > viewportHeight) {
								params.threshold = 0.01
							}
							const intersectionsObserver = getIntersectionObserver(params)
							intersectionsObserver.observe(element)
						}
					})
				}
				const element = window!.document.getElementById(compId)
				if (element) {
					applyAnimation()
				} else {
					compsLifeCycle.waitForComponentToRender(compId).then(applyAnimation)
				}
			})
		}

		const observe = (element: HTMLElement, compId: string) => {
			const params = viewportTriggerCompsToParams[compId]
			const intersectionsObserver = getIntersectionObserver(params)
			intersectionsObserver.observe(element)
		}

		const destroy = () => {
			Object.values(optionsToObserver).forEach((intersectionObserver) => intersectionObserver.disconnect())
		}

		return {
			init,
			observe,
			destroy,
		}
	}
)
