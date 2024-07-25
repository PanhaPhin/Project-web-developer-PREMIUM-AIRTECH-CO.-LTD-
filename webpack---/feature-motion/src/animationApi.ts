import { Scroll } from 'fizban'
import { Pointer } from 'kuliso'
import { getWebAnimation, getScrubScene, getElementAnimation, AnimationGroup, AnimationOptions } from '@wix/motion'
import type { PointerMoveTriggerParams, ScrubTriggerVariant } from '@wix/thunderbolt-becky-types'
import type {
	MotionPageConfig,
	PointerManager,
	PointerSceneFactory,
	ScrollManager,
	ScrollSceneFactory,
	ScrubManager,
	NativeScrollFactory,
	AnimationCallbacks,
	TimeEffectData,
	ScrubEffectData,
} from './types'
import { IPropsStore } from '@wix/thunderbolt-symbols'
import { getDisplayedId, getFullId, getItemId, REPEATER_DELIMITER } from '@wix/thunderbolt-commons'
import { getNearestScrollRoot } from './utils'

export const animationApiFactory = (
	repeaterTemplateToParentMap?: MotionPageConfig['repeaterTemplateToParentMap'],
	propsStore?: IPropsStore
) => {
	return {
		getTargetAnimation(targetId: string, effectId: string) {
			return getElementAnimation(targetId, effectId)
		},
		play(target: string, data: TimeEffectData, callbacks?: AnimationCallbacks) {
			const animation = getWebAnimation(target, data) as AnimationGroup

			let onStart
			if (callbacks?.start?.length) {
				onStart = () => {
					callbacks.start!.forEach((callback) => callback())
				}
			}

			if (callbacks?.end?.length) {
				animation.onFinish(() => {
					callbacks.end!.forEach((callback) => callback())
				})
			}

			animation.play(onStart)

			return animation
		},
		startScrub(
			triggers: { [effectId: string]: ScrubTriggerVariant },
			animationMap: { [effectId: string]: ScrubEffectData },
			forceEnableScene?: boolean
		) {
			const scrollRootsMap = new Map()
			const scrollManagers: Array<ScrollManager> = []
			const pointerRootsMap = new Map()
			const pointerManagers: Array<PointerManager> = []
			const hasViewTimeline = 'ViewTimeline' in window

			function addScroll(
				factory: ScrollSceneFactory | NativeScrollFactory,
				source: HTMLElement,
				targetId: string
			) {
				const scene = factory(targetId)
				let root

				if (hasViewTimeline) {
					root = document.documentElement
				} else {
					if (!(scene as ScrollScene).viewSource) {
						;(scene as ScrollScene).viewSource = source
					}
					root = getNearestScrollRoot(source.parentElement as HTMLElement | null)
				}

				if (!scrollRootsMap.has(root)) {
					scrollRootsMap.set(root, [])
				}

				scrollRootsMap.get(root).push(scene)
			}

			function addPointer(
				factory: PointerSceneFactory,
				source: HTMLElement,
				targetId: string,
				effectId: string,
				triggerParams: PointerMoveTriggerParams
			) {
				const scene = factory(targetId, !forceEnableScene)
				const isHitAreaRoot = triggerParams.hitArea === 'root'
				const pointerScene = {
					isHitAreaRoot,
					effectId,
					...scene,
				}
				const triggerElement = isHitAreaRoot ? document.documentElement : source

				if (!pointerRootsMap.has(triggerElement)) {
					pointerRootsMap.set(triggerElement, [])
				}

				pointerRootsMap.get(triggerElement).push(pointerScene)
			}

			Object.entries(triggers).forEach(([effectId, trigger]) => {
				const isScroll = trigger.trigger === 'view-progress'
				const isPointer = trigger.trigger === 'pointer-move'
				const { targetId, namedEffect } = animationMap[effectId]

				if (namedEffect && (isPointer || isScroll)) {
					const triggerElement = document.getElementById(trigger.componentId) as HTMLElement

					if (triggerElement) {
						const targetIds = this._getScrubTargets(trigger.componentId, targetId)
						targetIds.forEach((target: string) => {
							const scrubScene = this._createScrub(animationMap[effectId], {
								...trigger,
								element: triggerElement,
							})

							return isScroll
								? addScroll(scrubScene.factory as ScrollSceneFactory, triggerElement, target)
								: addPointer(
										(scrubScene.factory as unknown) as PointerSceneFactory,
										triggerElement,
										target,
										effectId,
										trigger.params as PointerMoveTriggerParams
								  )
						})
					} else {
						//	probably the trigger element is a child of a Repeater
						const triggerElements = Array.from(
							document.querySelectorAll(`[id^="${trigger.componentId}${REPEATER_DELIMITER}"]`)
						) as Array<HTMLElement>

						triggerElements.forEach((sourceElement: Element) => {
							const scrubScene = this._createScrub(animationMap[effectId], {
								...trigger,
								element: sourceElement as HTMLElement,
							})
							// we only support animating inside same element of triggering Item with view-progress
							const target = getDisplayedId(getFullId(targetId), getItemId(sourceElement.id))
							isScroll
								? addScroll(
										scrubScene.factory as ScrollSceneFactory,
										sourceElement as HTMLElement,
										target
								  )
								: addPointer(
										(scrubScene.factory as unknown) as PointerSceneFactory,
										sourceElement as HTMLElement,
										target,
										effectId,
										trigger.params as PointerMoveTriggerParams
								  )
						})
					}
				}
			})

			scrollRootsMap.forEach((scenes, root) => {
				if (scenes.length) {
					if (hasViewTimeline) {
						scrollManagers.push(...scenes)
					} else {
						const scrollManager = new Scroll({
							root,
							scenes,
							observeViewportEntry: false,
							observeViewportResize: false,
							observeSourcesResize: false,
						})
						scrollManager.start()

						scrollManagers.push(scrollManager)
					}
				}
			})

			pointerRootsMap.forEach((scenes, root) => {
				const pointerManager = new Pointer({
					root: root === document.documentElement ? undefined : root,
					scenes,
				})
				pointerManager.start()

				pointerManagers.push(pointerManager)
			})

			return [...scrollManagers, ...pointerManagers] as Array<ScrubManager>
		},
		cancelScrub(scrubManagers: Array<ScrubManager>) {
			if (scrubManagers.length) {
				scrubManagers.forEach((manager) => manager.destroy())
				scrubManagers.length = 0
			}
		},
		_createScrub(animation: ScrubEffectData, trigger: ScrubTriggerVariant & { element?: HTMLElement }) {
			return {
				targetId: animation.targetId,
				factory: (targetId: string, disabled = false) => {
					return getScrubScene(targetId || animation.targetId, animation as AnimationOptions, trigger, {
						disabled,
					})
				},
			}
		},
		_getScrubTargets(sourceId: string, targetId: string) {
			const parentRepeater = repeaterTemplateToParentMap?.[targetId]
			const { items = [] } = parentRepeater && propsStore ? propsStore.get(parentRepeater) : {}
			return items.length ? items.map((item: string) => getDisplayedId(targetId, item)) : [targetId]
		},
	}
}
