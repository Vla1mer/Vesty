import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPersistedStore } from "./persistedStore";

function numberStore(key: string, fallback = 10) {
  return createPersistedStore<number>(
    key,
    fallback,
    (raw) => {
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : null;
    },
    String
  );
}

describe("createPersistedStore", () => {
  beforeEach(() => localStorage.clear());

  it("starts from the fallback when nothing is stored", () => {
    expect(numberStore("a").getSnapshot()).toBe(10);
  });

  it("reads a stored value", () => {
    localStorage.setItem("b", "42");
    expect(numberStore("b").getSnapshot()).toBe(42);
  });

  it("falls back when the stored value cannot be decoded", () => {
    localStorage.setItem("c", "not-a-number");
    expect(numberStore("c").getSnapshot()).toBe(10);
  });

  it("persists and notifies on set", () => {
    const store = numberStore("d");
    const listener = vi.fn();
    store.subscribe(listener);

    store.set(7);

    expect(store.getSnapshot()).toBe(7);
    expect(localStorage.getItem("d")).toBe("7");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("stays quiet when the value does not change", () => {
    const store = numberStore("e");
    const listener = vi.fn();
    store.subscribe(listener);

    store.set(10);

    expect(listener).not.toHaveBeenCalled();
  });

  it("re-reads storage when the first listener arrives", () => {
    const store = numberStore("f");
    localStorage.setItem("f", "99");

    store.subscribe(vi.fn());

    expect(store.getSnapshot()).toBe(99);
  });

  it("picks up a write from another tab", () => {
    const store = numberStore("g");
    const listener = vi.fn();
    store.subscribe(listener);

    localStorage.setItem("g", "5");
    window.dispatchEvent(new StorageEvent("storage", { key: "g" }));

    expect(store.getSnapshot()).toBe(5);
    expect(listener).toHaveBeenCalled();
  });

  it("drops the storage listener once nobody is subscribed", () => {
    const store = numberStore("h");
    const remove = vi.spyOn(window, "removeEventListener");

    const unsubscribe = store.subscribe(vi.fn());
    unsubscribe();

    expect(remove).toHaveBeenCalledWith("storage", expect.any(Function));
  });
});
