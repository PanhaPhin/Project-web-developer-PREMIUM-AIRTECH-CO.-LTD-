export const ABOVE_ALL_IN_CONTAINER_Z_INDEX_DEFINED: number = 10000
export const ABOVE_ALL_IN_CONTAINER_Z_INDEX_NOT_DEFINED: number = 49
export const PINNED_LAYER_IN_CONTAINER: number = 99991

export const INITIAL_Z_INDEX: number = 50
export const Z_INDEX_RANGE: number = 1
export const RESPONSIVE_Z_INDEX_ADDITION: number = 2
export const ABOVE_ALL_COMP_Z_INDEX: string = 'calc(var(--above-all-z-index) - 2)'

export const PINNED_LAYER_SUFFIX: string = '-pinned-layer'
export const SECTIONS_CONTAINER_PREFIX: string = 'PAGE_SECTIONS'

// Container IDS
export const CONTAINER_IDS = {
	MASTER_PAGE: 'masterPage',
	SITE_HEADER: 'SITE_HEADER',
	SITE_FOOTER: 'SITE_FOOTER',
	SOSP_CONTAINER_CUSTOM_ID: 'SOSP_CONTAINER_CUSTOM_ID',
	PAGES_CONTAINER: 'PAGES_CONTAINER',
	QUICK_ACTION_BAR: 'QUICK_ACTION_BAR',
}

export const EXCLUDED_COMPONENTS_CLASSIC = [
	CONTAINER_IDS.SITE_HEADER,
	CONTAINER_IDS.SOSP_CONTAINER_CUSTOM_ID,
	CONTAINER_IDS.PAGES_CONTAINER,
	CONTAINER_IDS.SITE_FOOTER,
]
export const ABOVE_ALL_COMPONENTS_CLASSIC = [CONTAINER_IDS.QUICK_ACTION_BAR]

// CSS Properties
export const CSS_PROPERTIES = {
	Z_INDEX: 'z-index',
	ABOVE_ALL_IN_CONTAINER: '--above-all-in-container',
	PINNED_LAYER_IN_CONTAINER: '--pinned-layer-in-container',
	PINNED_LAYERS_IN_PAGE: '--pinned-layers-in-page',
	PINNED_LAYER_IN_CONTAINER_VAR: 'var(--pinned-layer-in-container, 0)',
	PINNED_LAYERS_IN_PAGE_VAR: 'var(--pinned-layers-in-page, 0)',
}

// Layout types
export const FIXED_ITEM_LAYOUT = 'FixedItemLayout'
export const FIXED_POSITION_ITEM_LAYOUT = 'FixedPositionItemLayout'
export const MASTER_PAGE_ITEM_LAYOUT = 'MasterPageItemLayout'

// Component types
export const COMPONENT_TYPES = {
	REF_COMPONENT: 'RefComponent',
	REF_ARRAY: 'RefArray',
	SECTION: 'Section',
	HEADER_SECTION: 'HeaderSection',
	FOOTER_SECTION: 'FooterSection',
	PAGE: 'Page',
	MASTER_PAGE: 'MasterPage',
	SITE: 'Site',
}
