import { dumbClone } from '../utils/tryParse';
import { SiteTag, SiteEmbededTag, Category, TagManagerConfig } from '../types';
import { isExperimentOpen } from '../utils/experiments';
import {
  READ_LOAD_ONCE_FROM_TAG_SPEC,
  METASITE_APP_DEF_ID,
} from '../consts/consts';
import { publishEvent, eventNames } from './events';

let loadingTags: any[] = [];
const loadedTags: any[] = [];
const errorTags: any[] = [];
const embedTags: SiteEmbededTag[] = [];
let categories: Category[] = [];
let config: TagManagerConfig = {};
let gettingMyAccessToken = false;
let getAccessToken: () => Promise<string> | undefined | Error;

export function addTagEmbeds(tagsToAdd: SiteTag[]) {
  if (isExperimentOpen(config?.experiments, READ_LOAD_ONCE_FROM_TAG_SPEC)) {
    tagsToAdd.forEach((tag) => {
      const loadOnce =
        tag.loadOnce || tag.content?.includes('load-once="true"');
      embedTags.push({
        tag: {
          ...tag,
          loadOnce,
        },
        embeddedNodes: null,
      });
    });
  } else {
    tagsToAdd.forEach((tag) => {
      embedTags.push({
        tag,
        embeddedNodes: null,
      });
    });
  }
}

export function getSiteEmbedTags(): SiteEmbededTag[] {
  // Return the reference since it has DOM references
  return embedTags;
}

export function setConfig(conf: TagManagerConfig) {
  if (typeof conf === 'object' && !Array.isArray(conf)) {
    config = { ...config, ...conf };
    publishEvent(
      eventNames.TAG_MANAGER_CONFIG_SET,
      window as any,
      dumbClone(config),
    );
  }
}

export function getConfig() {
  return dumbClone(config);
}

export function updateConsentCategories(policy: { [key: string]: boolean }) {
  if (policy && typeof policy === 'object') {
    categories = [...categories, ...calculateNewCategories(policy)];
  }
}

export function calculateNewCategories(policy: { [key: string]: boolean }) {
  return (Object.keys(policy) as Category[]).filter(
    (key) => !!policy[key] && categories.indexOf(key) === -1,
  );
}

export function getConsentCategories(): Category[] {
  return dumbClone(categories);
}

export function setLoading(_loadingTags: any[]) {
  loadingTags = _loadingTags;
}

export function removeLoadingTag(tagName: string) {
  loadingTags = loadingTags.filter((tag) => tag.name !== tagName);
}

export function getLoadingTags() {
  return dumbClone(loadingTags);
}

export function addLoadedTag(_loadedTag: any) {
  loadedTags.push(_loadedTag);
}

export function getLoadedTags() {
  return dumbClone(loadedTags);
}

export function addLoadErrorTag(_loadErrorTag: any) {
  errorTags.push(_loadErrorTag);
}

export function getLoadErrorTags() {
  return dumbClone(errorTags);
}

export function setMyTokenState() {
  if (!getAccessToken && !gettingMyAccessToken) {
    gettingMyAccessToken = true;
  }
}

export function setAccessTokenGetter(
  accessTokenGetter: () => Promise<string> | Error,
) {
  if (!getAccessToken && typeof accessTokenGetter === 'function') {
    getAccessToken = accessTokenGetter;
  }
  gettingMyAccessToken = false;
}

export function tokenAccessor() {
  return getAccessToken;
}

/**
 * This function compares stored references of DOM Nodes with the running `document.currentScript` node
 * If there is a match it returns the appId that owns that renderd node
 * It is called from the Viewer API for getting an API which provides access tokens
 * Ticket: TB-9467
 * @returns string appId or Error
 */
export function getAppId(): string | Error {
  // This is to get the Tag Manager it's own access token
  if (gettingMyAccessToken) {
    gettingMyAccessToken = false;
    return METASITE_APP_DEF_ID;
  }
  const currentScript: HTMLOrSVGScriptElement | null = document.currentScript;
  let foundApp = false;
  const currentScriptIsAScript = currentScript instanceof HTMLScriptElement;
  let appLookupResult: string | Error | undefined;
  // No reason to waste time comparing SVG Element Scripts or Null references
  if (currentScriptIsAScript) {
    embedTags.forEach((siteTag: SiteEmbededTag) => {
      if (!foundApp && siteTag.tag.appInfo) {
        siteTag.embeddedNodes.forEach((node: HTMLOrSVGScriptElement) => {
          if (!foundApp) {
            if (node === currentScript) {
              appLookupResult = siteTag.tag?.appInfo?.id || '';
              foundApp = true;
            }
          }
        });
      }
    });
  }
  if (!appLookupResult) {
    const scriptInfo = getScriptInfo(currentScript);
    const errorTxt = `App not found for script ${scriptInfo}, errorId: 404C`;
    console.error(errorTxt);
    appLookupResult = new Error(errorTxt);
  }
  return appLookupResult;
}

function getScriptInfo(currentScript: HTMLOrSVGScriptElement | null): string {
  let scriptInformation = 'Script not identified';
  if (currentScript instanceof HTMLScriptElement) {
    const { type, src } = currentScript;
    scriptInformation = `type: ${type || 'No Type Found'} src: ${
      src || 'No URL Found'
    }`;
  }
  return scriptInformation;
}
