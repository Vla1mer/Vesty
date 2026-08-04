import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders, signIn } from "./renderWithProviders";
import { useAuth } from "../context/useAuth";

function AuthProbe() {
  const { isAuthenticated, userId, userName } = useAuth();
  return (
    <div>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="userId">{String(userId)}</span>
      <span data-testid="userName">{String(userName)}</span>
    </div>
  );
}

describe("renderWithProviders", () => {
  it("renders signed out when no token was seeded", () => {
    renderWithProviders(<AuthProbe />);

    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
    expect(screen.getByTestId("userId")).toHaveTextContent("null");
  });

  it("signs the user in so components see the real identity", () => {
    signIn(42, "vlad");
    renderWithProviders(<AuthProbe />);

    expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
    expect(screen.getByTestId("userId")).toHaveTextContent("42");
    expect(screen.getByTestId("userName")).toHaveTextContent("vlad");
  });
});
