import { withDependencies, named } from '@wix/thunderbolt-ioc'
import {
	BrowserWindow,
	BrowserWindowSymbol,
	FeatureStateSymbol,
	IPropsStore,
	PageFeatureConfigSymbol,
	Props,
} from '@wix/thunderbolt-symbols'
import type { PageTransitionsPageState } from './types'
import { name, PageTransitionsCompletedSymbol } from './symbols'
import { ComponentWillMount, ViewerComponent } from 'feature-components'
import type { IFeatureState } from 'thunderbolt-feature-state'
import type { IPageTransitionsCompleted } from './IPageTransitionsCompleted'
import { ScrollRestorationAPISymbol, IScrollRestorationAPI } from 'feature-scroll-restoration'
import { PageTransitionsPageConfig } from './types'

export const PageComponentTransitionsWillMount = withDependencies(
	[
		named(PageFeatureConfigSymbol, name),
		Props,
		PageTransitionsCompletedSymbol,
		ScrollRestorationAPISymbol,
		named(FeatureStateSymbol, name),
		BrowserWindowSymbol,
	],
	(
		pageConfig: PageTransitionsPageConfig,
		propsStore: IPropsStore,
		pageTransitionsCompleted: IPageTransitionsCompleted,
		scrollRestorationAPI: IScrollRestorationAPI,
		featureState: IFeatureState<PageTransitionsPageState>,
		browserWindow: BrowserWindow
	): ComponentWillMount<ViewerComponent> => {
		return {
			componentTypes: ['Page'],
			componentWillMount(pageComponent) {
				const state = featureState.get()
				const transitionEnabled = state ? state.nextTransitionEnabled : true
				const isFirstMount = state ? state.isFirstMount : true
				const supportsViewTransition = browserWindow ? 'startViewTransition' in browserWindow.document : false
				const useViewTransition = supportsViewTransition && pageConfig.shouldUseViewTransition

				const pageId = pageComponent.id

				propsStore.update({
					SITE_PAGES: {
						transitionEnabled,
						...(useViewTransition
							? {}
							: {
									onTransitionStarting: () => {
										if (!scrollRestorationAPI.getScrollYHistoryState()) {
											scrollRestorationAPI.scrollToTop()
										}
									},
									onTransitionComplete: () => {
										pageTransitionsCompleted.notifyPageTransitionsCompleted(pageId)
										if (scrollRestorationAPI.getScrollYHistoryState()) {
											scrollRestorationAPI.restoreScrollPosition()
										}
									},
							  }),
					},
				})

				featureState.update(() => ({
					...state,
					isFirstMount,
					nextTransitionEnabled: true,
				}))
			},
		}
	}
)
