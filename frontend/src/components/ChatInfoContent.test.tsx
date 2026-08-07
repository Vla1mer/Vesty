import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { ChatInfoContent } from "./ChatInfoContent";
import { renderWithProviders, signIn } from "../test/renderWithProviders";
import { installServer, resetServer, stubJson } from "../test/server";
import { ChatPermission, UserRole } from "../types/api";
import type { ChatDto, ChatMemberWithRoleDto } from "../types/api";

const ME = 1;
const CHAT_ID = 42;

const GROUP: ChatDto = {
  id: CHAT_ID,
  name: "Team",
  description: null,
  isPrivate: false,
  creatorId: ME,
  createdAt: "2026-01-01T10:00:00Z",
  whoCanInvite: ChatPermission.Members,
  whoCanEdit: ChatPermission.Admins,
  whoCanPost: ChatPermission.Members,
  avatarUpdatedAt: null,
  unreadCount: 0,
};

function member(userId: number, userName: string, roleId: number) {
  return {
    userId,
    userName,
    roleId,
    avatarUpdatedAt: null,
  } as ChatMemberWithRoleDto;
}

function open(online: number[] = []) {
  stubJson("get", `/api/User/presence/(${[ME, 7].join(",")})`, [
    { userId: ME, isOnline: online.includes(ME), lastSeenAt: null },
    { userId: 7, isOnline: online.includes(7), lastSeenAt: null },
  ]);
  stubJson("get", `/api/Chat/${CHAT_ID}/users`, [
    member(ME, "me", UserRole.Owner),
    member(7, "petya", UserRole.User),
  ]);
  stubJson("get", "/api/User", []);
  return renderWithProviders(
    <Routes>
      <Route
        path="/chats/:id/info"
        element={<ChatInfoContent chat={GROUP} onOpenSettings={vi.fn()} />}
      />
      <Route path="/users/:userId" element={<p>profile screen</p>} />
    </Routes>,
    { route: `/chats/${CHAT_ID}/info` }
  );
}

describe("ChatInfoContent", () => {
  beforeEach(() => {
    resetServer();
    installServer();
    signIn(ME, "me");
  });

  it("lists the members", async () => {
    open();

    expect(await screen.findByText("petya")).toBeInTheDocument();
  });

  it("marks a member who is online", async () => {
    open([7]);

    expect(await screen.findByLabelText("petya is online")).toBeInTheDocument();
    expect(screen.queryByLabelText("me is online")).toBeNull();
  });

  it("leaves everyone unmarked when nobody is online", async () => {
    open();

    await screen.findByText("petya");
    expect(screen.queryByLabelText("petya is online")).toBeNull();
  });

  it("opens the profile of a member", async () => {
    open();

    await userEvent.click(
      await screen.findByRole("button", { name: "Open the profile of petya" })
    );

    expect(await screen.findByText("profile screen")).toBeInTheDocument();
  });
});
