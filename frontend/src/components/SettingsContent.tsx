import { BlockedUsers } from "./BlockedUsers";
import { LanguagePicker } from "./LanguagePicker";
import { PrivacySettings } from "./PrivacySettings";
import { ThemeToggle } from "./ThemeToggle";
import { Switch } from "./ui/Switch";
import { SectionHeading } from "./ui/SectionHeading";
import { setRailLabels, useRailLabels } from "../hooks/useRailLabels";
import { useLanguage } from "../context/useLanguage";

export function SettingsContent() {
  const showRailLabels = useRailLabels();
  const { t } = useLanguage();

  return (
    <div className="space-y-8 py-2">
      <section className="space-y-5">
        <SectionHeading>{t("settings.appearance")}</SectionHeading>

        <div className="flex items-center justify-between gap-4">
          <span className="min-w-0">
            <span className="block text-sm font-medium text-content">
              {t("settings.darkTheme")}
            </span>
            <span className="block text-xs text-content-subtle">
              {t("settings.darkThemeHint")}
            </span>
          </span>
          <ThemeToggle />
        </div>

        <div className="hidden items-center justify-between gap-4 md:flex">
          <span className="min-w-0">
            <span className="block text-sm font-medium text-content">
              {t("settings.railLabels")}
            </span>
            <span className="block text-xs text-content-subtle">
              {t("settings.railLabelsHint")}
            </span>
          </span>
          <Switch
            checked={showRailLabels}
            onChange={setRailLabels}
            ariaLabel={t("settings.railLabelsToggle")}
          />
        </div>

        <LanguagePicker />
      </section>

      <PrivacySettings />

      <BlockedUsers />
    </div>
  );
}
