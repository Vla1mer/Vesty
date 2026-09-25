import { SettingsContent } from "../components/SettingsContent";
import { PageShell } from "../components/ui/PageShell";
import { useLanguage } from "../context/useLanguage";

export function SettingsPage() {
  const { t } = useLanguage();
  return (
    <PageShell title={t("nav.settings")} showNav>
      <SettingsContent />
    </PageShell>
  );
}
