import _ from 'lodash'
import type { AnimationData } from 'feature-animations'
import type { IModelsAPI } from '@wix/thunderbolt-symbols'
import type { BootstrapData } from '../../types'
import type { IPlatformAnimations, EffectOptionsTypes, BaseEffectOptions, EffectName } from '../../animations-types'
import type { IViewerHandlers } from '../types'
import { BOOTSTRAP_DATA, MODELS_API, PLATFORM_ANIMATIONS, VIEWER_HANDLERS } from './moduleNames'
import type { TimeEffectData } from 'feature-motion'

type NamedEffect = {
	type: string
	direction?: string | number
	power?: string
	spins?: number
	startFromOffScreen?: boolean
	distance?: { value: number; type: string }
	shape?: string
}

const effectAliasToEffectNameMap: { in: { [alias: string]: EffectName }; out: { [alias: string]: EffectName } } = {
	in: {
		arc: 'ArcIn',
		bounce: 'BounceIn',
		puff: 'DropIn',
		zoom: 'ExpandIn',
		fade: 'FadeIn',
		flip: 'FlipIn',
		float: 'FloatIn',
		fly: 'FlyIn',
		fold: 'FoldIn',
		glide: 'GlideIn',
		roll: 'Reveal',
		slide: 'SlideIn',
		spin: 'SpinIn',
		turn: 'TurnIn',
	},
	out: {
		arc: 'ArcOut',
		bounce: 'BounceOut',
		puff: 'PopOut',
		zoom: 'CollapseOut',
		fade: 'FadeOut',
		flip: 'FlipOut',
		float: 'FloatOut',
		fly: 'FlyOut',
		fold: 'FoldOut',
		glide: 'GlideOut',
		roll: 'Conceal',
		slide: 'SlideOut',
		spin: 'SpinOut',
		turn: 'TurnOut',
	},
}

const motionEffectAliasToEffectMap: { [alias: string]: { name: EffectName; params?: (params: Record<string, any>) => Record<string, any> } } = {
	arc: {
		name: 'CurveIn',
		params: ({ direction }) => ({ direction }),
	},
	bounce: {
		name: 'PunchIn',
		params: ({ direction, intensity }) => ({ bounce: intensity, direction: splitCamelCaseIntoWords(direction).join(' ').toLowerCase() }),
	},
	puff: {
		name: 'DropIn',
	},
	zoom: {
		name: 'ExpandIn',
	},
	fade: {
		name: 'FadeIn',
	},
	flip: {
		name: 'FlipIn',
		params: ({ direction }) => ({ direction }),
	},
	float: {
		name: 'FloatIn',
		params: ({ direction }) => ({ direction }),
	},
	fly: {
		name: 'FlyIn',
		params: ({ direction }) => ({ direction }),
	},
	fold: {
		name: 'FoldIn',
		params: ({ direction }) => ({ direction }),
	},
	glide: {
		name: 'GlitchIn',
		params: ({ angle, distance }) => ({ angle, distance }),
	},
	roll: {
		name: 'Reveal',
		params: ({ direction }) => ({ direction }),
	},
	slide: {
		name: 'SlideIn',
		params: ({ direction }) => ({ direction }),
	},
	spin: {
		name: 'SpinIn',
		params: ({ direction, cycles }) => ({ direction, cycles }),
	},
	turn: {
		name: 'CircleIn',
		params: ({ direction }) => ({ direction }),
	},
}

const millisToSeconds = (num: number) => num / 1000

type EffectSpecificAnimationDataParamsModifiers = {
	// eslint-disable-next-line @typescript-eslint/no-shadow
	[EffectName in keyof EffectOptionsTypes]: (effectOptions: EffectOptionsTypes[EffectName]) => Partial<AnimationData['params']>
}

// eslint-disable-next-line @typescript-eslint/no-shadow
type AnimationDataParamsFactory = <EffectName extends keyof EffectOptionsTypes, EffectOptions = EffectOptionsTypes[EffectName] & BaseEffectOptions>(
	effectName: EffectName,
	effectOptions: EffectOptions
) => Partial<AnimationData['params']>

const splitCamelCaseIntoWords = (txt: string) => txt.split(/(?=[A-Z])/)

const PlatformAnimations = ({ viewerHandlers }: IViewerHandlers, bootstrapData: BootstrapData, modelsApi: IModelsAPI): IPlatformAnimations => {
	const isMotionSupported = bootstrapData.platformEnvData.site.experiments['specs.thunderbolt.motionFeature']
	const isVeloMotionSupported = bootstrapData.platformEnvData.site.experiments['specs.thunderbolt.motionVeloShowHide']
	const useMotion = isMotionSupported && isVeloMotionSupported

	const animationDataParamsFactory: AnimationDataParamsFactory = (effectName, effectOptions) => {
		const animationDataParams: Partial<AnimationData['params']> = {}

		const pick = <T>(props: Array<keyof T>) => (obj: T) => _.pick<T>(obj, props)

		const effectSpecificDataParamsBuilders: Partial<EffectSpecificAnimationDataParamsModifiers> = {
			ArcIn: pick(['direction']),
			ArcOut: pick(['direction']),
			BounceIn: ({ direction, intensity }) => ({
				bounce: intensity,
				// topLeft -> top left
				direction: splitCamelCaseIntoWords(direction).join(' ').toLowerCase(),
			}),
			BounceOut: ({ direction, intensity }) => ({
				bounce: intensity,
				// topLeft -> top left
				direction: splitCamelCaseIntoWords(direction).join(' ').toLowerCase(),
			}),
			FlipIn: pick(['direction']),
			FlipOut: pick(['direction']),
			FloatIn: pick(['direction']),
			FloatOut: pick(['direction']),
			FlyIn: pick(['direction']),
			FlyOut: pick(['direction']),
			FoldIn: pick(['direction']),
			FoldOut: pick(['direction']),
			GlideIn: pick(['angle', 'distance']),
			GlideOut: pick(['angle', 'distance']),
			Reveal: pick(['direction']),
			Conceal: pick(['direction']),
			SlideIn: pick(['direction']),
			SlideOut: pick(['direction']),
			SpinIn: pick(['direction', 'cycles']),
			SpinOut: pick(['direction', 'cycles']),
			TurnIn: pick(['direction']),
			TurnOut: pick(['direction']),
		}

		if (effectName in effectSpecificDataParamsBuilders) {
			Object.assign(animationDataParams, effectSpecificDataParamsBuilders[effectName]!(effectOptions as any))
		}
		return animationDataParams
	}

	return {
		async runAnimation({ compId, animationDirection, effectName: effectAlias, effectOptions }) {
			if (bootstrapData.platformEnvData.window.isSSR) {
				return
			}
			const compsToAnimate = modelsApi.isRepeaterTemplate(compId) ? modelsApi.getDisplayedIdsOfRepeaterTemplate(compId) : compId

			if (useMotion) {
				const effect = motionEffectAliasToEffectMap[effectAlias] || {}
				const effectName = effect.name || 'FadeIn'
				const params = effect.params ? effect.params(effectOptions) : effectOptions
				const effectData = migrateVeloAnimationData(effectName, animationDirection, effectOptions, compsToAnimate, params)
				return viewerHandlers.motion.runAnimation(effectData, animationDirection)
			}

			// runAnimation accept either the effect name or an alias of the effect.
			const effectName = effectAliasToEffectNameMap[animationDirection][effectAlias] || effectAlias
			const params = animationDataParamsFactory(effectName, effectOptions)

			// animation data expects values in seconds while user code api provides milliseconds!
			const duration = millisToSeconds(effectOptions.duration)
			const delay = millisToSeconds(effectOptions.delay)

			const animationData = {
				duration,
				delay,
				targetId: compsToAnimate,
				name: effectName,
				params,
			}

			return viewerHandlers.animations.runAnimation(animationData, animationDirection)
		},
	}
}

export default {
	factory: PlatformAnimations,
	deps: [VIEWER_HANDLERS, BOOTSTRAP_DATA, MODELS_API],
	name: PLATFORM_ANIMATIONS,
}

const oldFlyInDirectionsMap = {
	top: 0,
	'top-right': 45,
	right: 90,
	'bottom-right': 135,
	bottom: 180,
	'bottom-left': 225,
	left: 270,
	'top-left': 315,
}

// eslint-disable-next-line @typescript-eslint/no-shadow
type MigrateVeloAnimationData = <EffectName extends keyof EffectOptionsTypes, EffectOptions = EffectOptionsTypes[EffectName] & BaseEffectOptions>(
	effectName: string,
	direction: string,
	effectOptions: EffectOptions,
	compId: Array<string> | string,
	params?: Partial<AnimationData['params']>
) => TimeEffectData

// @ts-expect-error
const migrateVeloAnimationData: MigrateVeloAnimationData = (effectName, direction, effectOptions, compId, params: Partial<AnimationData['params']> = {}) => {
	if (params.direction && typeof params.direction === 'string') {
		params.direction = params.direction.replace(' ', '-')
	}

	const targetId = Array.isArray(compId) ? compId : [compId]

	const reversed = direction === 'out'

	const namedEffect: NamedEffect = {
		...params,
		type: effectName,
	}

	switch (effectName) {
		case 'FloatIn':
			namedEffect.direction = namedEffect.direction || 'right'
			break
		case 'ExpandIn':
			namedEffect.power = 'hard'
			namedEffect.direction = 'center'
			break
		case 'SpinIn':
			namedEffect.power = 'hard'
			namedEffect.direction = params?.direction === 'cw' ? 'clockwise' : 'counter-clockwise'
			namedEffect.spins = params?.cycles ?? 2
			break
		case 'FlyIn':
			namedEffect.type = 'GlitchIn'
			namedEffect.power = 'soft'
			namedEffect.startFromOffScreen = true
			// @ts-ignore
			namedEffect.direction = oldFlyInDirectionsMap[params.direction ?? 'right']
			namedEffect.distance = { value: 400, type: 'px' }
			break
		case 'CircleIn':
			namedEffect.direction = namedEffect.direction || 'right'
			break
		case 'CurveIn':
			namedEffect.direction = namedEffect.direction || 'right'
			break
		case 'DropIn':
			namedEffect.power = 'hard'
			break
		case 'FlipIn':
			namedEffect.direction = namedEffect.direction || 'left'
			namedEffect.power = namedEffect.power || 'soft'
			break
		case 'FoldIn':
			namedEffect.direction = namedEffect.direction || 'left'
			namedEffect.power = namedEffect.power || 'hard'
			break
		case 'Reveal':
			if (params.direction === 'center') {
				namedEffect.type = 'ShapeIn'
				namedEffect.shape = 'rectangle'
			} else {
				namedEffect.type = 'RevealIn'
				namedEffect.direction = namedEffect.direction || 'left'
			}
			break
		case 'SlideIn':
			namedEffect.direction = namedEffect.direction || 'left'
			namedEffect.power = namedEffect.power || 'hard'
			break
		case 'PunchIn':
			namedEffect.direction = namedEffect.direction || 'top-left'
			namedEffect.power = params.bounce ?? 'medium'
			break
		case 'GlitchIn':
			namedEffect.power = 'soft'
			namedEffect.direction = params.angle ?? 270
			namedEffect.startFromOffScreen = false
			namedEffect.distance = { value: params.distance ?? 150, type: 'px' }
			break
	}

	return {
		type: 'TimeAnimationOptions',
		...effectOptions,
		iterations: 1,
		targetId,
		namedEffect,
		reversed,
	}
}
