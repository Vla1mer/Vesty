import { vi } from "vitest";

const noop = () => () => {};

export const signalrMock = {
  onMessageReceived: vi.fn(noop),
  onMessageUpdated: vi.fn(noop),
  onMessageReactionsUpdated: vi.fn(noop),
  onMessagePinned: vi.fn(noop),
  onMessageDeleted: vi.fn(noop),
  onChatCreated: vi.fn(noop),
  onChatDeleted: vi.fn(noop),
  onChatRenamed: vi.fn(noop),
  onChatUpdated: vi.fn(noop),
  onUserTyping: vi.fn(noop),
  onFriendRequestReceived: vi.fn(noop),
  onFriendshipAccepted: vi.fn(noop),
  onFriendshipRemoved: vi.fn(noop),
  onReconnected: vi.fn(noop),
  startConnection: vi.fn(async () => {}),
  stopConnection: vi.fn(async () => {}),
  sendTyping: vi.fn(),
  getConnection: vi.fn(() => null),
  isConnected: vi.fn(() => false),
};
