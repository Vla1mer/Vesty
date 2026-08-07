import { describe, expect, it, vi } from "vitest";
import { useRef, useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("emoji-picker-react", () => ({
  default: ({ onEmojiClick }: { onEmojiClick: (e: { emoji: string }) => void }) => (
    <button type="button" onClick={() => onEmojiClick({ emoji: "🔥" })}>
      fire
    </button>
  ),
}));

import { MessageComposer } from "./MessageComposer";
import { ThemeProvider } from "../context/ThemeContext";

const attachments = {
  uploads: [],
  add: vi.fn(),
  remove: vi.fn(),
  clear: vi.fn(),
  readyIds: [],
  isUploading: false,
};

function Harness({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <ThemeProvider>
      <MessageComposer
        value={value}
        onChange={setValue}
        onSubmit={(e) => e.preventDefault()}
        inputRef={inputRef}
        attachments={attachments}
        isEditing={false}
        onCancelEdit={vi.fn()}
        replyTo={null}
        onCancelReply={vi.fn()}
        error={null}
        busy={false}
        blocked={false}
      />
    </ThemeProvider>
  );
}

function field() {
  return screen.getByPlaceholderText("Type a message...") as HTMLInputElement;
}

async function pickFire() {
  await userEvent.click(screen.getByRole("button", { name: "Insert emoji" }));
  await userEvent.click(await screen.findByRole("button", { name: "fire" }));
}

describe("MessageComposer emoji insertion", () => {
  it("appends when the caret sits at the end", async () => {
    render(<Harness initial="hi" />);
    field().setSelectionRange(2, 2);

    await pickFire();

    expect(field().value).toBe("hi🔥");
  });

  it("inserts where the caret is", async () => {
    render(<Harness initial="ab" />);
    field().setSelectionRange(1, 1);

    await pickFire();

    expect(field().value).toBe("a🔥b");
  });

  it("replaces the selected text", async () => {
    render(<Harness initial="abcd" />);
    field().setSelectionRange(1, 3);

    await pickFire();

    expect(field().value).toBe("a🔥d");
  });

  it("leaves the caret after the emoji", async () => {
    render(<Harness initial="ab" />);
    field().setSelectionRange(1, 1);

    await pickFire();

    await waitFor(() => expect(field().selectionStart).toBe(1 + "🔥".length));
  });

  it("follows the caret when typing continues with the picker open", async () => {
    render(<Harness initial="hello" />);
    await userEvent.click(field());
    field().setSelectionRange(5, 5);

    await userEvent.click(screen.getByRole("button", { name: "Insert emoji" }));
    await screen.findByRole("button", { name: "fire" });
    await userEvent.keyboard(" world");
    await userEvent.click(screen.getByRole("button", { name: "fire" }));

    expect(field().value).toBe("hello world🔥");
  });

  it("keeps the field focused while the picker is open", async () => {
    render(<Harness initial="hi" />);
    await userEvent.click(field());

    await userEvent.click(screen.getByRole("button", { name: "Insert emoji" }));
    await screen.findByRole("button", { name: "fire" });

    expect(field()).toHaveFocus();
  });

  it("changes nothing when the emoji would not fit", async () => {
    const full = "x".repeat(2000);
    render(<Harness initial={full} />);
    field().setSelectionRange(2000, 2000);

    await pickFire();

    expect(field().value).toBe(full);
  });

  it("keeps the selection when the emoji would not fit", async () => {
    const full = "x".repeat(2000);
    render(<Harness initial={full} />);
    field().setSelectionRange(0, 1);

    await pickFire();
    await new Promise((resolve) => requestAnimationFrame(resolve));

    expect(field().value).toBe(full);
    expect(field().selectionStart).toBe(0);
    expect(field().selectionEnd).toBe(1);
  });

  it("gives the field the focus back", async () => {
    render(<Harness initial="ab" />);
    field().setSelectionRange(2, 2);

    await pickFire();

    await waitFor(() => expect(field()).toHaveFocus());
  });
});
