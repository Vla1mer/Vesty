let activeChatId: number | null = null;

export function setActiveChat(id: number | null) {
  activeChatId = id;
}

export function getActiveChat(): number | null {
  return activeChatId;
}
