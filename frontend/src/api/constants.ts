// RTK Query cache tag types, grouped per API. Values must match the strings
// registered in apiSlice's `tagTypes`.
export enum CHAT_API_TAGS {
  CHAT = "Chat",
  CHAT_MEMBER = "ChatMember",
}

export enum MESSAGE_API_TAGS {
  MESSAGE = "Message",
}

export enum USER_API_TAGS {
  USER = "User",
}

// Shared special tag id for "the whole collection" invalidation.
export const TAG_ID = {
  LIST: "LIST",
} as const;
