import { BottomNav } from "../components/BottomNav";

export function SettingsPage() {
  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto pb-24">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100">Settings</h1>
      </header>

      <div className="flex flex-col items-center justify-center py-24 text-center">
        <span className="text-6xl mb-4">⚙️</span>
        <h2 className="text-xl font-semibold text-slate-100 mb-2">
          Coming soon
        </h2>
        <p className="text-sm text-slate-400 max-w-sm">
          This page is under construction. Soon you'll be able to customize
          your experience here.
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
