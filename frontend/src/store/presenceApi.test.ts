import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/signalr", async () => (await import("../test/signalrMock")).signalrMock);

import { signalrMock } from "../test/signalrMock";
import { makeStore } from "./store";
import { presenceApi } from "./presenceApi";
import { installServer, requests, resetServer, stubJson } from "../test/server";
import type { UserPresenceDto } from "../types/api";

type Listener = (payload: never) => void;

function emit<T>(source: { mock: { calls: unknown[][] } }, payload: T) {
  source.mock.calls.forEach((call) => (call[0] as Listener)(payload as never));
}

function presence(userId: number, isOnline: boolean, lastSeenAt?: string): UserPresenceDto {
  return { userId, isOnline, lastSeenAt: lastSeenAt ?? null };
}

async function load(ids: number[], answer: UserPresenceDto[]) {
  stubJson("get", `/api/User/presence/(${ids.join(",")})`, answer);
  const store = makeStore();
  const subscription = store.dispatch(presenceApi.endpoints.getPresence.initiate(ids));
  await subscription;
  return { store, subscription };
}

function cached(store: ReturnType<typeof makeStore>, ids: number[]) {
  return presenceApi.endpoints.getPresence.select(ids)(store.getState()).data ?? [];
}

describe("presenceApi", () => {
  beforeEach(() => {
    resetServer();
    installServer();
  });

  it("asks for the users it was given", async () => {
    await load([7, 3], [presence(7, true), presence(3, false)]);

    expect(requests.some((r) => r.url === "/api/User/presence/(7,3)")).toBe(true);
  });

  it("keeps what the server answered", async () => {
    const { store } = await load([7], [presence(7, true)]);

    expect(cached(store, [7])[0].isOnline).toBe(true);
  });

  it("shares one cache entry whatever the order of the ids", async () => {
    const { store } = await load([7, 3], [presence(7, true), presence(3, false)]);

    expect(
      presenceApi.endpoints.getPresence.select([3, 7])(store.getState()).data
    ).toHaveLength(2);
  });

  it("turns a user online when told so", async () => {
    const { store } = await load([7], [presence(7, false)]);

    emit(signalrMock.onPresenceChanged, presence(7, true));

    expect(cached(store, [7])[0].isOnline).toBe(true);
  });

  it("turns a user offline and remembers when", async () => {
    const { store } = await load([7], [presence(7, true)]);

    emit(signalrMock.onPresenceChanged, presence(7, false, "2026-08-07T10:00:00Z"));

    const [entry] = cached(store, [7]);
    expect(entry.isOnline).toBe(false);
    expect(entry.lastSeenAt).toBe("2026-08-07T10:00:00Z");
  });

  it("ignores news about somebody it does not track", async () => {
    const { store } = await load([7], [presence(7, false)]);

    emit(signalrMock.onPresenceChanged, presence(99, true));

    expect(cached(store, [7])).toHaveLength(1);
    expect(cached(store, [7])[0].isOnline).toBe(false);
  });

  it("leaves the others alone", async () => {
    const { store } = await load([7, 3], [presence(7, false), presence(3, false)]);

    emit(signalrMock.onPresenceChanged, presence(7, true));

    const entries = cached(store, [7, 3]);
    expect(entries.find((p) => p.userId === 7)?.isOnline).toBe(true);
    expect(entries.find((p) => p.userId === 3)?.isOnline).toBe(false);
  });
});
