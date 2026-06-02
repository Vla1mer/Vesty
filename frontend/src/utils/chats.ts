import { isDirectChat } from "../types/api";
import type { ChatDto } from "../types/api";

export function getChatDisplayName(chat: ChatDto): string {
  if (chat.name) return chat.name;
  if (isDirectChat(chat)) return chat.partnerUserName ?? "Direct chat";
  return `Chat #${chat.id}`;
}
