import _ from 'lodash'
import { TransformData, UnitSize } from '@wix/thunderbolt-becky-types'

const orderedTransformationKeys = ['translate', 'scale', 'rotate', 'skew']
const DEFAULT_TRANSLATE = 'translateX(0)translateY(0)'
const DEFAULT_SCALE = 'scaleX(1)scaleY(1)'
const DEFAULT_SKEW = 'skewX(0deg)skewY(0deg)'
const DEFAULT_ROTATE = 'rotate(0deg)'

const isPropertyDefined = (property: keyof TransformData, styleItem: Partial<TransformData>) =>
	styleItem.hasOwnProperty(property) && styleItem[property] !== undefined && styleItem[property] !== null

const getUnit = (unit: UnitSize['type']) => {
	if (unit === 'percentage') {
		return '%'
	}
	return unit
}

const resolveValueWithUnit = (valueWithUnit?: UnitSize) =>
	valueWithUnit ? `${valueWithUnit.value}${getUnit(valueWithUnit.type)}` : 0

const resolveNumber = (value: number) => value || 0

const isStyleItemContainsTransformProps = (styleItem: Partial<TransformData>) =>
	orderedTransformationKeys.some((property) => isPropertyDefined(property as keyof TransformData, styleItem))

const getTranslateString = (translate?: TransformData['translate']) => {
	let translateString = ''
	if (!translate) {
		return DEFAULT_TRANSLATE
	}
	const { x: translateX, y: translateY } = translate
	if (translateX) {
		translateString += `translateX(${resolveValueWithUnit(translateX)})`
	} else {
		translateString += 'translateX(0)'
	}
	if (translateY) {
		translateString += `translateY(${resolveValueWithUnit(translateY)})`
	} else {
		translateString += 'translateY(0)'
	}
	return translateString
}

const getScaleString = (scale?: TransformData['scale']) => {
	let scaleString = ''
	if (!scale) {
		return DEFAULT_SCALE
	}
	const { x: scaleX = 1, y: scaleY = 1 } = scale
	if (_.isNumber(scaleX)) {
		scaleString += `scaleX(${scaleX})`
	}
	if (_.isNumber(scaleY)) {
		scaleString += `scaleY(${scaleY})`
	}
	return scaleString
}

const getRotateString = (componentDefaultRotation?: number, rotate?: number) => {
	if (_.isNumber(rotate) || componentDefaultRotation) {
		const compRotation = componentDefaultRotation || 0
		const variantRotation = rotate || 0
		// chrome bug - An element with 3d transform ignores 'overflow: hidden' on a parent, when angles are multiplies of 90.
		// Jira - https://jira.wixpress.com/browse/WOW-83
		// Chrome bug report - https://bugs.chromium.org/p/chromium/issues/detail?id=1207151
		const adjustRotationForChrome = rotate && rotate % 90 === 0 ? 0.0001 : 0
		return `rotate(${resolveNumber(variantRotation) + compRotation + adjustRotationForChrome}deg)`
	}
	return DEFAULT_ROTATE
}

const getSkewString = (skew?: TransformData['skew']) => {
	let skewString = ''
	if (!skew) {
		return DEFAULT_SKEW
	}
	const { x: skewX = 0, y: skewY = 0 } = skew
	if (_.isNumber(skewX)) {
		skewString += `skewX(${skewX}deg)`
	}
	if (_.isNumber(skewY)) {
		skewString += `skewY(${skewY}deg)`
	}
	return skewString
}

export {
	isStyleItemContainsTransformProps,
	getTranslateString,
	getRotateString,
	getScaleString,
	getSkewString,
	orderedTransformationKeys,
}
