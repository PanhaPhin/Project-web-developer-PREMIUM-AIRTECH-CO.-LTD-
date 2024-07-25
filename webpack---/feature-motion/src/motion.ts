import { withDependencies, named } from '@wix/thunderbolt-ioc'
import {
	PageFeatureConfigSymbol,
	BrowserWindowSymbol,
	ReducedMotionSymbol,
	Props,
	FeatureStateSymbol,
	pageIdSym,
} from '@wix/thunderbolt-symbols'
import type { IMotion, MotionFactory } from './types'
import { name } from './symbols'
import { isSSR } from '@wix/thunderbolt-commons'
import { AnimationManager } from './AnimationManager'
import { animationApiFactory } from './animationApi'
import viewport from './viewport'

const motionFactory: MotionFactory = (
	featureConfig,
	featureState,
	pageId,
	propsStore,
	browserWindow,
	reducedMotion
): IMotion => {
	const { animationDataByCompId, scrubAnimationBreakpoints, isResponsive } = featureConfig
	if (reducedMotion || isSSR(browserWindow)) {
		return {
			name: 'motion',
			async pageWillUnmount() {},
			getManager() {
				return undefined
			},
		}
	}

	const animationApi = animationApiFactory(featureConfig.repeaterTemplateToParentMap, propsStore)
	let animationManager = featureState.get()?.[pageId]

	if (!animationManager) {
		animationManager = new AnimationManager(animationApi, viewport, isResponsive)
		featureState.update((state) => ({ ...state, [pageId]: animationManager }))
	}

	const animationData = Object.assign({}, ...Object.values(animationDataByCompId || {}))
	animationManager.init(animationData, scrubAnimationBreakpoints)

	return {
		name: 'motion',
		async pageWillUnmount() {
			animationManager?.clear()
		},
		getManager() {
			return animationManager
		},
	}
}

export const Motion = withDependencies(
	[
		named(PageFeatureConfigSymbol, name),
		named(FeatureStateSymbol, name),
		pageIdSym,
		Props,
		BrowserWindowSymbol,
		ReducedMotionSymbol,
	],
	motionFactory
)
