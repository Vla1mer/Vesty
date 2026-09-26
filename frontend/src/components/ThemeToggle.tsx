import { useLanguage } from "../context/useLanguage";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/useTheme";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolved, setPreference } = useTheme();
  const { t } = useLanguage();
  const isDark = resolved === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? t("settings.toLight") : t("settings.toDark")}
      title={isDark ? t("settings.toLight") : t("settings.toDark")}
      onClick={() => setPreference(isDark ? "light" : "dark")}
      className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border border-line bg-surface-raised transition hover:border-line-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong ${className}`}
    >
      <span
        className={`absolute left-0 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-accent-contrast shadow-raised transition-transform duration-200 ease-swift ${
          isDark ? "translate-x-7" : "translate-x-1"
        }`}
      >
        {isDark ? <Moon size={14} /> : <Sun size={14} />}
      </span>
    </button>
  );
}
