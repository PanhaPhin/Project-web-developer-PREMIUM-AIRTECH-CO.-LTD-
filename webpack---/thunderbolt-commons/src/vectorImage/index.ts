import { getFromColorMap, isGreyscale, isThemeColor, isColor } from '../color'
import { SvgShadow, SvgLayout, SvgInfo, SvgProperties, MaskFlip, ShapeDividerBGImage } from './typing'
import { getShadow, getFilter } from './svgFilters'
import { parseSvgString } from './svgParser'
import Color from 'color'
import { ColorMap, ShapeDividersLayersEffect, UnitLengthPercentage } from '@wix/thunderbolt-becky-types'
import { compIdToCssSelector } from '../hoverBoxUtils'

export type ImageDimensions = {
	width: number
	height: number
}

type VectorImageNoAltA11y = {
	role: string
	['aria-hidden']: string
}

const viewBoxMatcher = /(viewBox=")([^"]*)(")/i
const preserveAspectRatioMatcher = /(preserveAspectRatio=")([^"]*)(")/i
const svgWidthMatcher = /(?:<svg[^>]*)\s(width="[^"]*")/i
const svgHeightMatcher = /(?:<svg[^>]*)\s(height="[^"]*")/i
const svgTagMatcher = /(<svg[^>]*)(>)/
const fillAttributeMatcher = /fill="(.*?)"/gi
const styleAttributeMatcher = /style="([^"]*)"/i
const styleTransformMatcher = /transform:([^;]*)/i

const SVG_TYPES = {
	SHAPE: 'shape',
	TINT: 'tint',
	COLOR: 'color',
	UGC: 'ugc',
}

function setSvgId(svgString: string, svgId: string) {
	if (!svgString) {
		return svgString
	}

	const svgTagMatch = svgString.match(svgTagMatcher)

	if (svgTagMatch) {
		let svgTag = svgTagMatch[0]
		const idMatch = svgTag.match(/id="[-\w]+"/)

		if (idMatch) {
			svgTag = svgTag.replace(idMatch[0], `id="${svgId}"`)
		} else {
			svgTag = svgTag.replace('<svg ', `<svg id="${svgId}" `)
		}

		svgString = svgString.replace(svgTagMatch[0], svgTag)
	}

	return svgString
}

const symbols = /[\r\n%#()<>?[\\\]^`{|}]/g

/**
 * Returns a data URI SVG encoded for CSS <url> value
 */
function encodeSVG(svg: string) {
	const escaped = svg
		.replace(/"/g, "'") // Use single quotes instead of double to avoid encoding.
		.replace(/>\s+</g, '><') // trim
		.replace(/\s{2,}/g, ' ') // trim
		.replace(symbols, encodeURIComponent) // encode symbols

	return `url("data:image/svg+xml,${escaped}")`
}

function transformToTintColors(svgString: string, resolvedColor: string) {
	const baseColor = Color(resolvedColor)
	return svgString.replace(fillAttributeMatcher, (__, colorToTint) => {
		if (colorToTint === 'none' || colorToTint.startsWith('url(#')) {
			return `fill="${colorToTint}"`
		}
		const colorObj = Color(colorToTint)
		if (isGreyscale(colorObj)) {
			const tint = 1 - (255 - colorObj.red()) / 255 // eslint-disable-line no-mixed-operators
			const rTint = Math.floor(baseColor.red() + (255 - baseColor.red()) * tint) // eslint-disable-line no-mixed-operators
			const gTint = Math.floor(baseColor.green() + (255 - baseColor.green()) * tint) // eslint-disable-line no-mixed-operators
			const bTint = Math.floor(baseColor.blue() + (255 - baseColor.blue()) * tint) // eslint-disable-line no-mixed-operators
			const tintedColor = Color({ r: rTint, g: gTint, b: bTint })
			// return tinted color
			return `fill="${tintedColor.hex().toString()}"`
		}
		// no change, return original svg color
		return `fill="${colorToTint}"`
	})
}

type SVGDimensions = { width: number | string; height: number | string }

function removeWidthAndHeight(svgString: string, addIfMissing?: boolean | SVGDimensions) {
	if (svgString) {
		const widthMatch = svgString.match(svgWidthMatcher)
		const heightMatch = svgString.match(svgHeightMatcher)
		if (widthMatch && widthMatch.length > 1) {
			svgString = svgString.replace(widthMatch[1], 'width="100%"')
		}
		if (heightMatch && heightMatch.length > 1) {
			svgString = svgString.replace(heightMatch[1], 'height="100%"')
		}

		if (addIfMissing && !(widthMatch && heightMatch)) {
			const dimensions = addIfMissing as SVGDimensions
			const newWidth = dimensions.width ? ` width="${dimensions.width}"` : ' width="100%"'
			const newHeight = dimensions.height ? ` height="${dimensions.height}"` : ' height="100%"'
			svgString = svgString.replace(
				svgTagMatcher,
				`$1${!widthMatch ? newWidth : ''}${!heightMatch ? newHeight : ''}$2`
			)
		}
	}
	return svgString
}

function getNoAltA11yAttributes(asString: boolean = false): string | VectorImageNoAltA11y {
	const feats = { role: 'presentation', 'aria-hidden': 'true' }
	return asString
		? Object.entries(feats)
				.map(([key, value]) => `${key}=${value}`)
				.join(' ')
		: feats
}

function escapeHtml(str: string) {
	return str.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
}

function addA11yAttributes(svgString: string, altText?: string) {
	const a11yFeatures = altText ? `role="img"` : getNoAltA11yAttributes(true)
	let newSvgString = svgString.replace(svgTagMatcher, `$1 ${a11yFeatures}$2`)
	if (typeof altText === 'string') {
		newSvgString = newSvgString.replace(svgTagMatcher, `$1 aria-label="${escapeHtml(altText)}"$2`)
	}
	return newSvgString
}

function getFilterRectInPixels(layout: SvgLayout | null, shadow: SvgShadow) {
	const { blurRadius, x, y } = shadow
	// STD to pixel ~ STD value * 3 , we are multiplying by 6 for both sides
	const blurSpread = blurRadius! * 6
	const filterAttr = {
		x: Math.min(0, x!) - blurSpread / 2,
		y: Math.min(0, y!) - blurSpread / 2,
	}
	let res = `x="${filterAttr.x}" y="${filterAttr.y}"`
	if (layout != null) {
		// In bolt the width and height values are only relevant in the classic editor. In EditorX they end up as NaN
		// In order to have parity with the Bolt implementation, we leave width and height undefined,
		// We avoid NaN values because it results in console errors
		const width = layout.width + blurSpread + Math.abs(x!)
		const height = layout.height + blurSpread + Math.abs(y!)
		res += ` width="${width}" height="${height}"`
	}
	return res
}

function getShadowFilter(
	filterId: string,
	shadow: SvgShadow,
	layout: SvgLayout | null,
	hexColor: string,
	mergeGraphic: boolean
) {
	const filterString = getShadow(filterId, { ...shadow, color: hexColor, mergeGraphic })
	return filterString.replace(
		/<filter /,
		`<filter ${getFilterRectInPixels(layout, shadow)} filterUnits="userSpaceOnUse" `
	)
}

function getViewBoxFromData(svgInfo: Partial<SvgInfo>, properties: SvgProperties = {}) {
	const { svgType, viewBox, bbox } = svgInfo
	const { preserveViewBox } = properties

	if (svgType !== SVG_TYPES.UGC && !preserveViewBox && bbox) {
		return bbox
	}

	return viewBox
}

function getScaledSvgViewBox(svgString: string, svgInfo: Partial<SvgInfo>, properties: SvgProperties = {}) {
	if (svgString) {
		const { svgType, viewBox, bbox } = svgInfo
		const { preserveViewBox, displayMode, aspectRatio } = properties

		const preserveAspectRatio = aspectRatio || (displayMode === 'stretch' ? 'none' : 'xMidYMid meet')

		let svgTag = svgString.match(svgTagMatcher)?.[0]

		if (svgTag) {
			if (preserveAspectRatioMatcher.test(svgTag)) {
				svgString = svgString.replace(
					svgTag,
					svgTag.replace(preserveAspectRatioMatcher, `$1${preserveAspectRatio}$3`)
				)
			} else {
				svgString = svgString.replace(/<svg/, `<svg preserveAspectRatio="${preserveAspectRatio}"`)
			}
		} else {
			// no top svg tag so bail out
			return svgString
		}

		if (!viewBoxMatcher.test(svgTag)) {
			if (svgType === SVG_TYPES.UGC && viewBox) {
				svgString = svgString.replace(/<svg/, `<svg viewBox="${viewBox}"`)
			}
			if (svgType !== SVG_TYPES.UGC && bbox) {
				svgString = svgString.replace(/<svg/, `<svg viewBox="${bbox}"`)
			}
		}

		if (svgType !== SVG_TYPES.UGC && !preserveViewBox && bbox) {
			svgTag = svgString.match(svgTagMatcher)![0]
			svgString = svgString.replace(svgTag, svgTag.replace(viewBoxMatcher, `$1${bbox}$3`))
		}
	}

	return svgString
}

function wrapWithShadow({
	compId,
	svgString,
	layout,
	colorsMap,
	shadow,
	shadowOnly = false,
}: {
	compId: string
	svgString: string
	layout: SvgLayout | null
	colorsMap?: ColorMap
	shadow?: SvgShadow
	shadowOnly?: boolean
}) {
	if (shadow && shadow.color) {
		const filterId = `${compId}-shadow`
		const hexColor = getFromColorMap(shadow.color, colorsMap)
		const shadowFilter = getShadowFilter(filterId, shadow, layout, hexColor, !shadowOnly)
		const modifiedContent = removeWidthAndHeight(svgString)
		return `
          <svg height="100%" width="100%">
              <defs>${shadowFilter}</defs>
              <g filter="url(#${filterId})">
                  ${modifiedContent}
              </g>
          </svg>
      `
	}
	return svgString
}

function getCSSDropShadow(shadow?: SvgShadow, colorsMap?: ColorMap): string {
	if (shadow && shadow.color && shadow.opacity) {
		const hexColor = getFromColorMap(shadow.color, colorsMap)
		const opacity = Math.round(shadow.opacity * 255).toString(16)
		return `drop-shadow(${shadow.x}px ${shadow.y}px ${shadow.blurRadius}px ${hexColor}${opacity.padStart(2, '0')})`
	}

	return ''
}

function getCSSStrokeAdjustments(strokeWidth: number) {
	if (strokeWidth) {
		return {
			svgCalculatedPadding: `${Math.floor(strokeWidth / 2)}px ${Math.ceil(strokeWidth / 2)}px ${Math.ceil(
				strokeWidth / 2
			)}px ${Math.floor(strokeWidth / 2)}px`,
			svgCalculatedWidth: `calc(100% - ${strokeWidth}px)`,
			svgCalculatedHeight: `calc(100% - ${strokeWidth}px)`,
		}
	}
	return {}
}

const FLIP_DATA_TO_TRANSFORM = {
	x: 'scale(-1, 1)',
	y: 'scale(1, -1)',
	xy: 'scale(-1, -1)',
	none: '',
}

function getFlippedSVG(svgString: string, flip: keyof typeof FLIP_DATA_TO_TRANSFORM) {
	const topSvg = svgString.match(svgTagMatcher)
	const transform = FLIP_DATA_TO_TRANSFORM[flip] || ''

	if (topSvg && transform) {
		const styleMatch = topSvg[0].match(styleAttributeMatcher)
		let replacement = `$1 style="transform: ${transform};"$2`

		if (styleMatch) {
			const transformMatch = styleMatch[1].match(styleTransformMatcher)

			if (transformMatch) {
				replacement = topSvg[0].replace(
					styleMatch[0],
					styleMatch[0].replace(transformMatch[0], `transform: ${transform} ${transformMatch[1]}`)
				)
			} else {
				replacement = topSvg[0].replace(styleMatch[0], `style="transform: ${transform}; ${styleMatch[1]}"`)
			}
		}

		return svgString.replace(svgTagMatcher, replacement)
	}

	return svgString
}

function getSvgContentForMask(svgString: string, svgInfo: SvgInfo, flip: MaskFlip) {
	const content = getScaledSvgViewBox(svgString, svgInfo, { displayMode: 'stretch' })

	// we must have the transform style inlined inside the SVG content
	return getFlippedSVG(content, flip)
}

function addSvgStyleNode(svgString: string, defsValue: string) {
	if (svgString && defsValue) {
		return svgString.replace(/(<svg[^>]*>)/, `$1<defs><style>${defsValue}</style></defs>`)
	}

	return svgString
}

const DEFAULT_COLOR = '#242323'

export type VectorImageTransformationOptions = {
	altText?: string
	compId: string
	strokeWidth: number
	svgInfo: SvgInfo
	properties?: SvgProperties
	layout: SvgLayout
	shadow?: SvgShadow
	colorsMap?: Array<string>
	overrideColors?: Record<string, string>
	svgId: string
	isResponsive?: boolean
}

const pickValidColors = (obj: Record<string, string>) =>
	Object.keys(obj).reduce((result: Record<string, string>, key) => {
		const colorValue = obj[key]
		if (isColor(colorValue) || isThemeColor(colorValue)) {
			result[key] = colorValue
		}
		return result
	}, {})

const transformVectorImage = (
	rawSvg: string,
	{
		altText,
		compId,
		svgInfo,
		properties,
		layout,
		shadow,
		isResponsive,
		colorsMap,
		overrideColors: overrideColorsInuput,
	}: VectorImageTransformationOptions
) => {
	const overrideColors = pickValidColors(overrideColorsInuput || {})

	function withA11y(svgString: string) {
		return addA11yAttributes(svgString, altText)
	}

	function withScaledViewBox(svgString: string) {
		return getScaledSvgViewBox(svgString, svgInfo, properties)
	}

	function withShadowFilter(svgString: string) {
		return wrapWithShadow({
			compId,
			svgString,
			layout: isResponsive ? null : layout,
			colorsMap,
			shadow,
		})
	}

	function withTintColors(svgString: string) {
		const rawColor = (overrideColors && overrideColors.color1) || DEFAULT_COLOR
		const color = getFromColorMap(rawColor, colorsMap)
		return svgInfo.svgType === SVG_TYPES.TINT ? transformToTintColors(svgString, color) : svgString
	}

	function withCssOverrides(svgString: string) {
		const shouldOverrideColors = svgInfo.svgType === SVG_TYPES.COLOR && Object.keys(overrideColors).length > 0
		if (shouldOverrideColors) {
			const colors = Object.entries<string>(overrideColors)
				.map(([colorName, rawColor]) => {
					const resolvedColor = getFromColorMap(rawColor, colorsMap)
					const index = colorName.replace('color', '')
					return `${compIdToCssSelector(compId, true)} svg [data-color="${index}"] {fill: ${resolvedColor};}`
				})
				.join('\n')
			return addSvgStyleNode(svgString, colors)
		}
		return svgString
	}

	const content = withScaledViewBox(withTintColors(withA11y(rawSvg)))

	return withCssOverrides(isResponsive ? content : withShadowFilter(content))
}

export type ShapeDividerTransformationOptions = {
	color?: string
	opacity?: number
	height: string
	keepAspectRatio: boolean
	offsetX: Partial<UnitLengthPercentage>
	compId: string
	side: string
	shouldRepeat: boolean
	repeatCount: number
	shouldInvert: boolean
	svgInfo: SvgInfo
	layersEffect: ShapeDividersLayersEffect
	colorVarName: string
}

const HAIRLINE_FIX_FACTOR = 1

function invertSvgContent(svgContent: string, x: number, y: number, width: number, height: number) {
	const pathDRe = /<path.*\s*d="([^"]+)"/
	const pathTagRe = /(<path)[^>]*>/

	const pathTag = svgContent.match(pathTagRe)?.[1] || ''
	const pathData = svgContent.match(pathDRe)?.[1] || ''

	const rectPathSuffix = `M${x},${y - HAIRLINE_FIX_FACTOR} h${width} v${height + HAIRLINE_FIX_FACTOR} h${-width} Z`
	return svgContent
		.replace(pathData, `${pathData} ${rectPathSuffix}`)
		.replace(pathTag, `${pathTag} fill-rule="evenodd"`)
}

function trimSvgContents(svgContent: string) {
	const svgContentStartRe = /^(.*\s*)<svg/
	const svgContentEndRe = /<\/svg>(\s*)$/

	return svgContent.replace(svgContentStartRe, '<svg').replace(svgContentEndRe, '</svg>')
}

const getShapeDividerImageCss = (
	rawSvg: string,
	{
		color,
		height,
		keepAspectRatio,
		compId,
		side,
		shouldRepeat,
		repeatCount,
		shouldInvert,
		svgInfo,
	}: ShapeDividerTransformationOptions
): ShapeDividerBGImage => {
	const aspectRatio = keepAspectRatio ? (shouldRepeat ? 'xMinYMax meet' : 'xMidYMax slice') : 'none'
	const viewBox = getViewBoxFromData(svgInfo)

	if (!rawSvg || !viewBox) {
		return {
			image: rawSvg ? encodeSVG(rawSvg) : '',
		}
	}

	const [vbX, vbY, vbWidth, vbHeight] = viewBox.split(' ').map((n) => parseFloat(n))
	const viewBoxOverride = `${vbX} ${vbY} ${vbWidth} ${vbHeight}`

	const scaledSvg = getScaledSvgViewBox(
		rawSvg,
		{ svgType: svgInfo.svgType, bbox: viewBoxOverride, viewBox: viewBoxOverride },
		{ aspectRatio }
	)
	const uniqueId = `${compId}-${side}`

	const trimmedContent = trimSvgContents(scaledSvg)
	const processedSvgContent = shouldInvert
		? invertSvgContent(trimmedContent, vbX, vbY, vbWidth, vbHeight)
		: trimmedContent
	const invertingTransform = shouldInvert
		? `#${uniqueId} > g { transform: scaleY(-1) translateY(${-(2 * vbY + vbHeight)}px); } `
		: ''
	const pathColoring = svgInfo.svgType === 'color' && !svgInfo.color2 ? `, #${uniqueId} [data-color="1"] ` : ''
	const svgStyle = `${invertingTransform}#${uniqueId}${pathColoring} { fill: ${color}; }`

	const image = encodeSVG(
		removeWidthAndHeight(addSvgStyleNode(setSvgId(processedSvgContent, uniqueId), svgStyle), {
			width: vbWidth.toFixed(2),
			height: vbHeight.toFixed(2),
		})
	)

	const size = `${
		// !NOTE: assuming height is in px!
		// When in aspect-ratio we're calculating width instead of `auto`
		// because of rendering bugs in Safari (vertical hairlines
		// between horizontally repeated SVG as background-image).
		// Since we have fixed height - use it instead of 100%
		// Also limit fraction digits to 2 repeat in stretch - seems to do better in Safari - same issue
		keepAspectRatio
			? `${Math.ceil((vbWidth * parseInt(height, 10)) / vbHeight)}px`
			: `${((1 / (repeatCount + 1)) * 100).toFixed(2)}%`
	} 100%`

	// const position = `center center`

	return {
		image,
		size,
	}
}

const getFontFamilyFontsFromSvg = (svgString: string): Array<Array<string>> => {
	const regex = /font-family=['"](.*?)['"]/gi
	let match
	const fonts: Array<Array<string>> = []

	do {
		match = regex.exec(svgString)
		if (match && match[1]) {
			const font = match[1].split(',').map((f) => f.replace(/'/g, '').trim())
			fonts.push(font)
		}
	} while (match)
	return fonts
}

const buildSvgUrlFactory = () => {
	const addTrailingSlashIfMissing = (val: string) => (val.endsWith('/') ? val : `${val}/`)
	const getSvgBaseUrl = (mediaRootUrl: string) => `${addTrailingSlashIfMissing(mediaRootUrl)}shapes/`
	const svgIdToUri = (svgId: string) => {
		const partsArr = svgId.replace(/^.*\//, '').split('.')
		const version = partsArr[1] === 'v1' ? 1 : 2
		const svgHash = partsArr[2].replace(/svg_/i, '')
		const svgName = partsArr[3]
		return `${svgHash + (version === 1 ? `_svgshape.v1.${svgName}` : '')}.svg`
	}

	return {
		getSvgBaseUrl,
		buildSvgUrl: (mediaRootUrl: string, svgId: string) => {
			if (/^svgshape\.v[12]/.test(svgId)) {
				const svgUri = svgIdToUri(svgId)
				return `${getSvgBaseUrl(mediaRootUrl)}${svgUri}`
			}
			return `${getSvgBaseUrl(mediaRootUrl)}${svgId}`
		},
	}
}

export {
	trimSvgContents,
	transformToTintColors,
	getFontFamilyFontsFromSvg,
	transformVectorImage,
	getShapeDividerImageCss,
	parseSvgString,
	removeWidthAndHeight,
	getFilter,
	getScaledSvgViewBox,
	getSvgContentForMask,
	encodeSVG,
	getCSSDropShadow,
	getCSSStrokeAdjustments,
	buildSvgUrlFactory,
}
