import { CHAT_API_TAGS, MESSAGE_API_TAGS, TAG_ID } from "../api/constants";

export const chatListTag = { type: CHAT_API_TAGS.CHAT, id: TAG_ID.LIST };

export const chatTag = (chatId: number) => ({
  type: CHAT_API_TAGS.CHAT,
  id: chatId,
});

export const memberTag = (chatId: number) => ({
  type: CHAT_API_TAGS.CHAT_MEMBER,
  id: chatId,
});

export const inviteTag = (chatId: number) => ({
  type: CHAT_API_TAGS.CHAT_INVITE,
  id: chatId,
});

export const chatMessagesTag = (chatId: number) => ({
  type: MESSAGE_API_TAGS.MESSAGE,
  id: chatId,
});
