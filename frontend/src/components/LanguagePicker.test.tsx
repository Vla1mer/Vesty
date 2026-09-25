import { beforeEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguagePicker } from "./LanguagePicker";
import { LoginPage } from "../pages/LoginPage";
import { renderWithProviders } from "../test/renderWithProviders";
import { LANGUAGE_STORAGE_KEY } from "../context/languageContextInternal";

describe("LanguagePicker", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts on English", () => {
    renderWithProviders(<LanguagePicker />);

    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("switches the interface to Polish", async () => {
    renderWithProviders(
      <>
        <LanguagePicker />
        <LoginPage />
      </>
    );

    await userEvent.click(screen.getByRole("button", { name: "Polski" }));

    expect(screen.getByText("Zaloguj się na swoje konto")).toBeInTheDocument();
    expect(screen.queryByText("Sign in to your account")).toBeNull();
  });

  it("remembers the choice for the next visit", async () => {
    renderWithProviders(<LanguagePicker />);

    await userEvent.click(screen.getByRole("button", { name: "Polski" }));

    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("pl");
  });

  it("opens in the language chosen last time", () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "pl");

    renderWithProviders(<LanguagePicker />);

    expect(screen.getByText("Wybierz język interfejsu")).toBeInTheDocument();
  });
});
