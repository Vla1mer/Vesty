import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api/auth", async (original) => ({
  ...(await original<typeof import("../api/auth")>()),
  login: vi.fn(),
}));

import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { LoginPage } from "./LoginPage";
import { login } from "../api/auth";
import { renderWithProviders } from "../test/renderWithProviders";
import { LANGUAGE_STORAGE_KEY } from "../context/languageContextInternal";

function failWith(status: number) {
  vi.mocked(login).mockRejectedValue(
    Object.assign(new Error("nope"), { response: { status } })
  );
}

async function signIn({ remember = true } = {}) {
  renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/chats" element={<p>chats screen</p>} />
    </Routes>,
    { route: "/login" }
  );
  await userEvent.type(screen.getByLabelText("Username"), "petya");
  await userEvent.type(screen.getByLabelText("Password"), "Secret1");
  if (!remember) await userEvent.click(screen.getByLabelText("Remember me"));
  await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.mocked(login).mockReset();
  });

  it("remembers the device unless asked otherwise", async () => {
    vi.mocked(login).mockResolvedValue({
      accessToken: "access",
      refreshToken: "refresh",
    });

    await signIn();

    expect(login).toHaveBeenCalledWith(
      expect.objectContaining({ rememberMe: true })
    );
  });

  it("forgets the device when the box is cleared", async () => {
    vi.mocked(login).mockResolvedValue({
      accessToken: "access",
      refreshToken: "refresh",
    });

    await signIn({ remember: false });

    expect(login).toHaveBeenCalledWith(
      expect.objectContaining({ rememberMe: false })
    );
  });

  it("lets a user with the right password in", async () => {
    vi.mocked(login).mockResolvedValue({
      accessToken: "access",
      refreshToken: "refresh",
    });

    await signIn();

    expect(await screen.findByText("chats screen")).toBeInTheDocument();
    expect(login).toHaveBeenCalledWith(
      expect.objectContaining({ userName: "petya", password: "Secret1" })
    );
  });

  it("asks for the missing fields in Polish", async () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "pl");
    renderWithProviders(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
      </Routes>,
      { route: "/login" }
    );

    await userEvent.click(screen.getByRole("button", { name: "Zaloguj się" }));

    expect(
      await screen.findByText("Nazwa użytkownika jest wymagana")
    ).toBeInTheDocument();
    expect(screen.getByText("Hasło jest wymagane")).toBeInTheDocument();
    localStorage.removeItem(LANGUAGE_STORAGE_KEY);
  });

  it("lets you switch the language before signing in", async () => {
    renderWithProviders(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
      </Routes>,
      { route: "/login" }
    );

    await userEvent.click(
      screen.getByRole("button", {
        name: (_name, element) => element.getAttribute("aria-haspopup") === "listbox",
      })
    );
    await userEvent.click(screen.getByRole("option", { name: /Polski/ }));

    expect(screen.getByText("Zaloguj się na swoje konto")).toBeInTheDocument();
    localStorage.removeItem(LANGUAGE_STORAGE_KEY);
  });

  it("reports a wrong password", async () => {
    failWith(401);

    await signIn();

    expect(
      await screen.findByText("Invalid username or password")
    ).toBeInTheDocument();
  });

  it("asks a locked out user to wait", async () => {
    failWith(429);

    await signIn();

    expect(
      await screen.findByText(
        "Too many failed attempts. Try again in a few minutes."
      )
    ).toBeInTheDocument();
  });

  it("reports any other failure", async () => {
    failWith(500);

    await signIn();

    expect(
      await screen.findByText("Login failed. Please try again.")
    ).toBeInTheDocument();
  });
});
