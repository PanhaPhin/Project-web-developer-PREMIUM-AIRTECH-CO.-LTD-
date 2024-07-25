import { App } from './components/App';
import { getUrlParam, renderComponent } from './utils/utils';
import { initTranslations } from './services/i18n/i18n';
import { TranslateFunction } from './services/i18n/translate';
import { initStore } from './services/configuration/configuration-store';
import { resetPolicy } from './services/consent-policy-manager/consent-policy-manager';

function getStaticsUrl(): string {
  const _window = window as any;
  const staticsRoot =
    'https://static.parastorage.com/services/cookie-consent-banner-for-uou/';
  let staticsUrl = '';
  if (_window.staticsBaseUrl) {
    staticsUrl = _window.staticsBaseUrl;
  }
  if (
    _window.wixTagManager &&
    typeof _window.wixTagManager.getConfig === 'function'
  ) {
    staticsUrl = _window.wixTagManager.getConfig()?.wixBannerStatics;
  }
  if (!staticsUrl) {
    const scripts = document.getElementsByTagName('script');
    Array.prototype.forEach.call(scripts, (script) => {
      if (!staticsUrl && script.src.indexOf(staticsRoot) > -1) {
        const version = script.src.split(staticsRoot)[1].split('/').shift();
        staticsUrl = `${staticsRoot}${version}/`;
      }
    });
  }
  return staticsUrl;
}

function getCurrentPageType(): string | undefined {
  return (window.wixEmbedsAPI?.getCurrentPageInfo?.() || {}).type;
}

export async function loadBanner() {
  const previewMode = getUrlParam('cb_preview_mode');

  const locale = window.wixEmbedsAPI?.getLanguage() || 'en';
  const staticUrl = getStaticsUrl();

  if (previewMode === 'iframe' || previewMode === 'full') {
    await import('./preview-mode/preview-mode').then(async (module) => {
      await module.initPreviewMode(staticUrl, locale);
    });
    return;
  }
  const store = await initStore();
  const { policySubmitted, createdPolicyTimestamp, settings } = store;

  const { appEnabled, expiryDate, revisitSettingsConfig } = settings;
  const revisitSettingsConfigEnabled = revisitSettingsConfig?.enabled;

  const expiryPassed =
    (expiryDate || 0) > (createdPolicyTimestamp?.getTime() || 0);
  let policyExists = policySubmitted;

  if (expiryPassed) {
    policyExists = false;
    resetPolicy();
  }

  const isAdminPage = getCurrentPageType() === 'admin';

  if (
    (policyExists && !revisitSettingsConfigEnabled) ||
    !appEnabled ||
    isAdminPage
  ) {
    return;
  }

  await initTranslations(staticUrl, locale, (translate: TranslateFunction) => {
    void renderComponent(
      new App({
        settings,
        locale,
      }),
      document.body,
    );
  });
}

if (document.body) {
  void loadBanner();
} else {
  window.onload = loadBanner;
}
