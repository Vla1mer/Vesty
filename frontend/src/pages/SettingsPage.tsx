import { SettingsContent } from "../components/SettingsContent";
import { PageShell } from "../components/ui/PageShell";

export function SettingsPage() {
  return (
    <PageShell title="Settings" showNav>
      <SettingsContent />
    </PageShell>
  );
}
