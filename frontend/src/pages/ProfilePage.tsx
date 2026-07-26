import { BottomNav } from "../components/BottomNav";
import { ProfileContent } from "../components/ProfileContent";

export function ProfilePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 pb-28">
      <h1 className="text-3xl font-bold text-slate-100 mb-6">Profile</h1>
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-xl p-6">
        <ProfileContent />
      </div>
      <BottomNav />
    </div>
  );
}
