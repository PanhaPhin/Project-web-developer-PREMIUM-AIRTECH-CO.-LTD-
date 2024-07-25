import { isSafeUrl } from '@wix/thunderbolt-commons'
import { IComponentsRegistry } from '@wix/editor-elements-registry/2.0/types'
import { ComponentsSkinParams, SkinDefaultsData } from '@wix/thunderbolt-becky-root'

export const COMPONENTS_REGISTRY_SENTRY_SPEC = 'specs.thunderbolt.componentsRegistrySentry'

export interface IComponentsCommonRegistry {
	getStylableMetadataURLs: () => Array<string>
}

export const splitComponentName = (componentName: string) => componentName.split('_')
export const getComponentType = (componentName: string) => splitComponentName(componentName)[0]

const shouldPreserveFullUrl = (url: string) => isSafeUrl(new URL(url))

export const createCommonRegistryMethods = <TComponentsRegistry extends IComponentsRegistry<any>>(
	registryAPI: TComponentsRegistry
): IComponentsCommonRegistry => {
	return {
		getStylableMetadataURLs() {
			return registryAPI
				.getLibrariesAssets()
				.filter((asset) => asset.type === 'stylable-metadata')
				.map(({ url }) => {
					if (shouldPreserveFullUrl(url)) {
						return url
					}

					const [, stylableHash] = url.match(/([a-zA-Z0-9.-]+)\.metadata\.json/) || []
					return stylableHash ? stylableHash : ''
				})
				.filter((url) => !!url)
		},
	}
}

export function getSkinParamsBySimpleSkinName(componentsSkinParamsByComponent: ComponentsSkinParams) {
	return Object.entries(componentsSkinParamsByComponent).reduce((acc, [, skinsInfo]) => {
		const skinsInfoResolved = Object.entries(skinsInfo as any).reduce((accSkinsInfo, [skinName, skinParams]) => {
			const simpleSkinName = skinName.split('.').pop() ?? skinName
			return {
				...accSkinsInfo,
				[simpleSkinName]: skinParams,
			}
		}, {} as any)
		return {
			...acc,
			...skinsInfoResolved,
		}
	}, {})
}

type ModelsTypeWithSkinParams = Record<string, { skinParams?: SkinDefaultsData }>

export function getComponentSkinParamsByComponent<ModelsType extends ModelsTypeWithSkinParams>(models: ModelsType) {
	return Object.keys(models)
		.filter((componentType) => models[componentType].skinParams)
		.reduce<ComponentsSkinParams>((acc, componentType) => {
			return {
				...acc,
				[componentType]: models[componentType].skinParams,
			}
		}, {})
}
