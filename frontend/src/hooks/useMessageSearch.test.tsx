import { describe, expect, it, vi } from "vitest";
import { act, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useMessageSearch } from "./useMessageSearch";
import { ChatSearchBar } from "../components/ChatSearchBar";
import { renderWithProviders } from "../test/renderWithProviders";
import type { MessageDto } from "../types/api";

const message = (id: number, content: string): MessageDto =>
  ({ id, chatId: 1, userId: 2, content, createdAt: `2026-11-26T12:0${id}:00Z` }) as MessageDto;

const MESSAGES = [
  message(1, "Lunch at noon?"),
  message(2, "Sure"),
  message(3, "Where for LUNCH"),
  message(4, "The usual lunch place"),
];

function setup(chatId = 1, onShow = vi.fn()) {
  const hook = renderHook(
    ({ id }) => useMessageSearch(id, MESSAGES, onShow),
    { initialProps: { id: chatId } }
  );
  return { ...hook, onShow };
}

describe("useMessageSearch", () => {
  it("jumps to the newest match first, ignoring case", () => {
    const { result, onShow } = setup();

    act(() => result.current.start());
    act(() => result.current.search("lunch"));

    expect(onShow).toHaveBeenLastCalledWith(4);
    expect(result.current.total).toBe(3);
    expect(result.current.position).toBe(1);
  });

  it("walks to older and back to newer matches", () => {
    const { result, onShow } = setup();
    act(() => result.current.start());
    act(() => result.current.search("lunch"));

    act(() => result.current.older());
    act(() => result.current.older());
    expect(onShow).toHaveBeenLastCalledWith(1);
    expect(result.current.position).toBe(3);

    act(() => result.current.older());
    expect(result.current.position).toBe(3);

    act(() => result.current.newer());
    expect(onShow).toHaveBeenLastCalledWith(3);
  });

  it("finds nothing for text that is not there", () => {
    const { result, onShow } = setup();
    act(() => result.current.start());
    act(() => result.current.search("dinner"));

    expect(result.current.total).toBe(0);
    expect(onShow).not.toHaveBeenCalled();
  });

  it("closes when another chat is opened", () => {
    const { result, rerender } = setup(1);
    act(() => result.current.start());
    act(() => result.current.search("lunch"));

    rerender({ id: 2 });

    expect(result.current.open).toBe(false);
    expect(result.current.query).toBe("");
  });
});

function SearchHarness({ onShow }: { onShow: (id: number) => void }) {
  const search = useMessageSearch(1, MESSAGES, onShow);
  return search.open ? (
    <ChatSearchBar search={search} />
  ) : (
    <button type="button" onClick={search.start}>
      open
    </button>
  );
}

describe("ChatSearchBar", () => {
  it("counts matches and moves to older ones with Enter", async () => {
    const onShow = vi.fn();
    renderWithProviders(<SearchHarness onShow={onShow} />);
    await userEvent.click(screen.getByRole("button", { name: "open" }));

    await userEvent.type(screen.getByRole("searchbox", { name: "Search in chat" }), "lunch");
    expect(screen.getByText("1 of 3")).toBeInTheDocument();

    await userEvent.keyboard("{Enter}");
    expect(screen.getByText("2 of 3")).toBeInTheDocument();
    expect(onShow).toHaveBeenLastCalledWith(3);
  });

  it("says when nothing matches and closes on Escape", async () => {
    renderWithProviders(<SearchHarness onShow={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "open" }));

    await userEvent.type(screen.getByRole("searchbox"), "dinner");
    expect(screen.getByText("No results")).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  });
});
