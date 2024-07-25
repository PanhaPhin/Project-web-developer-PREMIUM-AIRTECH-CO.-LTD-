import { TranslationsMap } from '../i18n/translate';
import { AppDefId } from '../../constants/constants';
import { CookieBannerSettings } from '../../types';
import { getInitialSettings } from '../configuration/get-initial-settings';

export interface ComponentSettings {
  settings: CookieBannerSettings;
  translations: TranslationsMap;
}
class ComponentSettingsService {
  settings?: ComponentSettings;

  async getSettingsAndTranslations(preview: boolean = false) {
    const languageCode = window.wixEmbedsAPI?.getLanguage() || 'en';
    const maybePreviewPath = (preview && 'preview-') || '';

    this.settings = await fetch(
      `/_serverless/cookie-consent-settings-serverless/v1/cookie-banner-${maybePreviewPath}settings?languageCode=${languageCode}`,
      {
        method: 'GET',
        headers: {
          authorization: getAuthorization(),
          'x-wix-client-artifact-id': 'cookie-consent-banner-for-uou',
        },
      },
    )
      .then((res) => res.json())
      .then(mapAppSettingsResponse)
      .catch((reason) => {
        console.log(
          `error receiving component settings from serverless ${reason}`,
        );
        return this.loadSettings().then(() => this.settings);
      });

    return {
      settings: this.settings?.settings!,
      translations: {
        ...this.settings?.settings?.texts,
        ...this.settings?.translations,
      },
    };
  }

  async getSettings(): Promise<CookieBannerSettings> {
    await this.loadSettings();
    return this.settings?.settings || getInitialSettings();
  }

  async getTranslations(): Promise<TranslationsMap> {
    await this.loadSettings();
    return {
      ...this.settings?.settings?.texts,
      ...this.settings?.translations,
    };
  }

  async loadSettings() {
    const locale = window.wixEmbedsAPI?.getLanguage() || 'en';
    this.settings = await fetch(
      `/_api/app-settings-service/v1/settings/components/${AppDefId}?languageKey.languageCode=${locale}&host=BUSINESS_MANAGER&state=NR`,
      {
        method: 'GET',
        cache: 'no-cache',
        headers: {
          Authorization: getAuthorization(),
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-wix-client-artifact-id': 'cookie-consent-banner-for-uou',
        },
      },
    )
      .then((res) => res.json())
      .then(mapAppSettingsResponse)
      .catch((reason) => {
        console.log(`error receiving component settings ${reason}`);
        return {
          settings: getInitialSettings(),
          translations: {},
        };
      });
  }
}

export const componentSettingsService = new ComponentSettingsService();

const getAuthorization = (): string =>
  window.wixEmbedsAPI?.getAppToken(AppDefId) || '';

const mapAppSettingsResponse: (response: {
  settings: Record<string, any>;
  translations: Record<string, string>;
}) => ComponentSettings = ({ settings, translations }) => {
  return {
    settings: {
      ...settings,
      texts: settings?.texts || {},
      appEnabled: settings?.appEnabled || false,
      expiryDate: new Date(settings?.expiryDate || 0),
      theme: settings?.theme?.replace(/-/g, '_'),
      privacyPolicyType: settings?.privacyPolicyType?.replace(/-/g, '_'),
      privacyPolicyPage: settings?.privacyPolicyPage || '',
      privacyPolicyUrl: settings?.texts?.privacyPolicyUrl || '',
      audience: settings?.audience?.replace(/-/g, '_'),
      declineAllConfig: {
        enabled: settings?.declineAllConfig?.enabled || false,
        geo: settings?.declineAllConfig?.geo || [],
      },
      revisitSettingsConfig: {
        enabled: settings?.revisitSettingsConfig?.enabled || false,
        buttonPosition:
          settings?.revisitSettingsConfig?.buttonPosition?.replace(/-/g, '_'),
      },
    },
    translations: translations || {},
  };
};
