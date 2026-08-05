import { describe, expect, it, vi } from "vitest";
import { whileCached } from "./whileCached";

function deferred<T = void>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("whileCached", () => {
  it("waits for the data before subscribing", async () => {
    const loaded = deferred();
    const removed = deferred();
    const subscribe = vi.fn(() => []);

    const run = whileCached(
      { cacheDataLoaded: loaded.promise, cacheEntryRemoved: removed.promise },
      subscribe
    );

    expect(subscribe).not.toHaveBeenCalled();

    loaded.resolve();
    await Promise.resolve();
    expect(subscribe).toHaveBeenCalledOnce();

    removed.resolve();
    await run;
  });

  it("keeps the subscriptions until the entry is dropped", async () => {
    const removed = deferred();
    const unsubscribe = vi.fn();

    const run = whileCached(
      { cacheDataLoaded: Promise.resolve(), cacheEntryRemoved: removed.promise },
      () => [unsubscribe]
    );

    await Promise.resolve();
    expect(unsubscribe).not.toHaveBeenCalled();

    removed.resolve();
    await run;

    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it("releases every subscription", async () => {
    const removed = deferred();
    const first = vi.fn();
    const second = vi.fn();

    const run = whileCached(
      { cacheDataLoaded: Promise.resolve(), cacheEntryRemoved: removed.promise },
      () => [first, second]
    );

    removed.resolve();
    await run;

    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
  });

  it("never subscribes when the entry goes before the data arrives", async () => {
    const loaded = deferred();
    const subscribe = vi.fn(() => []);

    const run = whileCached(
      { cacheDataLoaded: loaded.promise, cacheEntryRemoved: deferred().promise },
      subscribe
    );

    loaded.reject(new Error("entry removed"));

    await expect(run).rejects.toThrow("entry removed");
    expect(subscribe).not.toHaveBeenCalled();
  });

  it("still releases the subscriptions when the entry fails", async () => {
    const removed = deferred();
    const unsubscribe = vi.fn();

    const run = whileCached(
      { cacheDataLoaded: Promise.resolve(), cacheEntryRemoved: removed.promise },
      () => [unsubscribe]
    );

    await Promise.resolve();
    removed.reject(new Error("torn down"));

    await expect(run).rejects.toThrow("torn down");
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
