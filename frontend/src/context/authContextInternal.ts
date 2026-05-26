import { createContext } from "react";

export interface AuthContextValue {
  isAuthenticated: boolean;
  userId: number | null;
  userName: string | null;
  setAuthenticated: () => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
