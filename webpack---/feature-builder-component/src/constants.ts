//  TODO temporary solution until Piler will load / expose the used components
export const usedEEComponents = [
	'WRichText',
	'AppWidget',
	'VectorImage',
	'StylableButton',
	'ImageX',
	'VerticalLine',
	'MultiStateBox',
	'SiteButton',
]

export const usedEESkins = [
	'Repeater_Responsive',
	'Container_ResponsiveBox',
	'SiteButton_WrappingButton',
	'VerticalLine_VerticalSolidLine',
	'FiveGridLine_SolidLineStudio',
]

export const siteAssetsRequestHeaders = { 'x-wix-extended-timeout': '1', 'x-first-byte-timeout': '17000ms' }
export const siteAssetsQueryParams = {
	module: 'piler-siteassets',
	isUrlMigrated: 'true',
	quickActionsMenuEnabled: 'false',
	dfCk: '6',
	isHttps: 'true',
}
