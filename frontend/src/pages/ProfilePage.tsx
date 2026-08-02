import { ProfileContent } from "../components/ProfileContent";
import { PageShell } from "../components/ui/PageShell";

export function ProfilePage() {
  return (
    <PageShell title="Profile" showNav>
      <ProfileContent />
    </PageShell>
  );
}
