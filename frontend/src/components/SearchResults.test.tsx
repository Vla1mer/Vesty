import { beforeEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { SearchResults } from "./SearchResults";
import { renderWithProviders, signIn } from "../test/renderWithProviders";
import { installServer, requests, resetServer, stubJson } from "../test/server";
import type { DirectChatDto, FriendDto } from "../types/api";

const DIRECT_CHAT: DirectChatDto = {
  id: 3,
  name: null,
  whoCanInvite: 2,
  whoCanEdit: 2,
  whoCanPost: 3,
  creatorId: 1,
  isPrivate: true,
  createdAt: "2026-11-26T13:00:00Z",
  lastMessageContent: "Hello",
  lastMessageSenderId: 1,
  lastMessageAt: "2026-11-26T13:47:00Z",
  partnerUserName: "testu1",
  partnerUserId: 2,
};

const friend = (userId: number, userName: string, name?: string): FriendDto => ({
  userId,
  userName,
  name,
  surname: null,
  avatarUpdatedAt: null,
  status: 2,
  isIncoming: false,
  createdAt: "2026-11-26T12:00:00Z",
});

const renderSearch = (query: string, chats: DirectChatDto[] = []) =>
  renderWithProviders(
    <SearchResults query={query} chats={chats} isChatOnline={() => false} />
  );

describe("SearchResults", () => {
  beforeEach(() => {
    resetServer();
    installServer();
    signIn(1, "testu2");
  });

  it("shows a found chat like the chat list does", () => {
    stubJson("get", "/api/Friend", []);
    renderSearch("test", [DIRECT_CHAT]);

    expect(screen.getByText("testu1")).toBeInTheDocument();
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("finds a friend by username or by name", async () => {
    stubJson("get", "/api/Friend", [friend(7, "petya", "Piotr")]);
    renderSearch("piot");

    expect(await screen.findByText("petya")).toBeInTheDocument();
  });

  it("does not list a friend twice when a chat with them exists", async () => {
    stubJson("get", "/api/Friend", [friend(2, "testu1")]);
    renderSearch("testu1", [DIRECT_CHAT]);

    await screen.findByText("Hello");
    expect(screen.getAllByText("testu1")).toHaveLength(1);
  });

  it("does not look up people who are not friends", async () => {
    stubJson("get", "/api/Friend", []);
    renderSearch("t");

    expect(await screen.findByText('No matches for "t"')).toBeInTheDocument();
    expect(requests.some((r) => r.url === "/api/User")).toBe(false);
  });
});
