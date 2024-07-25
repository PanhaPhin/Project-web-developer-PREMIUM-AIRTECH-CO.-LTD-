import { createFedopsLogger } from '@wix/thunderbolt-commons'
import { WixCodeApiFactoryArgs } from '@wix/thunderbolt-symbols'
import { namespace } from '../symbols'
import type {
	WixEcomFrontendWixCodeSdkHandlers,
	WixEcomFrontendWixCodeSdkWixCodeApi,
	WixEcomFrontendWixCodeSdkSiteConfig,
} from '../types'
import { WixEcomFrontendServiceSdk } from './WixEcomFrontendServiceSdk'

export function WixEcomFrontendSdkFactory({
	featureConfig,
	handlers,
	platformUtils,
	platformEnvData,
}: WixCodeApiFactoryArgs<WixEcomFrontendWixCodeSdkSiteConfig, unknown, WixEcomFrontendWixCodeSdkHandlers>): {
	[namespace]: WixEcomFrontendWixCodeSdkWixCodeApi
} {
	const { biUtils, appsPublicApisUtils, essentials } = platformUtils
	const { bi } = platformEnvData

	const biLoggerFactory = biUtils.createBiLoggerFactoryForFedops()
	const fedopsLogger = createFedopsLogger({
		biLoggerFactory,
		appName: 'ecom-wix-code-sdk',
		factory: essentials.createFedopsLogger,
		experiments: essentials.experiments.all(),
		monitoringData: {
			metaSiteId: platformEnvData.location.metaSiteId,
			dc: bi.dc,
			isHeadless: bi.isjp, // name is weird because legacy
			isCached: bi.isCached,
			rolloutData: bi.rolloutData,
		},
	})

	const wixEcomFrontendServiceSdk = new WixEcomFrontendServiceSdk(appsPublicApisUtils, fedopsLogger)

	return {
		[namespace]: {
			someKey: featureConfig.someKey,
			doSomething: handlers.doSomething,
			refreshCart(): Promise<void> {
				return wixEcomFrontendServiceSdk.refreshCart()
			},
			onCartChange(handler: () => void) {
				wixEcomFrontendServiceSdk.onCartChange(handler)
			},
			openSideCart(): void {
				wixEcomFrontendServiceSdk.openSideCart()
			},
			navigateToCartPage(): Promise<any> {
				return wixEcomFrontendServiceSdk.navigateToCartPage()
			},
			navigateToCheckoutPage(
				checkoutId: string,
				options?: {
					skipDeliveryStep?: boolean
					hideContinueShoppingButton?: boolean
					overrideContinueShoppingUrl?: string
					overrideThankYouPageUrl?: string
				}
			): Promise<any> {
				return wixEcomFrontendServiceSdk.navigateToCheckoutPage(checkoutId, options)
			},
		},
	}
}
