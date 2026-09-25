import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  LanguageContext,
  fill,
  readStoredLanguage,
  storeLanguage,
} from "./languageContextInternal";
import { translations } from "../i18n/translations";
import type { Language, TranslationKey } from "../i18n/translations";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readStoredLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((next: Language) => {
    storeLanguage(next);
    setLanguageState(next);
  }, []);

  const value = useMemo(() => {
    const t = (key: TranslationKey, values?: Record<string, string | number>) =>
      fill(translations[language][key] ?? translations.en[key], values);

    return { language, setLanguage, t };
  }, [language, setLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
