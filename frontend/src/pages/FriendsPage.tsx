import { FriendsContent } from "../components/FriendsContent";
import { PageShell } from "../components/ui/PageShell";

export function FriendsPage() {
  return (
    <PageShell title="Friends" showNav>
      <FriendsContent />
    </PageShell>
  );
}
