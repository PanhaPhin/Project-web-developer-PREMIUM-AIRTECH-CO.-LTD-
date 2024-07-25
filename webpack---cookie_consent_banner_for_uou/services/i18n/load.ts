import enTranslations from '../../assets/locale/messages_en.json';
import { TranslationsMap } from './translate';

const TIMEOUT = 2000;

const generateUrl = (staticsUrl: string, language: string) =>
  `${staticsUrl.replace(/\/$/, '')}/assets/locale/messages_${language}.json`;

export const loadTranslations = (
  staticsUrl: string,
  language: string,
  callback: (translations: TranslationsMap) => any,
): void => {
  if (language === 'en') {
    callback(enTranslations);
    return;
  }

  const xhr = new XMLHttpRequest();

  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4 /* XMLHttpRequest.DONE */) {
      if (xhr.status === 200) {
        try {
          const translations = JSON.parse(xhr.responseText);
          callback(translations);
        } catch (err) {
          callback(enTranslations);
        }
      } else {
        callback(enTranslations);
      }
    }
  };

  xhr.ontimeout = () => callback(enTranslations);

  // Order of statements below is important for IE to ensure timeout works
  // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/timeout
  xhr.open('GET', generateUrl(staticsUrl, language));
  xhr.timeout = TIMEOUT;
  xhr.send();
};
