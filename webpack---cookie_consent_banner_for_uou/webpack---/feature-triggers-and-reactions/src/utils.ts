import { IPropsStore } from '@wix/thunderbolt-symbols'
import { getDisplayedId, getFullId, getFullItemId } from '@wix/thunderbolt-commons'
import type { TriggersAndReactionsPageConfig } from './types'
import type { ReactionsInBpRange, ViewportTriggerParams } from '@wix/thunderbolt-becky-types'

export const getReactionTargetComps = (
	originalTarget: string,
	srcCompId: string,
	repeaterDescendantToRepeaterMapper: TriggersAndReactionsPageConfig['repeaterDescendantToRepeaterMapper'],
	propsStore: IPropsStore
) => {
	const targetRepeaterParent = repeaterDescendantToRepeaterMapper[originalTarget]
	// if target is repeater child - template component
	if (targetRepeaterParent) {
		// if the trigger not from the same repeater add reaction to all items
		if (targetRepeaterParent !== repeaterDescendantToRepeaterMapper[getFullId(srcCompId)]) {
			const { items = [] } = propsStore.get(repeaterDescendantToRepeaterMapper[originalTarget])
			return items.map((item: string) => getDisplayedId(originalTarget, item))
		} else {
			return [getDisplayedId(originalTarget, getFullItemId(srcCompId))]
		}
	} else {
		return [originalTarget]
	}
}

export const hasAncestorWithId = (element: EventTarget | null, id: string): boolean => {
	if (!element) {
		return false
	}
	const htmlElement = element as HTMLElement
	if (htmlElement.id === id) {
		return true
	}
	return !!htmlElement.parentNode && hasAncestorWithId(htmlElement.parentNode, id)
}

export const isTriggerBpRangeInCurrentWindowRange = (
	condition: ReactionsInBpRange['triggerBpRange'],
	viewportWidth?: number
) => {
	viewportWidth = viewportWidth || window.innerWidth
	if (condition.min && viewportWidth < condition.min) {
		return false
	}
	if (condition.max && viewportWidth > condition.max) {
		return false
	}
	return true
}

export const stringifyOptions = ({
	threshold,
	margin: { top, bottom, left, right },
}: Required<ViewportTriggerParams>) =>
	`${threshold}_${top.value}${top.type}_${right.value}${right.type}_${bottom.value}${bottom.type}_${left.value}${left.type}`
