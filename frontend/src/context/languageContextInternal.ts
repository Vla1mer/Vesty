import { createContext } from "react";
import { LANGUAGES } from "../i18n/translations";
import type { Language, TranslationKey } from "../i18n/translations";

export const LANGUAGE_STORAGE_KEY = "vesty.language";

export interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
}

export const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function isLanguage(value: unknown): value is Language {
  return LANGUAGES.includes(value as Language);
}

export function readStoredLanguage(): Language {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isLanguage(stored)) return stored;
  } catch {
    return "en";
  }

  const preferred = navigator.languages ?? [navigator.language];
  const spoken = preferred.map((tag) => tag.split("-")[0]).find(isLanguage);
  return spoken ?? "en";
}

export function storeLanguage(language: Language): void {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    void error;
  }
}

export function fill(text: string, values?: Record<string, string | number>): string {
  if (!values) return text;
  return text.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in values ? String(values[name]) : whole
  );
}
