import { optional, withDependencies } from '@wix/thunderbolt-ioc'
import { MainGridAppIdFetchSymbol, PlatformEnvDataProvider } from '@wix/thunderbolt-symbols'

export const mainGridAppIdProvider = withDependencies(
	[optional(MainGridAppIdFetchSymbol)],
	(mainGridAppId?: string): PlatformEnvDataProvider => {
		return {
			platformEnvData() {
				return {
					mainGridAppId,
				}
			},
		}
	}
)
