import { BottomNav } from "../components/BottomNav";
import { SettingsContent } from "../components/SettingsContent";

export function SettingsPage() {
  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto pb-24">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-content">Settings</h1>
      </header>

      <SettingsContent />

      <BottomNav />
    </div>
  );
}
