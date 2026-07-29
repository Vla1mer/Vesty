import { useTheme } from "../context/useTheme";
import { THEME_PREFERENCES } from "../context/themeContextInternal";
import type { ThemePreference } from "../context/themeContextInternal";

const LABELS: Record<ThemePreference, { title: string; hint: string }> = {
  light: { title: "Light", hint: "Bright surfaces, dark text" },
  dark: { title: "Dark", hint: "Dimmed surfaces, light text" },
  system: { title: "System", hint: "Follow your device setting" },
};

function Swatch({ preference }: { preference: ThemePreference }) {
  const base = "h-9 w-9 shrink-0 rounded-lg border border-line-strong overflow-hidden";

  if (preference === "system") {
    return (
      <div className={`${base} flex`}>
        <div className="w-1/2 bg-[#F7F8FA]" />
        <div className="w-1/2 bg-[#0B1120]" />
      </div>
    );
  }

  const isLight = preference === "light";
  return (
    <div className={`${base} flex flex-col justify-between p-1.5 ${isLight ? "bg-[#F7F8FA]" : "bg-[#0B1120]"}`}>
      <span className={`h-1 w-full rounded-full ${isLight ? "bg-[#CBD5E1]" : "bg-[#334155]"}`} />
      <span className={`h-1 w-2/3 rounded-full ${isLight ? "bg-[#E08A00]" : "bg-[#F5A524]"}`} />
    </div>
  );
}

export function ThemePicker() {
  const { preference, resolved, setPreference } = useTheme();

  return (
    <section>
      <h3 className="text-sm font-semibold text-content mb-1">Appearance</h3>
      <p className="text-xs text-content-subtle mb-3">
        Currently showing the {resolved} theme.
      </p>

      <div className="grid gap-2 sm:grid-cols-3">
        {THEME_PREFERENCES.map((option) => {
          const isSelected = preference === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => setPreference(option)}
              aria-pressed={isSelected}
              className={`flex items-center gap-3 rounded-card border p-3 text-left transition ${
                isSelected
                  ? "border-accent bg-accent-soft"
                  : "border-line bg-surface-raised hover:border-line-strong"
              }`}
            >
              <Swatch preference={option} />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-content">
                  {LABELS[option].title}
                </span>
                <span className="block text-xs text-content-subtle truncate">
                  {LABELS[option].hint}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
