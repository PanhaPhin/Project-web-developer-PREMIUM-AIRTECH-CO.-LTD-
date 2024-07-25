import { IPlatformUtils, PlatformEnvData } from '@wix/thunderbolt-symbols'
import { createFedopsLogger as createCommonFedopsLogger } from '@wix/thunderbolt-commons'

const ALE = 'load'
const ALE_KICKOFF = 'load-phase-kickoff'

export const createFedopsLogger = (
	essentials: IPlatformUtils['essentials'],
	biUtils: IPlatformUtils['biUtils'],
	platformEnvData: PlatformEnvData
) => {
	const { bi, location } = platformEnvData

	const logger = createCommonFedopsLogger({
		biLoggerFactory: biUtils.createBiLoggerFactoryForFedops(),
		customParams: {
			viewerName: 'thunderbolt',
		},
		factory: essentials.createFedopsLogger,
		experiments: essentials.experiments.all(),
		monitoringData: {
			metaSiteId: location.metaSiteId,
			dc: bi.dc,
			isHeadless: bi.isjp, // name is weird because legacy
			isCached: bi.isCached,
			rolloutData: bi.rolloutData,
		},
	})

	return {
		logALE() {
			logger.interactionStarted(ALE)
			logger.interactionStarted(ALE_KICKOFF)
		},
	}
}
