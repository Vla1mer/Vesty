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

function failWith(status: number) {
  vi.mocked(login).mockRejectedValue(
    Object.assign(new Error("nope"), { response: { status } })
  );
}

async function signIn() {
  renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/chats" element={<p>chats screen</p>} />
    </Routes>,
    { route: "/login" }
  );
  await userEvent.type(screen.getByLabelText("Username"), "petya");
  await userEvent.type(screen.getByLabelText("Password"), "Secret1");
  await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.mocked(login).mockReset();
  });

  it("lets a user with the right password in", async () => {
    vi.mocked(login).mockResolvedValue({
      accessToken: "access",
      refreshToken: "refresh",
    });

    await signIn();

    expect(await screen.findByText("chats screen")).toBeInTheDocument();
    expect(login).toHaveBeenCalledWith({ userName: "petya", password: "Secret1" });
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
