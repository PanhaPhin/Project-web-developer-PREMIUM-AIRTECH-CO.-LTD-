import { IPlatformUtils, PlatformEnvData } from '@wix/thunderbolt-symbols'
import { createFedopsLogger as createCommonFedopsLogger } from '@wix/thunderbolt-commons'
import type { FedopsLogger } from '@wix/fe-essentials-viewer-platform/fedops'

export const createFedopsLogger = (
	essentials: IPlatformUtils['essentials'],
	biUtils: IPlatformUtils['biUtils'],
	platformEnvData: PlatformEnvData
): FedopsLogger => {
	const { bi, location } = platformEnvData

	const experiments = essentials.experiments
	return createCommonFedopsLogger({
		appName: 'crm-wix-code-sdk',
		biLoggerFactory: biUtils.createBiLoggerFactoryForFedops(),
		customParams: {
			viewerName: 'thunderbolt',
		},
		factory: essentials.createFedopsLogger,
		experiments: experiments.all(),
		monitoringData: {
			metaSiteId: location.metaSiteId,
			dc: bi.dc,
			isHeadless: bi.isjp, // name is weird because legacy
			isCached: bi.isCached,
			rolloutData: bi.rolloutData,
		},
	})
}
