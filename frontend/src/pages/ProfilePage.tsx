import { ProfileContent } from "../components/ProfileContent";
import { PageShell } from "../components/ui/PageShell";
import { useLanguage } from "../context/useLanguage";

export function ProfilePage() {
  const { t } = useLanguage();
  return (
    <PageShell title={t("nav.profile")} showNav>
      <ProfileContent />
    </PageShell>
  );
}
