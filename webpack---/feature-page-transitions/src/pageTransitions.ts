import { withDependencies, named } from '@wix/thunderbolt-ioc'
import {
	BrowserWindow,
	BrowserWindowSymbol,
	FeatureStateSymbol,
	PageFeatureConfigSymbol,
} from '@wix/thunderbolt-symbols'
import type { PageTransitionsDidMountFactory, PageTransitionData } from './types'
import { name, PageTransitionsCompletedSymbol } from './symbols'
import { ScrollRestorationAPISymbol } from 'feature-scroll-restoration'

function doViewTransition(
	pageRendered: Promise<PageTransitionData>,
	browserWindow: BrowserWindow,
	onTransitionStart: () => void,
	onTransitionComplete: (pageId: string) => void
) {
	// set attribute for styles to update
	browserWindow!.document.documentElement.dataset.viewTransition = 'page-transition'

	let pageId: string
	let transitionName: string
	// @ts-expect-error
	const transition = document.startViewTransition(() => {
		return pageRendered.then((transitionData: PageTransitionData) => {
			transitionName = transitionData.transitionName as string
			pageId = transitionData.pageId as string
			browserWindow!.document.documentElement.dataset.pageTransition = transitionName
		})
	})

	transition.ready.then(onTransitionStart)
	transition.finished.then(() => {
		// clean up transition styles
		delete browserWindow!.document.documentElement.dataset.viewTransition
		onTransitionComplete(pageId)
	})
}

const pageTransitionsDidMountFactory: PageTransitionsDidMountFactory = (
	pageConfig,
	featureState,
	pageTransitionsCompleted,
	scrollRestorationAPI,
	browserWindow: BrowserWindow
) => {
	const supportsViewTransition = browserWindow ? 'startViewTransition' in browserWindow.document : false
	const useViewTransition = supportsViewTransition && pageConfig.shouldUseViewTransition

	return {
		name: 'pageTransitions',
		pageDidMount(pageId) {
			const state = featureState.get()

			const mountDone = state?.mountDoneHandler
			if (mountDone) {
				mountDone({
					transitionName: pageConfig.transitionName,
					pageId,
				})
			}

			if (state?.isFirstMount ?? true) {
				pageTransitionsCompleted.notifyPageTransitionsCompleted(pageId)
			}

			featureState.update((current) => ({
				...current,
				isFirstMount: false,
			}))
		},
		pageWillUnmount({ contextId }) {
			const state = featureState.get()

			if (useViewTransition) {
				const onTransitionStarting = () => {
					if (!scrollRestorationAPI.getScrollYHistoryState()) {
						scrollRestorationAPI.scrollToTop()
					}
				}
				const onTransitionComplete = (pageId: string) => {
					pageTransitionsCompleted.notifyPageTransitionsCompleted(pageId)
					if (scrollRestorationAPI.getScrollYHistoryState()) {
						scrollRestorationAPI.restoreScrollPosition()
					}
				}

				const pageMountPromise = new Promise((resolve) => {
					featureState.update((currentState) => {
						return {
							...currentState,
							mountDoneHandler: resolve,
						}
					})
				}) as Promise<PageTransitionData>

				doViewTransition(pageMountPromise, browserWindow, onTransitionStarting, onTransitionComplete)
			}

			// release propStore subscription
			state?.propsUpdateListenersUnsubscribers?.[contextId]?.()
			featureState.update((currentState) => {
				const propsUpdateListenersUnsubscribers = currentState?.propsUpdateListenersUnsubscribers ?? {}
				delete propsUpdateListenersUnsubscribers[contextId]
				return {
					...currentState,
					propsUpdateListenersUnsubscribers,
				}
			})
		},
	}
}

export const PageTransitionsDidMount = withDependencies(
	[
		named(PageFeatureConfigSymbol, name),
		named(FeatureStateSymbol, name),
		PageTransitionsCompletedSymbol,
		ScrollRestorationAPISymbol,
		BrowserWindowSymbol,
	],
	pageTransitionsDidMountFactory
)
