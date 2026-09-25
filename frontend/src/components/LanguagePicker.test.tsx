import { beforeEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguagePicker } from "./LanguagePicker";
import { LoginPage } from "../pages/LoginPage";
import { renderWithProviders } from "../test/renderWithProviders";
import { LANGUAGE_STORAGE_KEY } from "../context/languageContextInternal";

function trigger() {
  return screen.getByRole("button", {
    name: (_name, element) => element.getAttribute("aria-haspopup") === "listbox",
  });
}

function option(name: string) {
  return screen.getByRole("option", { name: new RegExp(name) });
}

describe("LanguagePicker", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows the current language on the button", () => {
    renderWithProviders(<LanguagePicker />);

    expect(trigger()).toHaveTextContent("English");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("offers both languages once opened", async () => {
    renderWithProviders(<LanguagePicker />);

    await userEvent.click(trigger());

    expect(option("English")).toHaveAttribute("aria-selected", "true");
    expect(option("Polski")).toHaveAttribute("aria-selected", "false");
  });

  it("switches the interface to Polish", async () => {
    renderWithProviders(
      <>
        <LanguagePicker />
        <LoginPage />
      </>
    );

    await userEvent.click(trigger());
    await userEvent.click(option("Polski"));

    expect(screen.getByText("Zaloguj się na swoje konto")).toBeInTheDocument();
    expect(screen.queryByText("Sign in to your account")).toBeNull();
  });

  it("closes the list after a choice", async () => {
    renderWithProviders(<LanguagePicker />);

    await userEvent.click(trigger());
    await userEvent.click(option("Polski"));

    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("closes the list on Escape", async () => {
    renderWithProviders(<LanguagePicker />);

    await userEvent.click(trigger());
    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("remembers the choice for the next visit", async () => {
    renderWithProviders(<LanguagePicker />);

    await userEvent.click(trigger());
    await userEvent.click(option("Polski"));

    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("pl");
  });

  it("opens in the language chosen last time", () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "pl");

    renderWithProviders(<LanguagePicker />);

    expect(screen.getByText("Wybierz język interfejsu")).toBeInTheDocument();
    expect(trigger()).toHaveTextContent("Polski");
  });
});
