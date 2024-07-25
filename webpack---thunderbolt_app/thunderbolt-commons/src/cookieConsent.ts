import type { FedopsLogger } from '@wix/fe-essentials-viewer-platform/fedops'

export enum ConsentPolicyInteraction {
	GET_CURRENT_CONSENT_POLICY = 'get-current-consent-policy',
	SET_CONSENT_POLICY = 'set-consent-policy',
	RESET_CONSENT_POLICY = 'reset-consent-policy',
	ON_CONSENT_POLICY_CHANGED = 'on-consent-policy-changed',
}

export type NonPromise<T> = T extends Promise<any> ? never : T

export interface ConsentPolicyLogger {
	executeAndLog<T>(action: () => NonPromise<T>, interaction: ConsentPolicyInteraction): T

	executeAndLogAsync<T>(action: () => Promise<T>, interaction: ConsentPolicyInteraction): Promise<T>
}

export function createConsentPolicyLogger(fedopsLogger: FedopsLogger): ConsentPolicyLogger {
	return {
		executeAndLog<T>(action: () => NonPromise<T>, interaction: ConsentPolicyInteraction) {
			fedopsLogger.interactionStarted(interaction)
			const res = action()
			fedopsLogger.interactionEnded(interaction)
			return res
		},
		async executeAndLogAsync<T>(action: () => Promise<T>, interaction: ConsentPolicyInteraction): Promise<T> {
			fedopsLogger.interactionStarted(interaction)
			const res = await action()
			fedopsLogger.interactionEnded(interaction)
			return res
		},
	}
}
