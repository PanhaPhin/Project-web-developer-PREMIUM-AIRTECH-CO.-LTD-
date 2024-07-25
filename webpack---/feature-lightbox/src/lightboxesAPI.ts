import {
	FeatureExportsSymbol,
	IStructureAPI,
	MasterPageFeatureConfigSymbol,
	StructureAPI,
} from '@wix/thunderbolt-symbols'
import type { ILightboxesAPI, LightboxesMasterPageConfig } from './types'
import { named, withDependencies } from '@wix/thunderbolt-ioc'
import { name } from './symbols'
import { IFeatureExportsStore } from 'thunderbolt-feature-exports'

const lightboxesAPI = (
	structureAPI: IStructureAPI,
	masterPageConfig: LightboxesMasterPageConfig,
	lightboxExports: IFeatureExportsStore<typeof name>
): ILightboxesAPI => {
	return {
		addLightboxToDynamicStructure: (lightboxPageId) => {
			const wrapperId = structureAPI.getPageWrapperComponentId(lightboxPageId, lightboxPageId)
			lightboxExports.export({ lightboxPageId })
			return structureAPI.addComponentToDynamicStructure(
				'POPUPS_ROOT',
				{
					componentType: 'PopupRoot',
					components: [wrapperId],
					uiType: masterPageConfig.isResponsive ? 'Responsive' : 'Classic',
				},
				{
					[wrapperId]: {
						componentType: 'PageMountUnmount',
						components: [lightboxPageId],
					},
				}
			)
		},
		removeLightboxFromDynamicStructure: (lightboxPageId) => {
			const wrapperId = structureAPI.getPageWrapperComponentId(lightboxPageId, lightboxPageId)
			structureAPI.removeComponentFromDynamicStructure(wrapperId)
			structureAPI.removeComponentFromDynamicStructure('POPUPS_ROOT')
			lightboxExports.export({ lightboxPageId: undefined })
		},
	}
}

export const LightboxesAPI = withDependencies(
	[StructureAPI, named(MasterPageFeatureConfigSymbol, name), named(FeatureExportsSymbol, name)],
	lightboxesAPI
)
