import { useSyncExternalStore } from "react";
import { createPersistedStore } from "../lib/persistedStore";

export const CHAT_LIST_MIN_WIDTH = 280;
export const CHAT_LIST_MAX_WIDTH = 560;
export const CHAT_LIST_DEFAULT_WIDTH = 384;

export function clampChatListWidth(width: number): number {
  return Math.min(CHAT_LIST_MAX_WIDTH, Math.max(CHAT_LIST_MIN_WIDTH, Math.round(width)));
}

const store = createPersistedStore<number>(
  "vesty.chat-list-width",
  CHAT_LIST_DEFAULT_WIDTH,
  (raw) => {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? clampChatListWidth(parsed) : null;
  },
  (value) => String(value)
);

export const setChatListWidth = (width: number) =>
  store.set(clampChatListWidth(width));

export function useChatListWidth(): number {
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  );
}
