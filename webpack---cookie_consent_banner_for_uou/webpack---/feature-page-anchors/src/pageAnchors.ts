import { withDependencies, named } from '@wix/thunderbolt-ioc'
import {
	PageFeatureConfigSymbol,
	MasterPageFeatureConfigSymbol,
	BrowserWindowSymbol,
	Props,
	BrowserWindow,
	IPropsStore,
	IPageDidMountHandler,
	IPageWillUnmountHandler,
	pageIdSym,
	ExperimentsSymbol,
	Experiments,
} from '@wix/thunderbolt-symbols'
import type { PageAnchorsPageConfig, PageAnchorsMasterPageConfig, PageConfigAnchor } from './types'
import { name } from './symbols'
import { createAnchorObserver } from './pageAnchorsUtils'

const EXPERIMENT_FIX_ANCHORS = 'specs.thunderbolt.fixAnchorSections'

/**
 * This is your feature.
 * You can get your configuration written in site-assets and viewer-model injected into your feature
 */
const pageAnchorsFactory = (
	pageFeatureConfig: PageAnchorsPageConfig,
	masterPageConfig: PageAnchorsMasterPageConfig,
	window: BrowserWindow,
	propsStore: IPropsStore,
	pageId: string,
	experiments: Experiments
): IPageDidMountHandler & IPageWillUnmountHandler => {
	const pageAnchorsObservers = pageFeatureConfig.pageAnchorsObservers.concat(masterPageConfig.pageAnchorsObservers)
	const activeAnchorObservers = pageFeatureConfig.activeAnchorObservers.concat(masterPageConfig.activeAnchorObservers)
	let anchors: Array<PageConfigAnchor>
	let observeAnchors: () => () => void
	if (experiments[EXPERIMENT_FIX_ANCHORS]) {
		anchors = [...new Set([...pageFeatureConfig.anchors, ...masterPageConfig.anchors]).values()]
		observeAnchors =
			pageId !== 'masterPage'
				? createAnchorObserver(
						pageAnchorsObservers,
						activeAnchorObservers,
						anchors,
						window,
						propsStore,
						pageId,
						masterPageConfig.siteOffset
				  )
				: () => () => undefined
	} else {
		anchors = pageFeatureConfig.anchors.concat(masterPageConfig.anchors)
		observeAnchors = createAnchorObserver(
			pageAnchorsObservers,
			activeAnchorObservers,
			anchors,
			window,
			propsStore,
			pageId,
			masterPageConfig.siteOffset
		)
	}

	let observersCleanup: () => void | undefined

	return {
		pageDidMount(): void {
			if (pageAnchorsObservers.length || activeAnchorObservers.length) {
				observersCleanup = observeAnchors()
			}
		},
		pageWillUnmount(): void {
			if (observersCleanup) {
				observersCleanup()
			}
		},
	}
}

export const PageAnchors = withDependencies(
	[
		named(PageFeatureConfigSymbol, name),
		named(MasterPageFeatureConfigSymbol, name),
		BrowserWindowSymbol,
		Props,
		pageIdSym,
		ExperimentsSymbol,
	],
	pageAnchorsFactory
)
