import _ from 'lodash'

const componentAndDataConsts = {
	components: {
		PROPERTY_TYPES: {
			/** @type {'components'} */
			COMPONENTS: 'components',
			/** @type {'componentType'} */
			COMPONENT_TYPE: 'componentType',
			/** @type {'connectionQuery'} */
			CONNECTION_QUERY: 'connectionQuery',
			/** @type {'classnamesQuery'} */
			CLASSNAMES_QUERY: 'classnamesQuery',
			/** @type {'dataQuery'} */
			DATA_QUERY: 'dataQuery',
			/** @type {'propertyQuery'} */
			PROPERTY_QUERY: 'propertyQuery',
			/** @type {'designQuery'} */
			DESIGN_QUERY: 'designQuery',
			/** @type {'behaviorQuery'} */
			BEHAVIOR_QUERY: 'behaviorQuery',
			/** @type {'layoutQuery'} */
			LAYOUT_QUERY: 'layoutQuery',
			/** @type {'cursorQuery'} */
			CURSOR_QUERY: 'cursorQuery',
			/** @type {'breakpointsQuery'} */
			BREAKPOINTS_QUERY: 'breakpointsQuery',
			/** @type {'transitionQuery'} */
			TRANSITION_QUERY: 'transitionQuery',
			/** @type {'reactionsQuery'} */
			REACTION_QUERY: 'reactionsQuery',
			/** @type {'triggersQuery'} */
			TRIGGERS_QUERY: 'triggersQuery',
			/** @type {'transitionQuery'} */
			TRANSFORMATION_QUERY: 'transformationQuery',
			/** @type {'presetsQuery'} */
			PRESETS_QUERY: 'presetsQuery',
			/** @type {'slotsQuery'} */
			SLOTS_QUERY: 'slotsQuery',
			/** @type {'id'} */
			ID: 'id',
			/** @type {'layout'} */
			LAYOUT: 'layout',
			/** @type {'metaData'} */
			META_DATA: 'metaData',
			/** @type {'mobileHintsQuery'} */
			MOBILE_HINTS_QUERY: 'mobileHintsQuery',
			/** @type {'modes'} */
			MODES: 'modes',
			/** @type {'skin'} */
			SKIN: 'skin',
			/** @type {'styleId'} */
			STYLE_ID: 'styleId',
			/** @type {'globalStyleQuery'} */
			GLOBAL_STYLE_QUERY: 'globalStyleQuery',
			/** @type {'globalStyleListQuery'} */
			GLOBAL_STYLE_LIST_QUERY: 'globalStyleListQuery',
			/** @type {'parent'} */
			PARENT: 'parent',
			/** @type {'type'} */
			TYPE: 'type',
			/** @type {'uiType'} */
			UI_TYPE: 'uiType',
			/** @type {'anchorQuery'} */
			ANCHOR_QUERY: 'anchorQuery',
			/** @type {'variablesQuery'} */
			VARIABLES_QUERY: 'variablesQuery',
			/** @type {'patternsQuery'} */
			PATTERNS_QUERY: 'patternsQuery',
			/** @type {'effectsQuery'} */
			EFFECTS_QUERY: 'effectsQuery',
			/** @type {'variantsQuery'} */
			VARIANTS_QUERY: 'variantsQuery',
			/** @type {'statesQuery'} */
			STATES_QUERY: 'statesQuery',
		},
	},
	data: {
		DATA_MAPS: {
			/** @type {'behaviors_data'} */
			BEHAVIORS: 'behaviors_data',
			/** @type {'connections_data'} */
			CONNECTIONS: 'connections_data',
			/** @type {'document_data'} */
			DATA: 'document_data',
			/** @type {'classnames'} */
			CLASSNAMES: 'classnames',
			/** @type {'design_data'} */
			DESIGN: 'design_data',
			/** @type {'cursor'} */
			CURSOR: 'cursor',
			/** @type {'mobile_hints'} */
			MOBILE_HINTS: 'mobile_hints',
			/** @type {'component_properties'} */
			PROPERTIES: 'component_properties',
			/** @type {'breakpoints_data'} */
			BREAKPOINTS: 'breakpoints_data',
			/** @type {'layout_data'} */
			LAYOUT: 'layout_data',
			/** @type {'theme_data'} */
			STYLE: 'theme_data',
			/** @type {'transformations_data'} */
			TRANSFORMATIONS: 'transformations_data',
			/** @type {'patters'} */
			PATTERNS: 'patterns',
			/** @type {'transitions_data'} */
			TRANSITIONS: 'transitions_data',
			/** @type {'presets'} */
			PRESETS: 'presets',
			/** @type {'slots'} */
			SLOTS: 'slots',
			/** @type {'anchor_data'} */
			ANCHOR: 'anchors_data',
			/** @type {'variant_data'} */
			VARIANTS: 'variants_data',
			/** @type {'reactions'} */
			REACTIONS: 'reactions',
			/** @type {'triggers'} */
			TRIGGERS: 'triggers',
			/** @type {'variables'} */
			VARIABLES: 'variables',
			/** @type {'effects'} */
			EFFECTS: 'effects',
			/** @type {'states'} */
			STATES: 'states',
		},
		DATA_TYPES: {
			SVG: 'SVGItem',
		},
	},
} as const

const QUERY_TO_MAP_NAME = {
	[componentAndDataConsts.components.PROPERTY_TYPES.BEHAVIOR_QUERY]: componentAndDataConsts.data.DATA_MAPS.BEHAVIORS,
	[componentAndDataConsts.components.PROPERTY_TYPES.CONNECTION_QUERY]:
		componentAndDataConsts.data.DATA_MAPS.CONNECTIONS,
	[componentAndDataConsts.components.PROPERTY_TYPES.DATA_QUERY]: componentAndDataConsts.data.DATA_MAPS.DATA,
	[componentAndDataConsts.components.PROPERTY_TYPES.CLASSNAMES_QUERY]:
		componentAndDataConsts.data.DATA_MAPS.CLASSNAMES,
	[componentAndDataConsts.components.PROPERTY_TYPES.DESIGN_QUERY]: componentAndDataConsts.data.DATA_MAPS.DESIGN,
	[componentAndDataConsts.components.PROPERTY_TYPES.PROPERTY_QUERY]: componentAndDataConsts.data.DATA_MAPS.PROPERTIES,
	[componentAndDataConsts.components.PROPERTY_TYPES.STYLE_ID]: componentAndDataConsts.data.DATA_MAPS.STYLE,
	[componentAndDataConsts.components.PROPERTY_TYPES.GLOBAL_STYLE_QUERY]: componentAndDataConsts.data.DATA_MAPS.STYLE,
	[componentAndDataConsts.components.PROPERTY_TYPES.GLOBAL_STYLE_LIST_QUERY]:
		componentAndDataConsts.data.DATA_MAPS.STYLE,
	[componentAndDataConsts.components.PROPERTY_TYPES.LAYOUT_QUERY]: componentAndDataConsts.data.DATA_MAPS.LAYOUT,
	[componentAndDataConsts.components.PROPERTY_TYPES.CURSOR_QUERY]: componentAndDataConsts.data.DATA_MAPS.CURSOR,
	[componentAndDataConsts.components.PROPERTY_TYPES.BREAKPOINTS_QUERY]:
		componentAndDataConsts.data.DATA_MAPS.BREAKPOINTS,
	[componentAndDataConsts.components.PROPERTY_TYPES.REACTION_QUERY]: componentAndDataConsts.data.DATA_MAPS.REACTIONS,
	[componentAndDataConsts.components.PROPERTY_TYPES.TRIGGERS_QUERY]: componentAndDataConsts.data.DATA_MAPS.TRIGGERS,
	[componentAndDataConsts.components.PROPERTY_TYPES.TRANSFORMATION_QUERY]:
		componentAndDataConsts.data.DATA_MAPS.TRANSFORMATIONS,
	[componentAndDataConsts.components.PROPERTY_TYPES.TRANSITION_QUERY]:
		componentAndDataConsts.data.DATA_MAPS.TRANSITIONS,
	[componentAndDataConsts.components.PROPERTY_TYPES.PRESETS_QUERY]: componentAndDataConsts.data.DATA_MAPS.PRESETS,
	[componentAndDataConsts.components.PROPERTY_TYPES.SLOTS_QUERY]: componentAndDataConsts.data.DATA_MAPS.SLOTS,
	[componentAndDataConsts.components.PROPERTY_TYPES.MOBILE_HINTS_QUERY]:
		componentAndDataConsts.data.DATA_MAPS.MOBILE_HINTS,
	[componentAndDataConsts.components.PROPERTY_TYPES.ANCHOR_QUERY]: componentAndDataConsts.data.DATA_MAPS.ANCHOR,
	[componentAndDataConsts.components.PROPERTY_TYPES.VARIABLES_QUERY]: componentAndDataConsts.data.DATA_MAPS.VARIABLES,
	[componentAndDataConsts.components.PROPERTY_TYPES.PATTERNS_QUERY]: componentAndDataConsts.data.DATA_MAPS.PATTERNS,
	[componentAndDataConsts.components.PROPERTY_TYPES.EFFECTS_QUERY]: componentAndDataConsts.data.DATA_MAPS.EFFECTS,
	[componentAndDataConsts.components.PROPERTY_TYPES.VARIANTS_QUERY]: componentAndDataConsts.data.DATA_MAPS.VARIANTS,
	[componentAndDataConsts.components.PROPERTY_TYPES.STATES_QUERY]: componentAndDataConsts.data.DATA_MAPS.STATES,
}

const MAP_NAME_TO_QUERY = _.invert(QUERY_TO_MAP_NAME)

const pointers = {
	QUERY_TO_MAP_NAME,
	MAP_NAME_TO_QUERY,
	...componentAndDataConsts,
} as const

export const childrenKeys = {
	MOBILE_COMPONENTS: 'mobileComponents',
	MASTER_PAGE_CHILDREN: 'children',
	COMPONENTS: 'components',
} as const

const VARIANTS_CSS_STRATEGIES = {
	ALL_CHILDREN: 'ALL_CHILDREN',
	DIRECT_CHILDREN: 'DIRECT_CHILDREN',
}

export type Z_LAYER_KEYS = 'BELOW_PINNED' | 'ABOVE_PINNED' | 'ABOVE_ALL_COMPS'

const Z_LAYER_VALUE_MAP: Record<Z_LAYER_KEYS, number> = {
	BELOW_PINNED: 1,
	ABOVE_PINNED: 51,
	ABOVE_ALL_COMPS: 100000,
}

export const MASTER_PAGE_ID = 'masterPage'

export const TPA_GALLERIES = [
	'Accordion',
	'Collage',
	'Freestyle',
	'Honeycomb',
	'Impress',
	'Masonry',
	'StripShowcase',
	'StripSlideshow',
	'TPA3DCarousel',
	'TPA3DGallery',
	'Thumbnails',
]

export const AUTO_HEIGHT_COMP_TYPES: { [compType: string]: boolean } = {
	SelectionTagsList: true,
	RefComponent: true,
	Checkbox: true,
	ComboBoxInput: true,
	CheckboxGroup: true,
	TextMask: true,
	TextAreaInput: true,
	CollapsibleText: true,
	RadioGroup: true,
	Tabs: true,
}

export { pointers, VARIANTS_CSS_STRATEGIES, Z_LAYER_VALUE_MAP }

export const COMPONENTS_WITH_PORTAL_PREFIXES: { [compType: string]: string } = {
	DatePicker: 'portal-',
	ComboBoxInput: 'listModal_',
	RichTextBox: 'linkModal_',
	VideoBox: 'VideoBox_dummy_',
}
