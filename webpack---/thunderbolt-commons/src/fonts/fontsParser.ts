export interface FontObject {
	style: string
	variant: string
	weight: string
	size: number
	sizeUnit?: string
	lineHeight: string
	family: Array<string>
	bold: boolean
	italic: boolean
}

const invalidFonObj: FontObject = {
	style: '',
	variant: '',
	weight: '',
	size: -1,
	lineHeight: '',
	family: [],
	bold: false,
	italic: false,
}

const extractFromQuotes = (str: string): string => {
	const match = str.match(/'(?<strInQuotes>.*?)'/)

	return match ? match.groups!.strInQuotes : str
}

const fontRegEx = /(?<style>.*?)\s(?<variant>.*?)\s(?<weight>.*?)\s(?<size>.*?)\s(?<fullFontFamily>.*)/

export const parseFontStr = (font: string): FontObject => {
	const match = font.match(fontRegEx)
	if (!match) {
		return invalidFonObj
	}

	const { style, variant, weight, size, fullFontFamily } = match.groups!
	const sizeSplit = size ? size.split('/') : []
	const fullFontFamilyArr = fullFontFamily.split(',').map((currFamily) => extractFromQuotes(currFamily))
	const sizeValue = sizeSplit[0].replace(/[a-z|%]+/, '')
	const sizeUnit = sizeSplit[0].replace(sizeValue, '')
	return {
		style,
		variant,
		weight,
		size: parseInt(sizeValue, 10),
		sizeUnit,
		lineHeight: sizeSplit[1],
		family: fullFontFamilyArr,
		bold: weight === 'bold' || parseInt(weight, 10) >= 700,
		italic: style === 'italic',
	}
}
