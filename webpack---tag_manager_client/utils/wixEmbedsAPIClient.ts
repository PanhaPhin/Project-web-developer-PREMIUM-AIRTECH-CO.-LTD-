import { PageInfo } from '../types';

export function getCurrentPageInfo(win: any): PageInfo {
  const embedsAPI = win.wixEmbedsAPI as any;
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const getPageInfo: Function | undefined =
    embedsAPI && embedsAPI.getCurrentPageInfo;
  return typeof getPageInfo === 'function' ? getPageInfo() : {};
}
