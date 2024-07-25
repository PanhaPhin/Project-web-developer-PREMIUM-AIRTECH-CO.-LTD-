import { named, optional, withDependencies } from '@wix/thunderbolt-ioc'
import { isSSR } from '@wix/thunderbolt-commons'
import { AnimationCallbacks, Animations, IAnimations } from 'feature-animations'
import type {
	IResolvableReadyForScrollPromise,
	IWindowScrollAPI,
	WindowScrollMasterPageConfig,
	WindowScrollPageConfig,
} from './types'
import { ScrollAnimationResult } from './types'
import { calcScrollDuration } from './scrollUtils'
import {
	BrowserWindowSymbol,
	Experiments,
	ExperimentsSymbol,
	IStructureAPI,
	PageFeatureConfigSymbol,
	Structure,
	ViewMode,
	ViewModeSym,
	ReducedMotionSymbol,
	MasterPageFeatureConfigSymbol,
} from '@wix/thunderbolt-symbols'
import { ILightboxUtils, LightboxUtilsSymbol } from 'feature-lightbox'
import { name, ResolvableReadyForScrollPromiseSymbol } from './symbols'
import { ISiteScrollBlocker, SiteScrollBlockerSymbol } from 'feature-site-scroll-blocker'
import type { SequenceInstance } from '@wix/animations-kit'
import { isElementTabbable } from 'feature-cyclic-tabbing'
import { sineInOut } from '@wix/wow-utils/easing'

const getPosition = (elem: HTMLElement) => window.getComputedStyle(elem).getPropertyValue('position').toLowerCase()
const getStickyParentId = (compId: string): string | undefined => {
	let element = window.document.getElementById(compId)
	let stickyElement
	while (element) {
		const computedStyle = window.getComputedStyle(element)
		if (computedStyle.position === 'sticky') {
			stickyElement = element
		}
		element = element.parentElement as HTMLElement
	}

	return stickyElement?.id
}

const isElementOrAncestorFixed = (element: HTMLElement) => {
	let elem = element
	while (elem && elem !== window.document.body) {
		if (getPosition(elem) === 'fixed') {
			return true
		}
		elem = elem.offsetParent as HTMLElement
	}
	return false
}

const pxToNumber = (pxSize: string) => Number(pxSize.replace('px', ''))

const getScrollableElement = (popupUtils?: ILightboxUtils) => {
	return popupUtils?.getCurrentLightboxId() ? window.document.getElementById('POPUPS_ROOT')! : window
}

const getHeaderElement = (headerComponentId: string | undefined, window: Window) => {
	return window.document.getElementById(headerComponentId || 'SITE_HEADER')
}
const isStickyElement = (element: HTMLElement) => {
	return getPosition(element) === 'sticky'
}
const getWixAdsHeight = () => {
	const wixAdsElement = window.document.getElementById('WIX_ADS')
	return wixAdsElement ? wixAdsElement.offsetHeight : 0
}

const isHeaderSticky = (headerContainerComponentId: string | undefined, window: Window) => {
	if (!headerContainerComponentId) {
		return false
	}
	const headerContainerElement = window.document.getElementById(headerContainerComponentId)
	return headerContainerElement && window.getComputedStyle(headerContainerElement).position === 'sticky'
}

function getTopLocation(element: HTMLElement | Window): number {
	if (element instanceof HTMLElement) {
		return element.scrollTop
	} else {
		return element.scrollY
	}
}

export const WindowScroll = withDependencies(
	[
		BrowserWindowSymbol,
		ViewModeSym,
		ResolvableReadyForScrollPromiseSymbol,
		SiteScrollBlockerSymbol,
		ExperimentsSymbol,
		Structure,
		ReducedMotionSymbol,
		named(PageFeatureConfigSymbol, name),
		named(MasterPageFeatureConfigSymbol, name),
		optional(LightboxUtilsSymbol),
		optional(Animations),
	],
	(
		window: Window,
		viewMode: ViewMode,
		{ readyForScrollPromise }: IResolvableReadyForScrollPromise,
		siteScrollBlockerApi: ISiteScrollBlocker,
		experiments: Experiments,
		structureApi: IStructureAPI,
		reducedMotion,
		{ headerComponentId, headerContainerComponentId }: WindowScrollPageConfig,
		{ isHeaderAnimated }: WindowScrollMasterPageConfig,
		popupUtils?: ILightboxUtils,
		animations?: IAnimations
	): IWindowScrollAPI => {
		let isAnimationRunning = false
		let abortAnimation = () => {}
		let animationFrameId: number | null = null

		if (isSSR(window)) {
			return {
				scrollToComponent: () => Promise.resolve(),
				animatedScrollTo: () => Promise.resolve(ScrollAnimationResult.Aborted),
				scrollToSelector: () => Promise.resolve(),
			}
		}

		const getHeaderOffset = (targetCompTop: number, wixAdsHeight: number) => {
			const headerElement = getHeaderElement(headerComponentId, window)
			if (!headerElement) {
				return 0
			}

			const headerPosition = getPosition(headerElement)
			const isHeaderStickyOrFixed =
				headerPosition === 'fixed' ||
				headerPosition === 'sticky' ||
				(!!experiments['specs.thunderbolt.windowScrollStickyHeader'] &&
					isHeaderSticky(headerContainerComponentId, window))

			const headerHeight = headerElement.getBoundingClientRect().height
			// This is potential scroll amount
			const distanceBetweenHeaderBottomAndCompTop = Math.abs(targetCompTop - headerHeight - wixAdsHeight)
			const isDistanceSmallerThanHeaderHeight = distanceBetweenHeaderBottomAndCompTop < headerHeight

			// animation is triggered when scroll position equals to header height, therefore as long as the distance between
			// header bottom and compTop is less than or equals to headerHeight, the header appears on the screen,
			// and it's height should be taken into account
			return isHeaderStickyOrFixed && (!isHeaderAnimated || isDistanceSmallerThanHeaderHeight) ? headerHeight : 0
		}

		const getCompClientYForScroll = (compNode: HTMLElement, openLightboxId: string | undefined) => {
			const openLightboxElement = openLightboxId && window.document.getElementById(openLightboxId)
			let bodyTop = openLightboxElement
				? openLightboxElement.getBoundingClientRect().top
				: window.document.body.getBoundingClientRect().top

			const isScrollBlocked =
				!experiments['specs.thunderbolt.blockSiteScrollWithOverflowHidden'] &&
				siteScrollBlockerApi.isScrollingBlocked()
			if (isScrollBlocked) {
				const siteContainerElement = window.document.getElementById('SITE_CONTAINER')
				bodyTop = siteContainerElement ? pxToNumber(window.getComputedStyle(siteContainerElement).marginTop) : 0
			}

			const wixAdsHeight = getWixAdsHeight()

			const compTop = compNode.getBoundingClientRect().top
			const headerOffset = getHeaderOffset(compTop, wixAdsHeight)

			return compTop - bodyTop - wixAdsHeight - (openLightboxId ? 0 : headerOffset)
		}

		const animatedScrollToNative = async (
			targetY: number,
			callbacks: AnimationCallbacks = {}
		): Promise<ScrollAnimationResult> => {
			if (!animations) {
				return ScrollAnimationResult.Aborted
			}

			await readyForScrollPromise
			const scrollableElement = getScrollableElement(popupUtils)
			isAnimationRunning = true

			if (reducedMotion) {
				scrollableElement.scrollTo({ top: targetY })
				callbacks.onComplete?.(undefined as any)
				return ScrollAnimationResult.Completed
			}
			if (animationFrameId !== null) {
				cancelAnimationFrame(animationFrameId)
				animationFrameId = null
			}

			return new Promise((resolve) => {
				function scrollAbortHandler() {
					removeScrollInteractionEventListeners(scrollAbortHandler)
					scrollableElement.scrollTo({ top: getTopLocation(scrollableElement) })
					cancelAnimationFrame(animationFrameId!)
					animationFrameId = null
					resolve(ScrollAnimationResult.Aborted)
				}

				addScrollInteractionEventListeners(scrollAbortHandler)
				const startY = getTopLocation(scrollableElement)
				const distance = targetY - startY
				const isMobile = viewMode === 'mobile'
				const duration = calcScrollDuration(window.pageYOffset, targetY, isMobile) * 1000
				const startTime = performance.now()

				function scrollStep(timestamp: number) {
					const elapsed = timestamp - startTime
					const progress = Math.min(elapsed / duration, 1)
					const newPosition = startY + distance * sineInOut(progress)
					scrollableElement.scrollTo(0, newPosition)

					if (elapsed < duration) {
						animationFrameId = window.requestAnimationFrame(scrollStep)
					} else {
						scrollableElement.scrollTo(0, targetY)
						animationFrameId = null
						removeScrollInteractionEventListeners(scrollAbortHandler)
						callbacks.onComplete?.(undefined as any)
						resolve(ScrollAnimationResult.Completed)
						isAnimationRunning = false
					}
				}

				window.requestAnimationFrame(scrollStep)
			})
		}

		const animatedScrollToGSAP = async (
			targetY: number,
			callbacks: AnimationCallbacks = {}
		): Promise<ScrollAnimationResult> => {
			if (!animations) {
				return ScrollAnimationResult.Aborted
			}

			if (isAnimationRunning) {
				abortAnimation()
			}

			isAnimationRunning = true
			const animationInstance = await animations.getInstance()
			await readyForScrollPromise
			const isMobile = viewMode === 'mobile'
			const easingName = isMobile ? 'Quint.easeOut' : 'Sine.easeInOut'
			const duration = calcScrollDuration(window.pageYOffset, targetY, isMobile)
			const scrollableElement = getScrollableElement(popupUtils)

			return new Promise((resolve) => {
				const mergedCallbacks = {
					...callbacks,
					onComplete: (instance: SequenceInstance) => {
						callbacks.onComplete?.(instance)
						removeScrollInteractionEventListeners(animationAbortHandler)
						resolve(ScrollAnimationResult.Completed)
						isAnimationRunning = false
					},
				}

				const gsapInstance = animationInstance.runAnimationOnElements(
					'BaseScroll',
					[scrollableElement as HTMLElement],
					duration,
					0,
					{
						y: targetY,
						ease: easingName,
						callbacks: mergedCallbacks,
					}
				)

				function animationAbortHandler() {
					animationInstance.kill(gsapInstance)
					removeScrollInteractionEventListeners(animationAbortHandler)
					resolve(ScrollAnimationResult.Aborted)
					isAnimationRunning = false
				}

				abortAnimation = animationAbortHandler

				addScrollInteractionEventListeners(animationAbortHandler)
			})
		}

		const animatedScrollTo = async (targetY: number, callbacks: AnimationCallbacks = {}) => {
			if (experiments['specs.thunderbolt.useNativeScrollTo'] === true) {
				return await animatedScrollToNative(targetY, callbacks)
			} else {
				return await animatedScrollToGSAP(targetY, callbacks)
			}
		}

		const scrollToSelector = async (
			selector: string,
			openLightboxId?: string,
			{ callbacks = {}, skipScrollAnimation = false } = {}
		) => {
			await readyForScrollPromise
			const targetElement = window.document.querySelector(selector) as HTMLElement
			if (!targetElement || (isElementOrAncestorFixed(targetElement) && !openLightboxId)) {
				return
			}
			let zoomFactor = 1
			if (experiments['specs.thunderbolt.autoZoom']) {
				zoomFactor = Number(getComputedStyle(document.body).getPropertyValue('--zoom-factor') || 1)
			}
			const compClientYForScroll = await new Promise<number>((resolve) => {
				window.requestAnimationFrame(() => {
					resolve(getCompClientYForScroll(targetElement, openLightboxId) * zoomFactor)
				})
			})
			if (skipScrollAnimation) {
				window.scrollTo({ top: 0 })
			} else {
				const result = await animatedScrollTo(compClientYForScroll, callbacks)

				if (result !== ScrollAnimationResult.Aborted) {
					const compClientYForScrollAfterScroll = getCompClientYForScroll(targetElement, openLightboxId)

					const retryThreshold = 0.5
					const shouldRetryScroll =
						!isStickyElement(targetElement) &&
						Math.abs(compClientYForScroll - compClientYForScrollAfterScroll) > retryThreshold

					if (shouldRetryScroll) {
						// if the anchor original position changed due to dynamic
						// content above it height change pushing anchor down
						// we need to perform scroll logic again until reaching the anchor
						void scrollToSelector(selector, openLightboxId, {
							callbacks,
							skipScrollAnimation,
						})
					}
				}
			}

			if (!isElementTabbable(targetElement)) {
				targetElement.setAttribute('tabIndex', '-1')
			}
			targetElement.focus({ preventScroll: true })
		}

		const scrollToComponent = async (
			targetCompId: string,
			{ callbacks = {}, skipScrollAnimation = false } = {}
		) => {
			const targetCompData = structureApi.get(targetCompId)
			const openLightboxId = popupUtils?.getCurrentLightboxId()
			const isCompOnLightbox = targetCompData?.pageId === openLightboxId
			let stickyParentId
			if (experiments['specs.thunderbolt.anchorScrollToStickyComponent']) {
				stickyParentId = getStickyParentId(targetCompId)
			}

			await scrollToSelector(
				`#${stickyParentId ?? targetCompId}`,
				isCompOnLightbox ? openLightboxId : undefined,
				{
					callbacks,
					skipScrollAnimation,
				}
			)
		}

		function addScrollInteractionEventListeners(handler: () => void) {
			window.addEventListener('touchmove', handler, { passive: true })
			window.addEventListener('wheel', handler, { passive: true })
		}

		function removeScrollInteractionEventListeners(handler: () => void) {
			window.removeEventListener('touchmove', handler)
			window.removeEventListener('wheel', handler)
		}

		return {
			animatedScrollTo,
			scrollToComponent,
			scrollToSelector,
		}
	}
)
