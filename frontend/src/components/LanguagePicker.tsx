import { useLanguage } from "../context/useLanguage";
import { LanguageMenu } from "./LanguageMenu";

export function LanguagePicker() {
  const { t } = useLanguage();

  return (
    <section className="flex items-center justify-between gap-4">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-content">
          {t("language.title")}
        </span>
        <span className="block text-xs text-content-subtle">
          {t("language.description")}
        </span>
      </span>

      <LanguageMenu />
    </section>
  );
}
