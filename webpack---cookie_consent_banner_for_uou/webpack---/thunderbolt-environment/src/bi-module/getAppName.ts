import type { ViewerModel } from '@wix/thunderbolt-symbols'

export function getAppName(viewerModel: ViewerModel): string {
	return viewerModel.requestUrl!.toLowerCase().includes('rc=mobile_app_builder')
		? 'thunderbolt-renderer-mobile'
		: viewerModel.site.appNameForBiEvents
}
