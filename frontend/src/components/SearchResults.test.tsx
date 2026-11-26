import { beforeEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { SearchResults } from "./SearchResults";
import { renderWithProviders, signIn } from "../test/renderWithProviders";
import { installServer, resetServer, stubJson } from "../test/server";
import type { DirectChatDto } from "../types/api";

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

describe("SearchResults", () => {
  beforeEach(() => {
    resetServer();
    installServer();
    signIn(1, "testu2");
  });

  it("shows a found chat like the chat list does", async () => {
    stubJson("get", "/api/User", []);
    renderWithProviders(
      <SearchResults query="test" chats={[DIRECT_CHAT]} isChatOnline={() => false} />
    );

    expect(screen.getByText("testu1")).toBeInTheDocument();
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("shows a found person with an avatar", async () => {
    stubJson("get", "/api/User", [
      { id: 7, userName: "petya", name: "Petya", surname: "Ivanov", avatarUpdatedAt: null },
    ]);
    renderWithProviders(
      <SearchResults query="pet" chats={[]} isChatOnline={() => false} />
    );

    expect(await screen.findByText("petya")).toBeInTheDocument();
    expect(screen.getByText("PI")).toBeInTheDocument();
  });
});
