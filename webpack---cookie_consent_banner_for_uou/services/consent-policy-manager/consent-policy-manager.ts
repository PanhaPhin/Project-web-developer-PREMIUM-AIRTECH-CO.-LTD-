import { ConsentPolicy, PolicyDetails } from '../../types';
import { updateStore } from '../configuration/configuration-store';

export const getConsentPolicy = async (): Promise<PolicyDetails> =>
  window.consentPolicyManager.getCurrentConsentPolicy();

export const resetPolicy = () => window.consentPolicyManager.resetPolicy();

export interface SavePolicyOptions {
  policy: ConsentPolicy;
  successCallback(): void;
  errorCallback(): void;
}

export const savePolicy = async ({
  policy,
  successCallback,
  errorCallback,
}: SavePolicyOptions) => {
  function innerSuccessCallback() {
    updateStore({
      consentPolicy: policy,
      policySubmitted: true,
    });
    successCallback();
  }
  window.consentPolicyManager.setConsentPolicy(
    policy,
    innerSuccessCallback,
    errorCallback,
  );
};
