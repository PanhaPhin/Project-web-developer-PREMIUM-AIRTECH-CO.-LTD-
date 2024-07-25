import {
  Audience,
  CookieBannerSettings,
  PrivacyPolicyType,
  Theme,
} from '../../types';

export const getInitialSettings = (): CookieBannerSettings => ({
  texts: {},
  appEnabled: true,
  theme: Theme.light,
  expiryDate: new Date(0),
  privacyPolicyUrl: '',
  privacyPolicyType: PrivacyPolicyType.page_on_site,
  privacyPolicyPage: '',
  audience: Audience.all_visitors,
  revisitSettingsConfig: { enabled: false },
});
