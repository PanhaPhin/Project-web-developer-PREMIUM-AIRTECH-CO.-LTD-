import { ParsedSvg } from './typing'

type SvgTypes = 'shape' | 'tint' | 'color' | 'ugc'

const SVG_TYPES: { [k: string]: SvgTypes } = {
	SHAPE: 'shape',
	TINT: 'tint',
	COLOR: 'color',
	UGC: 'ugc',
}

const attributesRegexes = {
	fill: /fill="(.*?)"/g,
	'data-color': /data-color="(.*?)"/g,
	'data-type': /data-type="(.*?)"/g,
	'data-bbox': /data-bbox="(.*?)"/g,
	width: /width="(.*?)"/g,
	height: /height="(.*?)"/g,
	viewBox: /viewBox="(.*?)"/g,
}

const elementsRegexes = {
	svg: /(<svg(.*?)>)/g,
	path: /(<path(.*?)>)/g,
}

const getViewBoxObject = (viewBox: string) => {
	const vieBoxArr = viewBox.split(' ')
	return {
		x: vieBoxArr[0],
		y: vieBoxArr[1],
		width: vieBoxArr[2],
		height: vieBoxArr[3],
	}
}

const getAll = (str: string, regex: RegExp, defaultValue?: string): Array<string> => {
	const match = regex.exec(str)
	if (match) {
		return [match[1], ...getAll(str, regex, defaultValue)]
	}
	return defaultValue ? [defaultValue] : []
}

const getUGCViewBox = (svgType: SvgTypes, svgNode: string) => {
	if (svgType === SVG_TYPES.UGC) {
		const [width] = getAll(svgNode, attributesRegexes.width)
		const [height] = getAll(svgNode, attributesRegexes.height)
		if (width && height) {
			return `0 0 ${width} ${height}`
		}
	}
	return ''
}

const getColors = (nodes: Array<string>) =>
	nodes.reduce((colors: { [k: string]: string }, node: string) => {
		const [dataColor] = getAll(node, attributesRegexes['data-color'])
		const [fill] = getAll(node, attributesRegexes.fill)
		colors[`color${dataColor}`] = fill
		return colors
	}, {})

const parseSvgString = (svgString: string): ParsedSvg => {
	const [svgNode] = getAll(svgString, elementsRegexes.svg)
	const pathNodes = getAll(svgString, elementsRegexes.path)

	const [svgType] = getAll(svgNode, attributesRegexes['data-type'], SVG_TYPES.SHAPE)
	const [viewBox] = getAll(svgNode, attributesRegexes.viewBox).concat([getUGCViewBox(svgType as SvgTypes, svgNode)])
	const [bbox] = getAll(svgNode, attributesRegexes['data-bbox']) || ''

	const svgInfo = {
		...getColors(pathNodes),
		svgType,
		viewBox,
		bbox,
	}

	return {
		content: svgString,
		info: svgInfo,
		boxBoundaries: bbox ? getViewBoxObject(bbox) : {},
	}
}

export { parseSvgString, attributesRegexes, elementsRegexes, getAll, SvgTypes, SVG_TYPES }
