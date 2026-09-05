import "server-only";
import en from "../dictionaries/en.json";
import pt from "../dictionaries/pt.json";

const dictionaries = {
  en,
  pt,
} as const;

export type Locale = keyof typeof dictionaries;

export const hasLocale = (locale: string): locale is Locale => {
  return locale in dictionaries;
};

export const getDictionary = (locale: Locale) => {
  return dictionaries[locale] || dictionaries.en;
};