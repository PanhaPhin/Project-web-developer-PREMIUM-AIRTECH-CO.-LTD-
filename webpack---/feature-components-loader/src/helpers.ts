import { ViewerModel } from '@wix/thunderbolt-symbols'

export const isLazyLoadCompatible = (viewerModel: ViewerModel) =>
	viewerModel.react18Compatible && process.env.PACKAGE_NAME !== 'thunderbolt-ds'
