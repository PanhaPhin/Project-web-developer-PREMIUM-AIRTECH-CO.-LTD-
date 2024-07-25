import { AppPublicApiUtils } from '@wix/thunderbolt-symbols'
import { ECOM_APP_DEF_ID, WixEcomSdkInteraction } from './constants'
import type { FedopsLogger } from '@wix/fe-essentials-viewer-platform/fedops'

export class WixEcomFrontendServiceSdk {
	constructor(protected appsPublicApisUtils: AppPublicApiUtils, protected fedopsLogger: FedopsLogger) {}
	refreshCart(): Promise<void> {
		this.fedopsLogger.interactionStarted(WixEcomSdkInteraction.REFRESH_CART)
		return this.appsPublicApisUtils.getPublicAPI(ECOM_APP_DEF_ID).then(async (api: any) => {
			api.cart.reloadCart()
			this.fedopsLogger.interactionEnded(WixEcomSdkInteraction.REFRESH_CART)
		})
	}

	onCartChange(handler: () => void) {
		this.fedopsLogger.interactionStarted(WixEcomSdkInteraction.ON_CART_CHANGE)
		this.appsPublicApisUtils.getPublicAPI(ECOM_APP_DEF_ID).then((api: any) => {
			this.fedopsLogger.interactionEnded(WixEcomSdkInteraction.ON_CART_CHANGE)
			api.cart.onChange(() => {
				handler()
			})
		})
	}

	openSideCart(): void {
		this.fedopsLogger.interactionStarted(WixEcomSdkInteraction.OPEN_SIDE_CART)
		this.appsPublicApisUtils.getPublicAPI(ECOM_APP_DEF_ID).then((api: any) => {
			api.cart.openSideCart()
			this.fedopsLogger.interactionEnded(WixEcomSdkInteraction.OPEN_SIDE_CART)
		})
	}
	navigateToCartPage(): Promise<any> {
		this.fedopsLogger.interactionStarted(WixEcomSdkInteraction.NAVIGATE_TO_CART_PAGE)
		return this.appsPublicApisUtils.getPublicAPI(ECOM_APP_DEF_ID).then(async (api: any) => {
			await api.navigate.toCart()
			this.fedopsLogger.interactionEnded(WixEcomSdkInteraction.NAVIGATE_TO_CART_PAGE)
		})
	}
	navigateToCheckoutPage(
		checkoutId: string,
		options?: {
			skipDeliveryStep?: boolean
			hideContinueShoppingButton?: boolean
			overrideContinueShoppingUrl?: string
			overrideThankYouPageUrl?: string
		}
	): Promise<any> {
		const params = {
			checkoutId,
			isPreselectedFlow: options?.skipDeliveryStep,
			disableContinueShopping: options?.hideContinueShoppingButton,
			continueShoppingUrl: options?.overrideContinueShoppingUrl,
			successUrl: options?.overrideThankYouPageUrl,
		}
		this.fedopsLogger.interactionStarted(WixEcomSdkInteraction.NAVIGATE_TO_CHECKOUT_PAGE)
		return this.appsPublicApisUtils.getPublicAPI(ECOM_APP_DEF_ID).then(async (api: any) => {
			await api.navigate.toCheckout(params)
			this.fedopsLogger.interactionEnded(WixEcomSdkInteraction.NAVIGATE_TO_CHECKOUT_PAGE)
		})
	}
}
