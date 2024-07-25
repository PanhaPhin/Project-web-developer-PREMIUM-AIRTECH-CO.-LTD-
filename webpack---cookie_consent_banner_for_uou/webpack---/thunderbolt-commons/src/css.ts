import type { Spx } from '@wix/thunderbolt-becky-types'

const HALF_PX = '0.5px'

export const CONTAINER_TYPES = {
	Page: true,
	MasterPage: true,
	AppPage: true,
	VerticalRepeater: true,
	QuickActionBar: true,
	PageGroup: true,
	SiteRegionContainer: true,
	Container: true,
	MediaBox: true,
	HoverBox: true,
	PopupContainer: true,
	Group: true,
	FormContainer: true,
	WSiteStructure: true,
	HeaderContainer: true,
	FooterContainer: true,
	PagesContainer: true,
	StripContainer: true,
	StripColumnsContainer: true,
	ClassicSection: true,
	Column: true,
	MediaPlayer: true,
	ScreenWidthContainer: true,
	Area: true,
	BoxSlideShow: true,
	StateBox: true,
	StateStrip: true,
	StateBoxState: true,
	StateBoxFormState: true,
	StateStripState: true,
	StripContainerSlideShow: true,
	SlideShowSlide: true,
	BoxSlideShowSlide: true,
	StripContainerSlideShowSlide: true,
	Repeater: true,
	MediaContainer: true,
	MenuContainer: true,
	AppWidget: true,
	Popover: true,
	RefComponent: true,
	Section: true,
	HeaderSection: true,
	FooterSection: true,
	MembersAreaSection: true,
	MultiStateBox: true,
	MegaMenuContainerItem: true,
	StretchedContainer: true,
	SettingsPanelContainer: true,
	SingleTab: true,
	AccordionItem: true,
	SelectableContainer: true,
	HamburgerMenuContainer: true,
}

export const meshIgnoredComponentTypes: Record<string, boolean> = {
	BackgroundGroup: true,
	Repeater: true,
	PagesContainer: true,
	PageGroup: true,
	Column: true, // mesh for column will be calculated by StripColumnsContainer
	StripContainerSlideShow: true,
	BoxSlideShow: true,
	PinnedLayer: true,
	MeshGroup: true,
	MegaMenuContainerItem: true,
}

export const SPX_VALUE_REGEX = /-?[0-9]*\.?[0-9]*spx/

const roundToFactor = (value: number, numberOfDecimals: number) => {
	let factor = Math.pow(10, numberOfDecimals)
	let roundedNumber = Math.round(value * factor) / factor
	while (roundedNumber === 0 && value !== 0) {
		factor *= 10
		roundedNumber = Math.round(value * factor) / factor
	}
	return roundedNumber
}

export const getSpxScalingCssValue = (scalingValue: number) => {
	return `calc((${scalingValue} * var(--one-unit)) - (var(--scrollbar-width) * ${scalingValue / 100}))`
}

export const getCqwUnit = (numericValue: number, refWidth: number) => roundToFactor((numericValue / refWidth) * 100, 3)

const fixCssUnits = (css: string) => {
	let bracketsCounter = 0

	for (let i = 0; i < css.length; i++) {
		if (css[i] === '(') {
			bracketsCounter++
		} else if (css[i] === ')') {
			bracketsCounter--
		} else if (bracketsCounter === 0 && css[i].match(/\d/) && (css[i + 1] === ' ' || i === css.length - 1)) {
			css = css.slice(0, i + 1) + 'px' + css.slice(i + 1)
		}
	}
	return css
}

const getCalcCssValue = (numericValue: number, refWidth: number) => {
	// @ts-ignore
	const isNewSpxResolving = globalThis?.newSpxResolving ?? false
	if (isNewSpxResolving) {
		return `max(0.5px, calc(${Number(
			(numericValue / refWidth).toFixed(7)
		)} * (var(--scaling-factor) - var(--scrollbar-width))))`
	}
	const calcUnitValue = getCqwUnit(numericValue, refWidth)
	const calcCssValue = getSpxScalingCssValue(calcUnitValue)
	const maxSize = `calc(${roundToFactor(numericValue / refWidth, 3)} * var(--section-max-width))`

	if (calcUnitValue < 0) {
		// Calculate the negative max size and ensure it is correctly formatted
		return `clamp(${maxSize}, ${calcCssValue}, -${HALF_PX})`
	}
	return `clamp(${HALF_PX}, ${calcCssValue}, ${maxSize})`
}

export const resolveSpxAttribute = (value: string | number, spx?: Spx | undefined, keepNumValues: boolean = false) => {
	const valuesWithResolvedSpx = `${value}`.replace(new RegExp(SPX_VALUE_REGEX, 'g'), (spxValue) =>
		resolveSpxValue(spxValue, spx)
	)

	return keepNumValues ? valuesWithResolvedSpx : fixCssUnits(valuesWithResolvedSpx)
}

export const resolveSpxValue = (spxValue: string, spx: Spx | undefined) => {
	const { refWidth, resolverType } = spx ?? {}
	const isScale = resolverType === 'scale'
	const numericValue = parseFloat(spxValue)
	return isNaN(numericValue)
		? spxValue
		: isScale && refWidth && numericValue !== 0
		? getCalcCssValue(numericValue, refWidth)
		: `${numericValue}px`
}

export const getSpxValueResolver = (spx: Spx | undefined) => (value: string) => resolveSpxValue(value, spx)
