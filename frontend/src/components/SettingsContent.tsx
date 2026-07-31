import { PrivacySettings } from "./PrivacySettings";
import { ThemeToggle } from "./ThemeToggle";

export function SettingsContent() {
  return (
    <div className="space-y-8 py-2">
      <section className="flex items-center justify-between gap-4">
        <span className="min-w-0">
          <span className="block text-sm font-medium text-content">Dark theme</span>
          <span className="block text-xs text-content-subtle">
            Switch between light and dark appearance
          </span>
        </span>
        <ThemeToggle />
      </section>

      <PrivacySettings />
    </div>
  );
}
