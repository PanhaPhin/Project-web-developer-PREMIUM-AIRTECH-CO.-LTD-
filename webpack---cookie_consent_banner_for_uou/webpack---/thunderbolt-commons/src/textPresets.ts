import { parseFontStr, getFontFamilyWithFallbacks } from './fonts'

export const textPresetKeys = [
	'Title',
	'Menu',
	'Page-title',
	'Heading-XL',
	'Heading-L',
	'Heading-M',
	'Heading-S',
	'Body-L',
	'Body-M',
	'Body-S',
	'Body-XS',
]

export type TextPresetFontObject = {
	editorKey: string
	lineHeight: string
	style: string
	weight: string
	size: string
	fontFamily: string
	value: string
}

export const createFontValue = (
	italic: string,
	variant: string,
	weight: string,
	size: string,
	lineHeight: string,
	family: string,
	underline: string,
	getFontsFromExternal: boolean
): string => {
	const fontFamilyWithFallbacks = getFontFamilyWithFallbacks(family, getFontsFromExternal)
	return `font:${italic} ${variant} ${weight} ${size}/${lineHeight} ${fontFamilyWithFallbacks};${underline}`
}

const createTextPresetFontObject = (
	font: string,
	editorKey: string,
	getFontsFromExternal: boolean
): TextPresetFontObject => {
	const fontObj = parseFontStr(font)

	const sizePx = `${fontObj.size}px`
	return {
		editorKey,
		lineHeight: fontObj.lineHeight,
		style: fontObj.style,
		weight: fontObj.weight,
		size: sizePx,
		fontFamily: fontObj.family.join(',').toLowerCase(),
		value: createFontValue(
			fontObj.style,
			fontObj.variant,
			fontObj.weight,
			sizePx,
			fontObj.lineHeight,
			fontObj.family.join(','),
			'',
			getFontsFromExternal
		),
	}
}

export const getTextPresets = (themeFonts: Array<string>, getFontsFromExternal: boolean) =>
	textPresetKeys
		.filter((_val, index) => themeFonts[index])
		.map((val, index) => ({
			name: val,
			editorKey: `font_${index}`,
			font: themeFonts[index],
		}))
		.reduce<Record<string, TextPresetFontObject>>((acc, val) => {
			acc[val.name] = createTextPresetFontObject(val.font, val.editorKey, getFontsFromExternal)
			return acc
		}, {})
