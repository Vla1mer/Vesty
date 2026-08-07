import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/signalr", async () => (await import("../test/signalrMock")).signalrMock);

import { signalrMock } from "../test/signalrMock";
import { makeStore } from "./store";
import { messageApi } from "./messageApi";
import { installServer, resetServer, stubJson } from "../test/server";
import type { MessageDto } from "../types/api";

const CHAT_ID = 42;

type Listener = (payload: never) => void;

function emit<T>(source: { mock: { calls: unknown[][] } }, payload: T) {
  source.mock.calls.forEach((call) => (call[0] as Listener)(payload as never));
}

function message(id: number, overrides: Partial<MessageDto> = {}): MessageDto {
  return {
    id,
    chatId: CHAT_ID,
    userId: 5,
    userName: "petya",
    content: `message ${id}`,
    createdAt: "2026-01-01T10:00:00Z",
    isEdited: false,
    ...overrides,
  };
}

async function load(messages: MessageDto[]) {
  stubJson("get", `/api/Chat/${CHAT_ID}/messages`, messages);
  const store = makeStore();
  const subscription = store.dispatch(
    messageApi.endpoints.getMessagesByChat.initiate(CHAT_ID)
  );
  await subscription;
  return { store, subscription };
}

function cached(store: ReturnType<typeof makeStore>) {
  return (
    messageApi.endpoints.getMessagesByChat.select(CHAT_ID)(store.getState()).data ?? []
  );
}

describe("messageApi live updates", () => {
  beforeEach(() => {
    resetServer();
    installServer();
  });

  it("adds a message that arrives", async () => {
    const { store } = await load([message(1)]);

    emit(signalrMock.onMessageReceived, message(2));

    expect(cached(store).map((m) => m.id)).toEqual([1, 2]);
  });

  it("does not add the same message twice", async () => {
    const { store } = await load([message(1)]);

    emit(signalrMock.onMessageReceived, message(1));

    expect(cached(store)).toHaveLength(1);
  });

  it("ignores a message for another chat", async () => {
    const { store } = await load([message(1)]);

    emit(signalrMock.onMessageReceived, message(2, { chatId: 999 }));

    expect(cached(store)).toHaveLength(1);
  });

  it("replaces a message that was edited", async () => {
    const { store } = await load([message(1)]);

    emit(
      signalrMock.onMessageUpdated,
      message(1, { content: "edited", isEdited: true })
    );

    expect(cached(store)[0].content).toBe("edited");
    expect(cached(store)[0].isEdited).toBe(true);
  });

  it("ignores an edit made in another chat", async () => {
    const { store } = await load([message(1)]);

    emit(
      signalrMock.onMessageUpdated,
      message(1, { chatId: 999, content: "edited elsewhere" })
    );

    expect(cached(store)[0].content).toBe("message 1");
  });

  it("drops a message that was deleted", async () => {
    const { store } = await load([message(1), message(2)]);

    emit(signalrMock.onMessageDeleted, { chatId: CHAT_ID, messageId: 1 });

    expect(cached(store).map((m) => m.id)).toEqual([2]);
  });

  it("keeps a deletion meant for another chat", async () => {
    const { store } = await load([message(1)]);

    emit(signalrMock.onMessageDeleted, { chatId: 999, messageId: 1 });

    expect(cached(store)).toHaveLength(1);
  });

  it("puts new reactions on the message", async () => {
    const { store } = await load([message(1)]);

    emit(signalrMock.onMessageReactionsUpdated, {
      chatId: CHAT_ID,
      messageId: 1,
      reactions: [{ emoji: "🔥", userIds: [5] }],
    });

    expect(cached(store)[0].reactions).toEqual([{ emoji: "🔥", userIds: [5] }]);
  });
});
