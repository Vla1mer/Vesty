import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useMessageSelection } from "./useMessageSelection";
import type { MessageDto } from "../types/api";

const ME = 1;

function message(id: number, userId: number, content: string | null = "text") {
  return { id, userId, content } as MessageDto;
}

const messages = [
  message(10, ME, "mine"),
  message(11, 2, "theirs"),
  message(12, ME, "mine again"),
];

function setup() {
  return renderHook(() => useMessageSelection(messages, ME));
}

describe("useMessageSelection", () => {
  it("starts empty and out of selection mode", () => {
    const { result } = setup();

    expect(result.current.mode).toBe(false);
    expect(result.current.ids.size).toBe(0);
    expect(result.current.ownIds).toEqual([]);
  });

  it("enters selection mode once something is picked", () => {
    const { result } = setup();

    act(() => result.current.start(10));

    expect(result.current.mode).toBe(true);
    expect(result.current.selected).toHaveLength(1);
  });

  it("toggles the same message off", () => {
    const { result } = setup();

    act(() => result.current.start(10));
    act(() => result.current.toggle(10));

    expect(result.current.mode).toBe(false);
  });

  it("reports only the messages owned by the current user", () => {
    const { result } = setup();

    act(() => result.current.start(10));
    act(() => result.current.toggle(11));
    act(() => result.current.toggle(12));

    expect(result.current.ids.size).toBe(3);
    expect(result.current.ownIds).toEqual([10, 12]);
  });

  it("clears everything", () => {
    const { result } = setup();

    act(() => result.current.start(10));
    act(() => result.current.clear());

    expect(result.current.mode).toBe(false);
  });

  it("copies the picked text and drops the selection", () => {
    const writeText = vi.fn();
    Object.assign(navigator, { clipboard: { writeText } });
    const { result } = setup();

    act(() => result.current.start(10));
    act(() => result.current.toggle(11));
    act(() => result.current.copy());

    expect(writeText).toHaveBeenCalledWith("mine\ntheirs");
    expect(result.current.mode).toBe(false);
  });

  it("survives a message without text", () => {
    const writeText = vi.fn();
    Object.assign(navigator, { clipboard: { writeText } });
    const { result } = renderHook(() =>
      useMessageSelection([message(20, ME, null)], ME)
    );

    act(() => result.current.start(20));
    act(() => result.current.copy());

    expect(writeText).not.toHaveBeenCalled();
  });
});
