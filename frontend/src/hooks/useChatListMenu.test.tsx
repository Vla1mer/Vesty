import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/signalr", async () => (await import("../test/signalrMock")).signalrMock);

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { Route, Routes, useLocation } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { useChatListMenu } from "./useChatListMenu";
import { ChatListItem } from "../components/ChatListItem";
import { renderWithProviders, signIn } from "../test/renderWithProviders";
import { installServer, requests, resetServer, stub, stubJson } from "../test/server";
import type { ChatDto, DirectChatDto } from "../types/api";

const ME = 1;

const DIRECT: DirectChatDto = {
  id: 3,
  name: null,
  whoCanInvite: 2,
  whoCanEdit: 2,
  whoCanPost: 3,
  creatorId: ME,
  isPrivate: true,
  createdAt: "2026-11-26T12:00:00Z",
  unreadCount: 0,
  partnerUserName: "petya",
  partnerUserId: 7,
};

const GROUP: ChatDto = {
  id: 5,
  name: "Team",
  whoCanInvite: 2,
  whoCanEdit: 2,
  whoCanPost: 3,
  creatorId: 9,
  isPrivate: false,
  createdAt: "2026-11-26T12:00:00Z",
  unreadCount: 0,
};

function ChatList({ chats }: { chats: ChatDto[] }) {
  const { triggerRef, openFor, openChatId, element } = useChatListMenu();
  return (
    <div ref={triggerRef} className="overflow-y-auto">
      {chats.map((chat) => (
        <ChatListItem
          key={chat.id}
          chat={chat}
          onOpenMenu={(x, y) => openFor(chat, x, y)}
          menuOpen={openChatId === chat.id}
        />
      ))}
      {element}
    </div>
  );
}

const sent = (method: string, url: string) =>
  requests.some((r) => r.method.toLowerCase() === method && r.url === url);

const pastClickGuard = () => new Promise((resolve) => setTimeout(resolve, 450));

function rightClick(name: string) {
  fireEvent.pointerDown(screen.getByText(name), { pointerType: "mouse" });
  fireEvent.contextMenu(screen.getByText(name), { clientX: 40, clientY: 40 });
}

function CurrentPath() {
  return <p data-testid="path">{useLocation().pathname}</p>;
}

describe("chat list menu", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    resetServer();
    installServer();
    signIn(ME, "me");
    stubJson("get", "/api/Block", []);
  });

  it("offers the direct chat actions on right click", async () => {
    renderWithProviders(<ChatList chats={[DIRECT]} />);

    rightClick("petya");

    expect(await screen.findByRole("button", { name: /View profile/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Block user/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Delete for me/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Mark as read/ })).not.toBeInTheDocument();
  });

  it("marks an unread chat as read", async () => {
    stubJson("post", "/api/Chat/3/read", {});
    renderWithProviders(<ChatList chats={[{ ...DIRECT, unreadCount: 4 }]} />);

    rightClick("petya");
    await screen.findByRole("button", { name: /Mark as read/ });
    await pastClickGuard();
    await userEvent.click(await screen.findByRole("button", { name: /Mark as read/ }));

    await waitFor(() => expect(sent("post", "/api/Chat/3/read")).toBe(true));
  });

  it("offers to unblock someone already blocked", async () => {
    stubJson("get", "/api/Block", [{ userId: 7, userName: "petya", blockedAt: "2026-11-26T12:00:00Z" }]);
    renderWithProviders(<ChatList chats={[DIRECT]} />);

    rightClick("petya");

    expect(await screen.findByRole("button", { name: /Unblock/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Block user/ })).not.toBeInTheDocument();
  });

  it("asks before deleting a chat for me", async () => {
    renderWithProviders(<ChatList chats={[DIRECT]} />);

    rightClick("petya");
    await screen.findByRole("button", { name: /Delete for me/ });
    await pastClickGuard();
    await userEvent.click(await screen.findByRole("button", { name: /Delete for me/ }));

    expect(await screen.findByText("Delete for me?")).toBeInTheDocument();
    expect(sent("delete", "/api/Chat/3/for-me")).toBe(false);
  });

  it("lets a group member leave", async () => {
    stubJson("get", "/api/Chat/5/users", [{ userId: ME, userName: "me", roleId: 3 }]);
    renderWithProviders(<ChatList chats={[GROUP]} />);

    rightClick("Team");

    expect(await screen.findByRole("button", { name: /Leave chat/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Delete chat/ })).not.toBeInTheDocument();
  });

  it("lets the group owner delete the group", async () => {
    stubJson("get", "/api/Chat/5/users", [{ userId: ME, userName: "me", roleId: 1 }]);
    renderWithProviders(<ChatList chats={[GROUP]} />);

    rightClick("Team");

    expect(await screen.findByRole("button", { name: /Delete chat/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Leave chat/ })).not.toBeInTheDocument();
  });

  it("opens the menu on a long press", async () => {
    vi.useFakeTimers();
    renderWithProviders(<ChatList chats={[DIRECT]} />);
    const item = screen.getByText("petya");

    fireEvent.touchStart(item, { touches: [{ clientX: 30, clientY: 30 }] });
    await vi.advanceTimersByTimeAsync(600);
    fireEvent.touchEnd(item);

    expect(screen.getByRole("button", { name: /Delete for me/ })).toBeInTheDocument();
  });

  it("keeps the menu open when the long press ends in a click", async () => {
    vi.useFakeTimers();
    renderWithProviders(<ChatList chats={[DIRECT]} />);
    const item = screen.getByText("petya");

    fireEvent.touchStart(item, { touches: [{ clientX: 30, clientY: 30 }] });
    await vi.advanceTimersByTimeAsync(900);
    fireEvent.touchEnd(item);
    fireEvent.click(item);

    expect(screen.getByRole("button", { name: /Delete for me/ })).toBeInTheDocument();
  });

  it("offers neither leaving nor deleting while the roles are unknown", async () => {
    stub("get", "/api/Chat/5/users", () => {
      throw Object.assign(new Error("down"), { response: { status: 500, data: {} } });
    });
    renderWithProviders(<ChatList chats={[{ ...GROUP, unreadCount: 2 }]} />);

    rightClick("Team");

    await screen.findByRole("button", { name: /Mark as read/ });
    expect(screen.queryByRole("button", { name: /Leave chat/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Delete chat/ })).not.toBeInTheDocument();
  });

  it("stays in another open chat whose id starts the same way", async () => {
    stubJson("delete", "/api/Chat/3/for-me", {});
    renderWithProviders(
      <Routes>
        <Route
          path="/chats/:chatId"
          element={
            <>
              <ChatList chats={[DIRECT]} />
              <CurrentPath />
            </>
          }
        />
      </Routes>,
      { route: "/chats/30" }
    );

    rightClick("petya");
    await screen.findByRole("button", { name: /Delete for me/ });
    await pastClickGuard();
    await userEvent.click(screen.getByRole("button", { name: /Delete for me/ }));
    await userEvent.click(await screen.findByRole("button", { name: "Delete" }));

    await waitFor(() => expect(sent("delete", "/api/Chat/3/for-me")).toBe(true));
    expect(screen.getByTestId("path")).toHaveTextContent("/chats/30");
  });
});
