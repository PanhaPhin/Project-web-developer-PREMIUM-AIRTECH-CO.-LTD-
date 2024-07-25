const markAsMissingKey = (str: keyof TranslationsMap) => `!${str}!`;

type StringsMap = { [key: string]: string };
export const createTranslationFn = (
  translations: StringsMap,
  context: StringsMap = {},
): ((key: keyof TranslationsMap) => string) => {
  return (key) => {
    const translation = translations[key];

    if (!translation) {
      return markAsMissingKey(key);
    }

    return translation.replace(
      // matches `var` in "<%=var%>"
      /<%=([^%]+)%>/g,
      (_, variable) => context[variable] ?? markAsMissingKey(variable),
    );
  };
};

export interface TranslationsMap {
  [locale: string]: any;
}

export type TranslateFunction = (key: keyof TranslationsMap) => string;
