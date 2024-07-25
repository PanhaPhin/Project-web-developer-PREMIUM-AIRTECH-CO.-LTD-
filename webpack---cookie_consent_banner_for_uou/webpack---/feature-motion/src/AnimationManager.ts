import { Pointer } from 'kuliso'
import type {
	AnimationApi,
	ViewportManagerFactory,
	ViewportManager,
	EffectData,
	ScrubManager,
	Triggers,
	TimeEffectData,
	ExtendedPointerScene,
	ScrubEffectData,
} from './types'
import type { BreakpointRange, ScrubTriggerVariant } from '@wix/thunderbolt-becky-types'

export class AnimationManager {
	api: AnimationApi
	viewportManager: ViewportManager
	isResponsive: boolean
	animationData: { [effectId: string]: Array<EffectData> }
	private scrubManagers: Array<ScrubManager>
	private scrubTriggers: Record<string, ScrubTriggerVariant>
	private callbacks: {
		[effectId: string]: {
			end: Array<() => void>
			start: Array<() => void>
		}
	}
	private breakpointRanges: Array<BreakpointRange>
	private activeListeners: Array<MediaQueryList>
	private scrubUpdateRequest: NodeJS.Timeout | null
	private breakpointChangeHandler: (event: MediaQueryListEvent) => void
	private disabledPointerScenes: Record<string, Array<PointerScene>>
	private played: Record<string, boolean>

	constructor(animationApi: AnimationApi, viewport: ViewportManagerFactory, isResponsive: boolean) {
		this.api = animationApi
		this.viewportManager = viewport({ manager: this })
		this.isResponsive = isResponsive
		this.animationData = {}
		this.scrubManagers = []
		this.scrubTriggers = {}
		this.callbacks = {}
		this.breakpointRanges = []
		this.activeListeners = []
		this.scrubUpdateRequest = null
		this.breakpointChangeHandler = this._breakpointChangeHandler.bind(this)
		this.disabledPointerScenes = {}
		this.played = {}
	}

	init(animationData: { [effectId: string]: Array<EffectData> }, scrubAnimationBreakpoints: Array<BreakpointRange>) {
		this.animationData = animationData
		this.breakpointRanges = scrubAnimationBreakpoints
		this.scrubUpdateRequest = null
		this._observeBreakpointChange()
	}

	trigger(triggers: Triggers = {}, isBreakpointChange?: boolean) {
		if (triggers.scrub) {
			if (isBreakpointChange) {
				// reset triggers state
				this.scrubTriggers = triggers.scrub

				if (!this.scrubUpdateRequest) {
					this.scrubUpdateRequest = setTimeout(() => {
						this._updateScrubManagers(this.scrubTriggers, true)
						this.scrubUpdateRequest = null
					}, 0)
				}
			} else {
				Object.assign(this.scrubTriggers, triggers.scrub)
				this._updateScrubManagers(triggers.scrub)
			}

			return
		}

		const viewportWidth = this.isResponsive ? window.innerWidth : 0

		if (triggers.play?.length) {
			triggers.play.forEach(({ effectId, targetId }) => {
				const animation = this._getEffectVariationForCurrentBreakpoint(effectId, viewportWidth)

				if (animation.namedEffect) {
					this._playAnimation(animation, effectId, { targetId })
				}
			})
		}

		if (triggers.resume?.length) {
			triggers.resume.forEach(({ effectId, targetId }) => {
				if (this.disabledPointerScenes[effectId]) {
					this.disabledPointerScenes[effectId].forEach((scene) => (scene.disabled = false))
					return
				}

				const animation = this._getEffectVariationForCurrentBreakpoint(effectId, viewportWidth)

				if (animation.namedEffect) {
					this._resumeOrPlayAnimation(animation, effectId, { targetId })
				}
			})
		}

		if (triggers.hold?.length) {
			triggers.hold.forEach(({ effectId, targetId }) => {
				if (this.disabledPointerScenes[effectId]) {
					this.disabledPointerScenes[effectId].forEach((scene) => (scene.disabled = true))
					return
				}

				const animation = this._getEffectVariationForCurrentBreakpoint(effectId, viewportWidth)

				if (animation.namedEffect) {
					this._pauseAnimation(effectId, targetId)
				}
			})
		}
	}

	clear() {
		this.animationData = {}
		this.activeListeners.forEach((listener) => listener.removeEventListener('change', this.breakpointChangeHandler))
		this.activeListeners.length = 0
		this.disabledPointerScenes = {}
		this.viewportManager.disconnect()
	}

	addEffectCallback(effectId: string, triggerType: string, callback: () => void) {
		const eventName = triggerType === 'animation-end' ? 'end' : 'start'

		if (!this.callbacks[effectId]) {
			this.callbacks[effectId] = { end: [], start: [] }
		}

		this.callbacks[effectId][eventName].push(callback)
	}

	clearEffectCallbacks(effectId: string) {
		delete this.callbacks[effectId]
	}

	_updateScrubManagers(triggers: Triggers['scrub'] = {}, clearExisting: boolean = false) {
		if (this.scrubManagers.length && clearExisting) {
			this.scrubManagers.forEach((manager) => manager.destroy())
			this.scrubManagers.length = 0
		}

		const effectIds = Object.keys(triggers)
		const viewportWidth = this.isResponsive ? window.innerWidth : 0
		const scrubAnimations = {} as { [effectId: string]: ScrubEffectData }

		for (const effectId of effectIds) {
			const animation = this._getEffectVariationForCurrentBreakpoint(effectId, viewportWidth)

			if (animation.type === 'ScrubAnimationOptions') {
				scrubAnimations[effectId] = animation
			}
		}

		// create new Scrub managers
		this.scrubManagers.push(...this.api.startScrub(triggers, scrubAnimations))

		// optimize Pointer scenes to be disabled when exiting viewport
		this.scrubManagers.forEach((manager) => {
			if (manager instanceof Pointer) {
				manager.config.scenes.forEach((scene: ExtendedPointerScene) => {
					if (scene.target && scene.centeredToTarget && scene.isHitAreaRoot) {
						const container = scene.target.closest('[data-block-level-container]') as HTMLElement

						const effectId = scene.effectId
						if (container && this.viewportManager && effectId) {
							if (!this.disabledPointerScenes[effectId]) {
								this.disabledPointerScenes[effectId] = []
							}
							this.disabledPointerScenes[effectId].push(scene)
							this.viewportManager.observe(container, { effectId, targetId: scene.target.id })
						}
					}
				})
			}
		})
	}

	_getEffectVariationForCurrentBreakpoint(effectId: string, viewportWidth: number) {
		const defaultVariation = this.animationData[effectId].find(
			(variation) => !variation.variants?.length
		) as EffectData

		if (viewportWidth) {
			return (
				// @ts-expect-error
				this.animationData[effectId].findLast((variation) => {
					return (variation.variants as Array<BreakpointRange>)?.some((variant) => {
						if (variant.max && variant.max < viewportWidth) {
							return false
						}

						if (variant.min && variant.min > viewportWidth) {
							return false
						}

						return true
					})
				}) || defaultVariation
			)
		}

		return defaultVariation
	}

	_playAnimation(animationData: TimeEffectData, effectId: string, overrides: Partial<EffectData> = {}) {
		const updatedAnimation = { ...animationData, ...overrides } as TimeEffectData & { targetId: string }
		const { targetId, iterations, allowReplay } = updatedAnimation

		if (iterations === 0) {
			this._setAnimationPlaystateTrigger(effectId, targetId)
			return
		}

		if (allowReplay === 'never' && this.played[targetId]) {
			this._setAnimationState(targetId)
			return
		}

		const callbacks = this._getAnimationCallbacks(effectId, targetId, updatedAnimation)

		this.api.play(targetId, updatedAnimation, callbacks)

		this.played[targetId] = true
	}

	_resumeOrPlayAnimation(animationData: TimeEffectData, effectId: string, overrides: Partial<EffectData> = {}) {
		const updatedAnimation = { ...animationData, ...overrides } as TimeEffectData & { targetId: string }
		const targetId = updatedAnimation.targetId
		const animation = this.api.getTargetAnimation(targetId, effectId)
		const callbacks = this._getAnimationCallbacks(effectId, targetId, updatedAnimation)
		animation ? animation.play() : this.api.play(targetId, updatedAnimation, callbacks)
	}

	_pauseAnimation(targetId: string, effectId: string) {
		const animation = this.api.getTargetAnimation(targetId, effectId)
		animation?.pause()
	}

	_setAnimationPlaystateTrigger(effectId: string, targetId: string) {
		const targetElement = document.getElementById(targetId)
		if (targetElement && this.viewportManager) {
			const observedParent = (targetElement.closest('[data-block-level-container]') ||
				targetElement) as HTMLElement
			this.viewportManager.observe(observedParent, { effectId, targetId })
		}
	}

	_observeBreakpointChange() {
		this.breakpointRanges.forEach((range) => {
			const matchMediaString = getMatchMediaString(range)
			const mediaQueryList = window.matchMedia(matchMediaString)
			this.activeListeners.push(mediaQueryList)
			mediaQueryList.addEventListener('change', this.breakpointChangeHandler)
		})
	}

	_breakpointChangeHandler(event: MediaQueryListEvent) {
		if (event.matches) {
			if (!this.scrubUpdateRequest) {
				this.scrubUpdateRequest = setTimeout(() => {
					this._updateScrubManagers(this.scrubTriggers, true)
					this.scrubUpdateRequest = null
				}, 0)
			}
		}
	}

	_setAnimationState(targetId: string) {
		const element = document.getElementById(targetId)
		if (element) {
			element.dataset.motionEnter = 'done'
		}
	}

	_getAnimationCallbacks(effectId: string, targetId: string, data: TimeEffectData) {
		const start = []

		if (data.fill === 'backwards' || data.fill === 'both') {
			start.push(() => {
				this._setAnimationState(targetId)
			})
		}

		start.push(...(this.callbacks[effectId]?.start || []))

		return {
			start,
			end: this.callbacks[effectId]?.end,
		}
	}
}

const getMatchMediaString = (range: BreakpointRange): string => {
	const mediaString = []

	if (range.max) {
		mediaString.push(`(max-width:${range!.max}px)`)
	}
	if (range.min) {
		mediaString.push(`(min-width:${range!.min}px)`)
	}

	return mediaString.join(' and ')
}
