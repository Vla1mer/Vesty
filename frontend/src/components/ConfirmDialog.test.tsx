import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { ConfirmDialog } from "./ConfirmDialog";
import { renderWithProviders } from "../test/renderWithProviders";
import { LANGUAGE_STORAGE_KEY } from "../context/languageContextInternal";

function open() {
  renderWithProviders(
    <ConfirmDialog
      title="Delete?"
      message="It will be gone."
      onConfirm={vi.fn()}
      onCancel={vi.fn()}
    />
  );
}

describe("ConfirmDialog", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("names its buttons in English", () => {
    open();

    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("names its buttons in Polish", () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "pl");

    open();

    expect(screen.getByRole("button", { name: "Potwierdź" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Anuluj" })).toBeInTheDocument();
  });
});
