import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/signalr", async () => (await import("../test/signalrMock")).signalrMock);

import { signalrMock } from "../test/signalrMock";
import { makeStore } from "./store";
import { chatApi } from "./chatApi";
import { installServer, requests, resetServer, stub, stubJson } from "../test/server";
import { signIn } from "../test/renderWithProviders";
import { setActiveChat } from "../lib/activeChat";
import type { ChatDto, MessageDto } from "../types/api";

const ME = 1;

type Listener = (payload: never) => void;
type Subscribable = { mock: { calls: unknown[][] } };

function emit<T>(source: Subscribable, payload: T) {
  source.mock.calls.forEach((call) => (call[0] as Listener)(payload as never));
}

function chat(id: number, overrides: Partial<ChatDto> = {}): ChatDto {
  return {
    id,
    name: `Chat ${id}`,
    description: null,
    isPrivate: false,
    creatorId: ME,
    createdAt: "2026-01-01T10:00:00Z",
    whoCanInvite: 3,
    whoCanEdit: 2,
    whoCanPost: 3,
    avatarUpdatedAt: null,
    unreadCount: 0,
    ...overrides,
  } as ChatDto;
}

function message(chatId: number, userId: number): MessageDto {
  return {
    id: 500,
    chatId,
    userId,
    userName: "petya",
    content: "hello",
    createdAt: "2026-02-01T12:00:00Z",
    isEdited: false,
  };
}

async function loadChats(chats: ChatDto[]) {
  stubJson("get", "/api/Chat", chats);
  const store = makeStore();
  const subscription = store.dispatch(chatApi.endpoints.getChats.initiate());
  await subscription;
  return { store, subscription };
}

function chatList(store: ReturnType<typeof makeStore>) {
  return chatApi.endpoints.getChats.select()(store.getState()).data ?? [];
}

describe("chatApi", () => {
  beforeEach(() => {
    resetServer();
    installServer();
    signIn(ME, "user1");
    setActiveChat(null);
  });

  afterEach(() => {
    setActiveChat(null);
  });

  describe("the chat list", () => {
    it("puts the most recently active chat first", async () => {
      const { store } = await loadChats([
        chat(1, { lastMessageAt: "2026-01-02T10:00:00Z" }),
        chat(2, { lastMessageAt: "2026-03-02T10:00:00Z" }),
        chat(3, { lastMessageAt: "2026-02-02T10:00:00Z" }),
      ]);

      expect(chatList(store).map((c) => c.id)).toEqual([2, 3, 1]);
    });

    it("falls back to when the chat was created", async () => {
      const { store } = await loadChats([
        chat(1, { createdAt: "2026-01-01T10:00:00Z" }),
        chat(2, { createdAt: "2026-05-01T10:00:00Z" }),
      ]);

      expect(chatList(store).map((c) => c.id)).toEqual([2, 1]);
    });
  });

  describe("keeping the list live", () => {
    it("shows a chat created elsewhere", async () => {
      const { store } = await loadChats([chat(1)]);

      emit(signalrMock.onChatCreated, chat(7));

      expect(chatList(store).map((c) => c.id)).toEqual([7, 1]);
    });

    it("does not duplicate a chat that is already listed", async () => {
      const { store } = await loadChats([chat(1)]);

      emit(signalrMock.onChatCreated, chat(1));

      expect(chatList(store)).toHaveLength(1);
    });

    it("drops a chat deleted elsewhere", async () => {
      const { store } = await loadChats([chat(1), chat(2)]);

      emit(signalrMock.onChatDeleted, { chatId: 1 });

      expect(chatList(store).map((c) => c.id)).toEqual([2]);
    });

    it("leaves the list alone when an unknown chat is deleted", async () => {
      const { store } = await loadChats([chat(1)]);

      emit(signalrMock.onChatDeleted, { chatId: 99 });

      expect(chatList(store)).toHaveLength(1);
    });

    it("renames a chat in place", async () => {
      const { store } = await loadChats([chat(1), chat(2)]);

      emit(signalrMock.onChatRenamed, { chatId: 2, name: "Renamed" });

      expect(chatList(store).find((c) => c.id === 2)?.name).toBe("Renamed");
      expect(chatList(store).map((c) => c.id)).toEqual([1, 2]);
    });
  });

  describe("when a message arrives", () => {
    it("moves the chat to the top and shows the new preview", async () => {
      const { store } = await loadChats([
        chat(1, { lastMessageAt: "2026-03-01T10:00:00Z" }),
        chat(2, { lastMessageAt: "2026-01-01T10:00:00Z" }),
      ]);

      emit(signalrMock.onMessageReceived, message(2, 5));

      const [first] = chatList(store);
      expect(first.id).toBe(2);
      expect(first.lastMessageContent).toBe("hello");
      expect(first.lastMessageSenderId).toBe(5);
      expect(first.lastMessageSenderName).toBe("petya");
    });

    it("counts it as unread", async () => {
      const { store } = await loadChats([chat(1, { unreadCount: 2 })]);

      emit(signalrMock.onMessageReceived, message(1, 5));

      expect(chatList(store)[0].unreadCount).toBe(3);
    });

    it("does not count my own message", async () => {
      const { store } = await loadChats([chat(1, { unreadCount: 2 })]);

      emit(signalrMock.onMessageReceived, message(1, ME));

      expect(chatList(store)[0].unreadCount).toBe(2);
    });

    it("does not count a message in the chat I am reading", async () => {
      const { store } = await loadChats([chat(1, { unreadCount: 2 })]);
      setActiveChat(1);

      emit(signalrMock.onMessageReceived, message(1, 5));

      expect(chatList(store)[0].unreadCount).toBe(2);
    });

    it("ignores a message for a chat that is not listed", async () => {
      const { store } = await loadChats([
        chat(1, { lastMessageAt: "2026-03-01T10:00:00Z" }),
        chat(2, { lastMessageAt: "2026-01-01T10:00:00Z" }),
      ]);

      emit(signalrMock.onMessageReceived, message(99, 5));

      expect(chatList(store).map((c) => c.id)).toEqual([1, 2]);
      expect(chatList(store).every((c) => c.lastMessageContent === undefined)).toBe(
        true
      );
    });
  });

  describe("marking a chat read", () => {
    it("clears the badge before the server answers", async () => {
      stubJson("post", "/api/Chat/1/read", {});
      const { store } = await loadChats([chat(1, { unreadCount: 4 })]);

      await store.dispatch(chatApi.endpoints.markChatRead.initiate(1));

      expect(chatList(store)[0].unreadCount).toBe(0);
    });

    it("puts the badge back when the request fails", async () => {
      stub("post", "/api/Chat/1/read", () => {
        throw Object.assign(new Error("nope"), {
          response: { status: 500, data: { Message: "Server error" } },
        });
      });
      const { store } = await loadChats([chat(1, { unreadCount: 4 })]);

      await store.dispatch(chatApi.endpoints.markChatRead.initiate(1));

      expect(chatList(store)[0].unreadCount).toBe(4);
    });
  });

  describe("reloading after a change", () => {
    function callsTo(method: string, url: string) {
      return requests.filter(
        (r) => r.method.toUpperCase() === method.toUpperCase() && r.url === url
      ).length;
    }

    it("reloads the list when a chat is created", async () => {
      stubJson("post", "/api/Chat", chat(2));
      const { store } = await loadChats([chat(1)]);
      const before = callsTo("get", "/api/Chat");

      await store.dispatch(
        chatApi.endpoints.createChat.initiate({
          name: "New",
          members: [],
        } as never)
      );

      await vi.waitFor(() => expect(callsTo("get", "/api/Chat")).toBe(before + 1));
    });

    it("reloads the list when a chat is renamed", async () => {
      stubJson("put", "/api/Chat/1", {});
      const { store } = await loadChats([chat(1)]);
      const before = callsTo("get", "/api/Chat");

      await store.dispatch(
        chatApi.endpoints.renameChat.initiate({
          chatId: 1,
          name: "Renamed",
          description: null,
        })
      );

      await vi.waitFor(() => expect(callsTo("get", "/api/Chat")).toBe(before + 1));
    });

    it("reloads the members when someone is removed", async () => {
      stubJson("get", "/api/Chat/1/users", []);
      stubJson("delete", "/api/Chat/1/users/5", {});
      const store = makeStore();
      const members = store.dispatch(
        chatApi.endpoints.getChatMembers.initiate(1)
      );
      await members;
      const before = callsTo("get", "/api/Chat/1/users");

      await store.dispatch(
        chatApi.endpoints.removeChatMember.initiate({ chatId: 1, userId: 5 })
      );

      await vi.waitFor(() =>
        expect(callsTo("get", "/api/Chat/1/users")).toBe(before + 1)
      );
      members.unsubscribe();
    });

    it("reloads the invite after it is revoked", async () => {
      stubJson("get", "/api/Chat/1/invite", { code: "abc" });
      stubJson("delete", "/api/Chat/1/invite", {});
      const store = makeStore();
      const invite = store.dispatch(chatApi.endpoints.getChatInvite.initiate(1));
      await invite;
      const before = callsTo("get", "/api/Chat/1/invite");

      await store.dispatch(chatApi.endpoints.revokeChatInvite.initiate(1));

      await vi.waitFor(() =>
        expect(callsTo("get", "/api/Chat/1/invite")).toBe(before + 1)
      );
      invite.unsubscribe();
    });
  });

  describe("invite links", () => {
    it("reads an empty body as no invite", async () => {
      stubJson("get", "/api/Chat/1/invite", "");
      const store = makeStore();

      await store.dispatch(chatApi.endpoints.getChatInvite.initiate(1));

      expect(
        chatApi.endpoints.getChatInvite.select(1)(store.getState()).data
      ).toBeNull();
    });
  });
});
