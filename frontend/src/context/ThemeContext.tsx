import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ThemeContext,
  readStoredPreference,
  resolveTheme,
  storePreference,
} from "./themeContextInternal";
import type { ThemePreference } from "./themeContextInternal";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readStoredPreference);
  const [resolved, setResolved] = useState(() => resolveTheme(preference));

  useEffect(() => {
    setResolved(resolveTheme(preference));
    if (preference !== "system") return;

    const query = window.matchMedia("(prefers-color-scheme: light)");
    const sync = () => setResolved(resolveTheme("system"));
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, [preference]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("theme-switching");
    root.dataset.theme = resolved;
    root.style.colorScheme = resolved;
    root.classList.add("theme-ready");

    let settled = 0;
    const painted = requestAnimationFrame(() => {
      settled = requestAnimationFrame(() =>
        root.classList.remove("theme-switching")
      );
    });

    return () => {
      cancelAnimationFrame(painted);
      cancelAnimationFrame(settled);
      root.classList.remove("theme-switching");
    };
  }, [resolved]);

  const setPreference = useCallback((next: ThemePreference) => {
    storePreference(next);
    setPreferenceState(next);
  }, []);

  const value = useMemo(
    () => ({ preference, resolved, setPreference }),
    [preference, resolved, setPreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
