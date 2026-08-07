import type { ReactElement, ReactNode } from "react";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { makeStore } from "../store/store";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import { ACCESS_TOKEN_KEY } from "../api/client";

function fakeToken(userId: number, userName: string): string {
  const payload = {
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier":
      String(userId),
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name": userName,
  };
  return `header.${btoa(JSON.stringify(payload))}.signature`;
}

export function signIn(userId: number, userName: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, fakeToken(userId, userName));
}

interface Options {
  route?: string;
  path?: string;
}

export function renderWithProviders(
  ui: ReactElement,
  { route = "/", path }: Options = {}
) {
  const store = makeStore();

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        <ThemeProvider>
          <MemoryRouter initialEntries={[route]}>
            <AuthProvider>
              {path ? (
                <Routes>
                  <Route path={path} element={children} />
                </Routes>
              ) : (
                children
              )}
            </AuthProvider>
          </MemoryRouter>
        </ThemeProvider>
      </Provider>
    );
  }

  return { store, ...render(ui, { wrapper: Wrapper }) };
}
