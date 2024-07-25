import { loadTranslations } from './load';
import {
  createTranslationFn,
  TranslateFunction,
  TranslationsMap,
} from './translate';
import { getStore } from '../configuration/configuration-store';

const createTranslationsContext = (translations: TranslationsMap) => ({
  // cookie_policy_link: createCookiePolicyLinkTemplate(
  //   translations.CookieConsentBanner_CookiePolicyLink
  // ), // eslint-disable-line
});

let translationsMap: TranslationsMap;

export const initTranslations = async (
  staticsUrl: string,
  language: string,
  callback: (translate: TranslateFunction) => void,
): Promise<void> => {
  loadTranslations(
    staticsUrl,
    language,
    async (translations: TranslationsMap) => {
      const context = createTranslationsContext(translations);
      const savedTranslations = getStore().translations;
      translationsMap = {
        ...translations,
        ...savedTranslations,
      };
      const translate: TranslateFunction = createTranslationFn(
        translations,
        context,
      );

      callback(translate);
    },
  );
};

export const updateTranslation = (translations: TranslationsMap) => {
  translationsMap = {
    ...translationsMap,
    ...translations,
  };
};

export const translate = (
  key: keyof TranslationsMap,
  defaultValue = key,
): string => translationsMap[key] || defaultValue;
