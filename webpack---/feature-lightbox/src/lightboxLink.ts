import { withDependencies } from '@wix/thunderbolt-ioc'
import { ILightbox, LightboxSymbol, name } from './index'
import { ILinkClickHandler } from '@wix/thunderbolt-symbols'
import { IUrlHistoryManager, UrlHistoryManagerSymbol, removeQueryParams, removeProtocol } from 'feature-router'

const TOP_AND_BOTTOM_ANCHORS = ['SCROLL_TO_TOP', 'SCROLL_TO_BOTTOM']

const lightboxLinkFactory = (lightboxApi: ILightbox, urlHistoryManager: IUrlHistoryManager): ILinkClickHandler => ({
	handlerId: name,
	handleClick: (anchor) => {
		const popupId = anchor.getAttribute('data-popupid')
		if (popupId) {
			lightboxApi.open(popupId)
			return true
		}
		const fullUrlWithoutQueryParams = urlHistoryManager.getFullUrlWithoutQueryParams()
		const isLightboxOpen = !!lightboxApi.getCurrentLightboxId()
		const href = anchor.getAttribute('href')
		const hrefWithoutQueryParams = href && removeQueryParams(href)
		const fullUrlNoProtocol = removeProtocol(fullUrlWithoutQueryParams)
		const hrefNoProtocol = removeProtocol(hrefWithoutQueryParams || '')

		const isLinkToCurrentPage = fullUrlNoProtocol === hrefNoProtocol

		const anchorDataId = anchor.getAttribute('data-anchor') || ''
		const isTopBottomAnchor = TOP_AND_BOTTOM_ANCHORS.includes(anchorDataId)
		const isLinkToNewTab = anchor.getAttribute('target') === '_blank'

		if (isLightboxOpen && (isLinkToCurrentPage || isTopBottomAnchor) && !isLinkToNewTab) {
			lightboxApi.close()
			return true
		}

		return false
	},
})

export const LightboxLink = withDependencies([LightboxSymbol, UrlHistoryManagerSymbol], lightboxLinkFactory)
