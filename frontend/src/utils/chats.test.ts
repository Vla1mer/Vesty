import { describe, expect, it } from "vitest";
import { getChatDisplayName } from "./chats";
import type { ChatDto, DirectChatDto } from "../types/api";

function chat(overrides: Partial<ChatDto> = {}): ChatDto {
  return {
    id: 1,
    name: null,
    description: null,
    whoCanInvite: 2,
    whoCanEdit: 2,
    whoCanPost: 3,
    creatorId: 1,
    isPrivate: false,
    createdAt: "2026-01-01T00:00:00Z",
    lastMessageContent: null,
    lastMessageSenderName: null,
    lastMessageSenderId: null,
    lastMessageAt: null,
    unreadCount: 0,
    avatarUpdatedAt: null,
    ...overrides,
  } as ChatDto;
}

describe("getChatDisplayName", () => {
  it("prefers the group name", () => {
    expect(getChatDisplayName(chat({ name: "Team" }))).toBe("Team");
  });

  it("uses the partner name for a direct chat", () => {
    const direct = chat({
      isPrivate: true,
      partnerUserName: "vlad",
    } as Partial<DirectChatDto>);

    expect(getChatDisplayName(direct)).toBe("vlad");
  });

  it("falls back when a direct chat has no partner", () => {
    expect(getChatDisplayName(chat({ isPrivate: true }))).toBe("Direct chat");
  });

  it("falls back to the id for an unnamed group", () => {
    expect(getChatDisplayName(chat({ id: 42 }))).toBe("Chat #42");
  });
});
