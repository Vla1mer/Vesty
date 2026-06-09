import { useContext } from "react";
import { AuthContext } from "./authContextInternal";
import type { AuthContextValue } from "./authContextInternal";

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
