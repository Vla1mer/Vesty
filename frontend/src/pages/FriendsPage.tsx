import { BottomNav } from "../components/BottomNav";
import { FriendsContent } from "../components/FriendsContent";

export function FriendsPage() {
  return (
    <div className="mx-auto min-h-screen max-w-4xl p-6 pb-24">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-content">Friends</h1>
      </header>

      <FriendsContent />

      <BottomNav />
    </div>
  );
}
