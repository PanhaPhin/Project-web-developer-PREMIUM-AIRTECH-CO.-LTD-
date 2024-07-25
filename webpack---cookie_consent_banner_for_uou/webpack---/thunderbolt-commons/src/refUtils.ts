import type { Component } from '@wix/thunderbolt-becky-types'

export const GHOST_COMP_TYPE = 'GhostComp'

export const REF_DELIMITER = '_r_'

export const SHARED_PARTS_PREFIX = 'sharedParts'

export const getUniqueId = (refId: string, originalId: string) => `${refId}${REF_DELIMITER}${originalId}`

export const removeSharedPartsPrefix = (id: string) => id.replace(`${SHARED_PARTS_PREFIX}${REF_DELIMITER}`, '')

export const fixSharedPartsIds = (id: string) => `${SHARED_PARTS_PREFIX}${REF_DELIMITER}${id}`

export const hasSharedPartsPrefix = (id: string) =>
	id.split(REF_DELIMITER)[0] === SHARED_PARTS_PREFIX && id.split(REF_DELIMITER).length >= 2

export function replaceSharedPartsPrefix(str: string, replacement: string) {
	return str.replace(SHARED_PARTS_PREFIX, replacement)
}

export const getRefCompIdFromInflatedId = (id: string): string => {
	if (hasSharedPartsPrefix(id)) {
		return id
	}

	return id.split(`${REF_DELIMITER}`)[0]
}

// Will give different result than getRefCompIdFromInflatedId()
// in case of widget-in-widget. for example:
// id='firstRefComp_r_secondRefComp_r_innerCompId' -> return 'firstRefComp_r_secondRefComp'
export const getMultipleRefCompsIdFromInflatedId = (id: string): string => {
	const isSharedPart = hasSharedPartsPrefix(id)
	const refCompId = isSharedPart ? removeSharedPartsPrefix(id) : id
	const multipleRefCompsIdFromInflatedId = refCompId.substring(0, refCompId.lastIndexOf(`${REF_DELIMITER}`)) || id

	return isSharedPart ? fixSharedPartsIds(multipleRefCompsIdFromInflatedId) : multipleRefCompsIdFromInflatedId
}
export const getTemplateFromInflatedId = (id: string): string | undefined =>
	removeSharedPartsPrefix(id).split(REF_DELIMITER).pop()

export const getRefCompIdsFromInflatedId = (id: string): Array<string> =>
	getMultipleRefCompsIdFromInflatedId(id).split(`${REF_DELIMITER}`)

export const isRefComponent = (component?: Component) => component?.componentType.endsWith('RefComponent')

export function isInflatedId(id: string): boolean {
	return removeSharedPartsPrefix(id).includes(REF_DELIMITER)
}
