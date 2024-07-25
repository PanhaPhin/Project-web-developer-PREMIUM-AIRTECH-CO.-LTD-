import { withDependencies } from '@wix/thunderbolt-ioc'
import {
	AppDidMountPromiseSymbol,
	BrowserWindow,
	BrowserWindowSymbol,
	ComponentsStylesOverridesSymbol,
	IComponentsStylesOverrides,
	SdkHandlersProvider,
} from '@wix/thunderbolt-symbols'
import type { AnimationGroup } from '@wix/motion'
import type { IMotion, WixCodeMotionHandlers, TimeEffectData } from '../types'
import { MotionSymbol, name as featureName } from '../symbols'

export const wixCodeHandlersProvider = withDependencies(
	[MotionSymbol, ComponentsStylesOverridesSymbol, BrowserWindowSymbol, AppDidMountPromiseSymbol],
	(
		motion: IMotion,
		componentsStylesOverrides: IComponentsStylesOverrides,
		window: BrowserWindow,
		appDidMountPromise: Promise<unknown>
	): SdkHandlersProvider<WixCodeMotionHandlers> => ({
		getSdkHandlers: () => ({
			[featureName]: {
				runAnimation: async (
					animationData: TimeEffectData,
					animationDirection: 'in' | 'out'
				): Promise<void> => {
					const targets: Array<string> = Array.isArray(animationData.targetId)
						? animationData.targetId
						: [animationData.targetId]

					return new Promise<void>(async (resolve) => {
						const animationManager = motion.getManager()
						const animations: Array<AnimationGroup> = []

						if (!animationManager) {
							resolve()
							return
						}

						const onStart = () => {
							addIsAnimatingClass(window, targets, animationDirection === 'in')

							if (animationDirection === 'in') {
								componentsStylesOverrides.update(
									targets.reduce(
										(styles, compId) => ({ ...styles, [compId]: { visibility: null } }),
										{}
									)
								)
							}
						}

						const onEnd = () => {
							if (animationDirection === 'out') {
								// update visibility state using style overrides before baseClearData animation removes inline visibility style to avoid flickering
								componentsStylesOverrides.update(
									targets.reduce(
										(styles, compId) => ({
											...styles,
											[compId]: { visibility: 'hidden !important' },
										}),
										{}
									)
								)
							}

							removeIsAnimatingClass(window, targets, animationDirection === 'out')

							// the animation is persisted with fill='forwards' so we need to clear it
							requestAnimationFrame(() => {
								animations.forEach((anim) => anim.cancel())
								animations.length = 0
							})
						}

						// users are instructed not to await promises that require dom on $w.onReady()
						// https://support.wix.com/en/article/corvid-cant-preview-or-view-page-if-using-await-or-return-with-certain-functions-in-onready
						// so no deadlock can happen here between $w.onReady() and viewer waiting for all appWillLoadPage()s
						await appDidMountPromise

						// keep the last frame persistent until we finish updating visibility
						animationData.fill = 'both'

						targets.forEach((targetId) => {
							animations.push(
								animationManager.api.play(targetId, animationData, {
									start: [onStart],
									end: [onEnd, resolve],
								})
							)
						})
					})
				},
			},
		}),
	})
)

const addIsAnimatingClass = (window: BrowserWindow, targets: Array<string>, isIn: boolean) => {
	targets.forEach((compId: string) => {
		const el = window!.document.getElementById(compId)
		if (el) {
			el.classList.add('is-animating')

			// force visibility because the style overrides are not applied yet
			if (isIn) {
				el.style.visibility = 'visible'
			}
		}
	})
}

const removeIsAnimatingClass = (window: BrowserWindow, targets: Array<string>, isOut: boolean) => {
	window!.requestAnimationFrame(() => {
		targets.forEach((compId) => {
			const el = window!.document.getElementById(compId)
			if (el) {
				el.classList.remove('is-animating')

				// force visibility because the style overrides are not applied yet and we get a flicker
				if (isOut) {
					el.style.visibility = 'hidden'
				}
			}
		})
	})
}
