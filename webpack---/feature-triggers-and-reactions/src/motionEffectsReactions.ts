import type { MotionEffectsReactions, TriggersAndReactionsPageConfig } from './types'
import type { IMotionEffectsInit } from 'feature-motion-effects'
import { named, optional, withDependencies } from '@wix/thunderbolt-ioc'
import { MotionEffectsInitSymbol, MotionEffectsManager } from 'feature-motion-effects'
import { ILogger, LoggerSymbol, PageFeatureConfigSymbol } from '@wix/thunderbolt-symbols'
import { AnimationManager, IMotion, MotionSymbol } from 'feature-motion'
import { name as featureName } from './symbols'

export const motionEffectsReactions = withDependencies(
	[
		named(PageFeatureConfigSymbol, featureName),
		optional(MotionEffectsInitSymbol),
		optional(MotionSymbol),
		LoggerSymbol,
	],
	(
		featureConfig: TriggersAndReactionsPageConfig,
		motionEffects: IMotionEffectsInit,
		motion: IMotion,
		logger: ILogger
	): MotionEffectsReactions => {
		let motionEffectsManager: MotionEffectsManager | AnimationManager | undefined

		if (featureConfig.isMotionEnabled && motion) {
			motionEffectsManager = motion.getManager()
		} else if (motionEffects) {
			motionEffects
				.getInstance()
				.then((manager) => {
					motionEffectsManager = manager
				})
				.catch((e) =>
					logger.captureError(e, {
						tags: { feature: 'triggers-and-reactions' },
						groupErrorsBy: 'values',
					})
				)
		}

		const play: MotionEffectsReactions['play'] = (effectId, targetCompId) => {
			motionEffectsManager?.trigger({ play: [{ effectId, targetId: targetCompId }] })
		}

		const scrub: MotionEffectsReactions['scrub'] = (effectScrubMap, isBreakpointChange) => {
			motionEffectsManager?.trigger({ scrub: effectScrubMap }, isBreakpointChange)
		}

		return {
			play,
			scrub,
		}
	}
)
