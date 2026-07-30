import { useContext } from "react";
import { ThemeContext } from "./themeContextInternal";
import type { ThemeContextValue } from "./themeContextInternal";

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
