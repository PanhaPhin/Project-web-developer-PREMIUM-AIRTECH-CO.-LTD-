import { WixCodeApiFactoryArgs } from '@wix/thunderbolt-symbols'
import { namespace, PaidPlansWixCodeSdkWixCodeApi } from '..'
import { PricingPlansApi } from './pricingPlansApi'
import { validateGuid } from './validation'
import { HttpClientBasedHttpApi } from './httpClientBasedHttpApi'

export function PaidPlansSdkFactory({
	wixCodeNamespacesRegistry,
	appEssentials,
}: WixCodeApiFactoryArgs): {
	[namespace]: PaidPlansWixCodeSdkWixCodeApi
} {
	const api = new PricingPlansApi(new HttpClientBasedHttpApi(appEssentials.httpClient))

	async function ensureMemberIsLoggedIn() {
		const siteMembers = wixCodeNamespacesRegistry.get('user')
		if (!siteMembers.currentUser.loggedIn) {
			await siteMembers.promptLogin()
		}
	}

	return {
		[namespace]: {
			async getCurrentMemberOrders(limit?: number, offset?: number) {
				await ensureMemberIsLoggedIn()
				return api.getCurrentMemberOrders(limit, offset)
			},

			async orderPlan(planId: string) {
				validateGuid(planId)
				await ensureMemberIsLoggedIn()

				return api.createOrder(planId)
			},

			async cancelOrder(orderId: string) {
				validateGuid(orderId)
				await ensureMemberIsLoggedIn()

				return api.cancelOrder(orderId)
			},

			async purchasePlan(planId: string) {
				validateGuid(planId)
				await ensureMemberIsLoggedIn()

				const wixPay = wixCodeNamespacesRegistry.get('pay')

				const { orderId, wixPayOrderId } = await api.createOrder(planId)

				if (!wixPayOrderId) {
					return { orderId }
				}

				const { status: wixPayStatus } = await wixPay.startPayment(wixPayOrderId, { showThankYouPage: true })

				return {
					orderId,
					wixPayOrderId,
					wixPayStatus,
				}
			},
		},
	}
}
