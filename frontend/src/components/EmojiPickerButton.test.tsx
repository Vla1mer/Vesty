import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("emoji-picker-react", () => ({
  default: ({ onEmojiClick }: { onEmojiClick: (e: { emoji: string }) => void }) => (
    <button type="button" onClick={() => onEmojiClick({ emoji: "🔥" })}>
      fire
    </button>
  ),
}));

import { EmojiPickerButton } from "./EmojiPickerButton";
import { ThemeProvider } from "../context/ThemeContext";

function setup(disabled = false) {
  const onPick = vi.fn();
  render(
    <ThemeProvider>
      <EmojiPickerButton disabled={disabled} onPick={onPick} />
    </ThemeProvider>
  );
  return { onPick };
}

function trigger() {
  return screen.getByRole("button", { name: "Insert emoji" });
}

describe("EmojiPickerButton", () => {
  it("keeps the picker closed until asked", () => {
    setup();

    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: "fire" })).toBeNull();
  });

  it("opens the picker", async () => {
    setup();

    await userEvent.click(trigger());

    expect(await screen.findByRole("button", { name: "fire" })).toBeInTheDocument();
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
  });

  it("reports the chosen emoji and closes", async () => {
    const { onPick } = setup();

    await userEvent.click(trigger());
    await userEvent.click(await screen.findByRole("button", { name: "fire" }));

    expect(onPick).toHaveBeenCalledExactlyOnceWith("🔥");
    expect(screen.queryByRole("button", { name: "fire" })).toBeNull();
  });

  it("closes on a second click of the button", async () => {
    setup();

    await userEvent.click(trigger());
    await screen.findByRole("button", { name: "fire" });
    await userEvent.click(trigger());

    expect(screen.queryByRole("button", { name: "fire" })).toBeNull();
  });

  it("closes on Escape", async () => {
    setup();

    await userEvent.click(trigger());
    await screen.findByRole("button", { name: "fire" });
    fireEvent.keyDown(window, { key: "Escape" });

    expect(screen.queryByRole("button", { name: "fire" })).toBeNull();
  });

  it("closes when something outside is pressed", async () => {
    setup();

    await userEvent.click(trigger());
    await screen.findByRole("button", { name: "fire" });
    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole("button", { name: "fire" })).toBeNull();
  });

  it("stays shut while the composer is busy", async () => {
    setup(true);

    expect(trigger()).toBeDisabled();
    await userEvent.click(trigger());

    expect(screen.queryByRole("button", { name: "fire" })).toBeNull();
  });
});
