import _ from 'lodash'
import { IBlocksAppsUtils } from '@wix/thunderbolt-symbols'
import { BootstrapData } from '../../types'
import { BLOCKS_APPS_UTILS, BOOTSTRAP_DATA } from './moduleNames'

export const BlocksAppsUtils = (bootstrapData: BootstrapData): IBlocksAppsUtils => {
	const {
		wixCodeBootstrapData: { wixCodePageIds, codePackagesData, wixCodeModel },
		platformEnvData,
		blocksBootstrapData,
	} = bootstrapData
	return {
		createBlocksPreviewAppData() {
			return {
				blocksPreviewData: {
					gridAppId: _.get(wixCodeModel, 'appData.codeAppId'),
					metaSiteId: platformEnvData.location.metaSiteId,
					widgetsCodeMap: _.mapValues(wixCodePageIds, (url) => ({ url })),
					widgetDescriptorsMap: platformEnvData.blocks?.blocksPreviewData?.widgetDescriptorsMap ?? {},
				},
			}
		},
		createBlocksConsumerAppData() {
			return {
				blocksConsumerData: {
					experiments: blocksBootstrapData.experiments,
					codeExperimentsQueryString: blocksBootstrapData.experimentsQueryParams,
					codePackagesData,
					invokePropsChangedOnUpdateConfig: true,
				},
			}
		},
		isBlocksApp(appDefinitionId) {
			return Boolean(blocksBootstrapData.blocksAppsData[appDefinitionId])
		},
		canAppInstanceBeUsedForAuthorization(appInstance?: string): boolean {
			if (!appInstance) {
				return false
			}

			return this.isBlocksSignedInstanceExperimentOpen() && appInstance.startsWith('OauthNG')
		},
		isBlocksSignedInstanceExperimentOpen(): boolean {
			return Boolean(platformEnvData.site.experiments['specs.thunderbolt.UseBlocksSignedInstance'])
		},
	}
}

export default {
	factory: BlocksAppsUtils,
	deps: [BOOTSTRAP_DATA],
	name: BLOCKS_APPS_UTILS,
}
