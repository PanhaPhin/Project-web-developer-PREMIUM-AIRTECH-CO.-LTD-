import {
  ConsentPolicy,
  DEFAULT_POLICY,
  CookieBannerSettings,
} from '../../types';
import { getConsentPolicy } from '../consent-policy-manager/consent-policy-manager';
import { TranslationsMap } from '../i18n/translate';
import { componentSettingsService } from '../component-settings/component-settings-service';
import { getInitialSettings } from './get-initial-settings';
import { translationKeys } from '../../constants/constants';
import { experiments } from '../experiments/experiments';

const storeListeners: IStoreChangedFunction[] = [];

export interface ConfigData {
  titleKey: string;
  descriptionKey: string;
  toggleEnabled: boolean;
  toggleTooltip?: string;
  policyKeys: string[];
}

export interface IStoreActions {
  addStoreListener(callback: Function): void;
}

export type IStoreChangedFunction = (newStore: IStore) => {};

export interface IStore {
  configuration: ConfigData[];
  consentPolicy: ConsentPolicy;
  translations: TranslationsMap;
  settings: CookieBannerSettings;
  policySubmitted: boolean;
  createdPolicyTimestamp?: Date;
}

let store: IStore = {
  policySubmitted: false,
  configuration: [
    {
      titleKey: translationKeys.advancedCategoryEssentialHeadline,
      descriptionKey: translationKeys.advancedCategoryEssentialParagraph,
      toggleEnabled: false,
      toggleTooltip: translationKeys.essentialTooltip,
      policyKeys: ['essential'],
    },
    {
      titleKey: translationKeys.advancedCategoryMarketingHeadline,
      descriptionKey: translationKeys.advancedCategoryMarketingParagraph,
      toggleEnabled: true,
      policyKeys: ['advertising'],
    },
    {
      titleKey: translationKeys.advancedCategoryFunctionalHeadline,
      descriptionKey: translationKeys.advancedCategoryFunctionalParagraph,
      toggleEnabled: true,
      policyKeys: ['functional'],
    },
    {
      titleKey: translationKeys.advancedCategoryAnalyticsHeadline,
      descriptionKey: translationKeys.advancedCategoryAnalyticsParagraph,
      toggleEnabled: true,
      policyKeys: ['analytics'],
    },
  ],
  translations: {},
  settings: getInitialSettings(),
  consentPolicy: DEFAULT_POLICY,
};

export const initStore = async (
  preview: boolean = false,
): Promise<IStore & IStoreActions> => {
  if (experiments.enabled('specs.cookieConsent.CcpML_MigrationUoU')) {
    const policyDetails = await getConsentPolicy();
    const { settings, translations } =
      await componentSettingsService.getSettingsAndTranslations(preview);
    store = {
      ...store,
      policySubmitted: !policyDetails.defaultPolicy,
      consentPolicy: { ...DEFAULT_POLICY, ...policyDetails.policy },
      settings,
      translations,
      createdPolicyTimestamp: policyDetails.createdDate,
    };

    return getStore();
  } else {
    const policyDetails = await getConsentPolicy();
    const settings = await componentSettingsService.getSettings();
    const translations = await componentSettingsService.getTranslations();
    store = {
      ...store,
      policySubmitted: !policyDetails.defaultPolicy,
      consentPolicy: { ...DEFAULT_POLICY, ...policyDetails.policy },
      settings,
      translations,
      createdPolicyTimestamp: policyDetails.createdDate,
    };

    return getStore();
  }
};

export const updateStore = (storeUpdate: Partial<IStore>) => {
  store = {
    ...store,
    ...storeUpdate,
  };
  storeListeners.forEach((func) => func(store));
};

const addStoreListener = (callback: IStoreChangedFunction) => {
  storeListeners.push(callback);
};

export const getStore = (): IStore & IStoreActions => {
  return {
    ...store,
    addStoreListener,
  };
};
