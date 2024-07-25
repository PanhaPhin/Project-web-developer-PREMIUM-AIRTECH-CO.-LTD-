import { fontsMetaData as innerFontsMetaData } from '@wix/thunderbolt-fonts'
import { fontsMetadata } from '@wix/fonts-data'

export function getFontFamilyWithFallbacks(fontFamily: string, getFontsFromExternal: boolean): string {
	if (!fontFamily) {
		return ''
	}

	const cleanFontName = fontFamily.replace(/\+/g, ' ').toLowerCase()
	const [highestPriorityFont] = cleanFontName.split(',')
	const metaData = getFontsFromExternal ? fontsMetadata[highestPriorityFont] : innerFontsMetaData[highestPriorityFont]
	if (!metaData) {
		return fontFamily
	}
	return [highestPriorityFont, metaData.fallbacks, metaData.genericFamily].filter((t) => t).join(',')
}
