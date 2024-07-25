import {
  getLoadErrorTags,
  getLoadedTags,
  getLoadingTags,
  getConfig,
  getAppId,
  setMyTokenState,
  setAccessTokenGetter,
} from './modules/stateCache';
import { publishEvent, eventNames } from './modules/events';
import { onPageNavigation, onConsentPolicyChanged } from './integration/viewer';
import { getSiteTags } from './API/siteApi';

(function () {
  const win = window as any;

  registerToWixEmbedsAPI();

  function registerToWixEmbedsAPI() {
    const embedsAPI = win.wixEmbedsAPI;
    if (embedsAPI && typeof embedsAPI.registerToEvent === 'function') {
      initTagManager();
    } else {
      win.addEventListener('wixEmbedsAPIReady', initTagManager, false);
    }
  }

  function initTagManager() {
    const embedsAPI = win.wixEmbedsAPI;

    registerTagManagerAPI();

    initTokenState(embedsAPI);

    getSiteTags({
      baseUrl: embedsAPI.getExternalBaseUrl(),
      htmlsiteId: embedsAPI.getHtmlSiteId(),
      metasiteId: embedsAPI.getMetaSiteId(),
      language: embedsAPI.getLanguage(),
      wixSite: embedsAPI.isWixSite(),
    });

    embedsAPI.registerToEvent('pageNavigation', onPageNavigation);
    document.addEventListener('consentPolicyChanged', onConsentPolicyChanged);
  }

  function registerTagManagerAPI() {
    const api = Object.freeze({
      getLoadedTags,
      getLoadingTags,
      getLoadErrorTags,
      getConfig,
      getAppId,
    });

    Object.defineProperty(win, 'wixTagManager', {
      value: api,
      writable: false,
      configurable: false,
      enumerable: true,
    });

    publishEvent(
      eventNames.TAG_MANAGER_LOADED,
      window as any,
      window.wixTagManager,
    );
  }

  function initTokenState(wixEmbedsAPI: any) {
    if (typeof wixEmbedsAPI.getAccessTokenFunction === 'function') {
      setMyTokenState();
      const getAccessToken: () => Promise<string> | Error =
        wixEmbedsAPI.getAccessTokenFunction();
      setAccessTokenGetter(getAccessToken);
    }
  }
})();
