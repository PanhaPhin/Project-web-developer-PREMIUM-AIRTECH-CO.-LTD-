import { withDependencies } from '@wix/thunderbolt-ioc'
import { Experiments, ExperimentsSymbol, PlatformEnvDataProvider } from '@wix/thunderbolt-symbols'
import type { ILightboxUtils } from './types'
import { LightboxUtilsSymbol } from './symbols'

export const LightboxesEnvDataProvider = withDependencies(
	[LightboxUtilsSymbol, ExperimentsSymbol],
	(lightboxUtils: ILightboxUtils, experiments: Experiments): PlatformEnvDataProvider => {
		const isAppReflowWithLightboxesEnabled = !!experiments['specs.thunderbolt.app_reflow_with_lightboxes']

		return {
			platformEnvData() {
				return {
					popups: {
						popupPages: lightboxUtils.getLightboxPages(),
						lightboxRouteData: isAppReflowWithLightboxesEnabled
							? lightboxUtils.getLightboxRouteData()
							: undefined,
					},
				}
			},
		}
	}
)
