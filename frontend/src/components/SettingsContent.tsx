import { BlockedUsers } from "./BlockedUsers";
import { PrivacySettings } from "./PrivacySettings";
import { ThemeToggle } from "./ThemeToggle";
import { Switch } from "./ui/Switch";
import { setRailLabels, useRailLabels } from "../hooks/useRailLabels";

export function SettingsContent() {
  const showRailLabels = useRailLabels();

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

      <section className="hidden items-center justify-between gap-4 md:flex">
        <span className="min-w-0">
          <span className="block text-sm font-medium text-content">
            Sidebar labels
          </span>
          <span className="block text-xs text-content-subtle">
            Show captions under the icons on the left
          </span>
        </span>
        <Switch
          checked={showRailLabels}
          onChange={setRailLabels}
          ariaLabel="Show captions under the sidebar icons"
        />
      </section>

      <PrivacySettings />

      <BlockedUsers />
    </div>
  );
}
