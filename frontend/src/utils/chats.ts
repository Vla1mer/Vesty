import type { ChatDto } from "../types/api";

export function getChatDisplayName(chat: ChatDto): string {
  if (chat.name) return chat.name;
  if (chat.isPrivate) return chat.partnerUserName ?? "Direct chat";
  return `Chat #${chat.id}`;
}
