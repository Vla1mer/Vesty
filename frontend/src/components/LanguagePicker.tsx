import { useLanguage } from "../context/useLanguage";
import { LANGUAGES, LANGUAGE_NAMES } from "../i18n/translations";

export function LanguagePicker() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <section className="space-y-2">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-content">
          {t("language.title")}
        </span>
        <span className="block text-xs text-content-subtle">
          {t("language.description")}
        </span>
      </span>
      <div className="grid gap-2 sm:grid-cols-3">
        {LANGUAGES.map((option) => {
          const selected = option === language;

          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              onClick={() => setLanguage(option)}
              className={`rounded-card border p-3 text-left text-sm transition ${
                selected
                  ? "border-accent-strong bg-accent-soft text-content"
                  : "border-line bg-surface-muted text-content-muted hover:border-line-strong"
              }`}
            >
              {LANGUAGE_NAMES[option]}
            </button>
          );
        })}
      </div>
    </section>
  );
}
