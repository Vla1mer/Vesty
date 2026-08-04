import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { signalrMock } from "../test/signalrMock";

vi.mock("../lib/signalr", () => signalrMock);

import { ChatDetailPage } from "./ChatDetailPage";
import { fakeToken, renderWithProviders } from "../test/renderWithProviders";
import { installServer, requests, resetServer, stub, stubJson } from "../test/server";

const ME = 1;
const CHAT_ID = 5;

const chat = {
  id: CHAT_ID,
  name: "Team",
  description: null,
  whoCanInvite: 2,
  whoCanEdit: 2,
  whoCanPost: 3,
  creatorId: ME,
  isPrivate: false,
  createdAt: "2026-01-01T00:00:00Z",
  lastMessageContent: null,
  lastMessageSenderName: null,
  lastMessageSenderId: null,
  lastMessageAt: null,
  unreadCount: 0,
  avatarUpdatedAt: null,
};

const members = [
  { userId: ME, userName: "vlad", name: null, surname: null, roleId: 1, avatarUpdatedAt: null },
  { userId: 2, userName: "petya", name: null, surname: null, roleId: 3, avatarUpdatedAt: null },
];

function message(id: number, userId: number, content: string) {
  return {
    id,
    chatId: CHAT_ID,
    userId,
    userName: userId === ME ? "vlad" : "petya",
    content,
    createdAt: "2026-01-02T10:00:00Z",
    isEdited: false,
    pinnedAt: null,
    replyTo: null,
    reactions: [],
    attachments: [],
  };
}

function renderChat() {
  return renderWithProviders(<ChatDetailPage />, {
    route: `/chats/${CHAT_ID}`,
    path: "/chats/:id",
  });
}

describe("ChatDetailPage", () => {
  beforeEach(() => {
    resetServer();
    installServer();
    localStorage.setItem("accessToken", fakeToken(ME, "vlad"));

    stubJson("get", `/api/Chat/${CHAT_ID}`, chat);
    stubJson("get", `/api/Chat/${CHAT_ID}/users`, members);
    stubJson("get", `/api/Chat/${CHAT_ID}/messages`, [
      message(10, 2, "hello there"),
      message(11, ME, "my own line"),
    ]);
    stubJson("get", "/api/Block", []);
    stubJson("post", `/api/Chat/${CHAT_ID}/read`, {});
  });

  it("shows the messages of the chat", async () => {
    renderChat();

    expect(await screen.findByText("hello there")).toBeInTheDocument();
    expect(screen.getByText("my own line")).toBeInTheDocument();
  });

  it("sends what was typed and clears the box", async () => {
    stub("post", `/api/Message/${CHAT_ID}/messages`, () => message(12, ME, "new one"));
    renderChat();

    const box = await screen.findByPlaceholderText("Type a message...");
    await userEvent.type(box, "new one");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      const sent = requests.find((r) => r.url === `/api/Message/${CHAT_ID}/messages`);
      expect(sent?.data).toMatchObject({ content: "new one" });
    });
    expect(box).toHaveValue("");
  });

  it("keeps the send button off while the box is empty", async () => {
    renderChat();

    await screen.findByPlaceholderText("Type a message...");
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });

  it("refuses to send blank space", async () => {
    renderChat();

    const box = await screen.findByPlaceholderText("Type a message...");
    await userEvent.type(box, "   ");

    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    expect(requests.some((r) => r.url === `/api/Message/${CHAT_ID}/messages`)).toBe(false);
  });

  it("marks the chat as read on entry", async () => {
    renderChat();

    await waitFor(() =>
      expect(requests.some((r) => r.url === `/api/Chat/${CHAT_ID}/read`)).toBe(true)
    );
  });

  it("reports a failed send and keeps the text", async () => {
    stub("post", `/api/Message/${CHAT_ID}/messages`, () => {
      throw Object.assign(new Error("nope"), {
        response: { status: 403, data: { Message: "You cannot post here." } },
      });
    });
    renderChat();

    const box = await screen.findByPlaceholderText("Type a message...");
    await userEvent.type(box, "blocked line");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText(/cannot post here/i)).toBeInTheDocument();
    expect(box).toHaveValue("blocked line");
  });

  it("opens the chat info from the header", async () => {
    renderChat();

    await userEvent.click(await screen.findByRole("button", { name: /Team/ }));

    const dialog = await screen.findByRole("dialog", { name: "Chat info" });
    expect(within(dialog).getByText("Team")).toBeInTheDocument();
  });
});
