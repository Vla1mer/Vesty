import { useLanguage } from "../context/useLanguage";
import { FriendsContent } from "../components/FriendsContent";
import { PageShell } from "../components/ui/PageShell";

export function FriendsPage() {
  const { t } = useLanguage();
  return (
    <PageShell title={t("nav.friends")} showNav>
      <FriendsContent />
    </PageShell>
  );
}
