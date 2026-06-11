import { useMemo, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { getAccessToken, clearTokens } from "../api/client";
import { AuthContext } from "./authContextInternal";
import { startConnection, stopConnection } from "../lib/signalr";

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function readUserFromToken(): { id: number | null; name: string | null } {
  const token = getAccessToken();
  if (!token) return { id: null, name: null };
  const payload = decodeJwtPayload(token);
  if (!payload) return { id: null, name: null };

  const nameIdClaim =
    payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ??
    payload["nameid"] ??
    payload["sub"];
  const nameClaim =
    payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ??
    payload["unique_name"] ??
    payload["name"];

  return {
    id: nameIdClaim ? Number(nameIdClaim) : null,
    name: nameClaim ? String(nameClaim) : null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!getAccessToken());

  useEffect(() => {
    const token = getAccessToken();
    if (token) startConnection(token).catch(console.error);
  }, []);

  const { userId, userName } = useMemo(() => {
    if (!isAuthenticated) return { userId: null, userName: null };
    const { id, name } = readUserFromToken();
    return { userId: id, userName: name };
  }, [isAuthenticated]);

  const setAuthenticated = () => {
    setIsAuthenticated(true);
    const token = getAccessToken();
    if (token) startConnection(token).catch(console.error);
  };

  const logout = () => {
    stopConnection().catch(console.error);
    clearTokens();
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, userId, userName, setAuthenticated, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
