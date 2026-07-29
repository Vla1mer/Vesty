import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import type {
  ChatDto,
  ChatDeletedSignalrDto,
  ChatRenamedSignalrDto,
  MessageDto,
  MessageDeletedSignalrDto,
  MessageReactionsSignalrDto,
  MessagePinnedSignalrDto,
  UserTypingSignalrDto,
} from "../types/api";

const API_URL = import.meta.env.VITE_API_URL ?? "https://localhost:7033";
const HUB_URL = `${API_URL}/chatHub`;

type Handler<T> = (payload: T) => void;

interface HubEvent<T> {
  name: string;
  handlers: Set<Handler<T>>;
}

function createEvent<T>(name: string): HubEvent<T> {
  return { name, handlers: new Set() };
}

const messageReceived = createEvent<MessageDto>("MessageReceived");
const messageUpdated = createEvent<MessageDto>("MessageUpdated");
const messageReactionsUpdated = createEvent<MessageReactionsSignalrDto>(
  "MessageReactionsUpdated"
);
const messagePinned = createEvent<MessagePinnedSignalrDto>("MessagePinned");
const messageDeleted = createEvent<MessageDeletedSignalrDto>("MessageDeleted");
const chatCreated = createEvent<ChatDto>("ChatCreated");
const chatDeleted = createEvent<ChatDeletedSignalrDto>("ChatDeleted");
const chatRenamed = createEvent<ChatRenamedSignalrDto>("ChatRenamed");
const userTyping = createEvent<UserTypingSignalrDto>("UserTyping");
const reconnected = createEvent<void>("reconnected");

function subscribe<T>(event: HubEvent<T>) {
  return (handler: Handler<T>): (() => void) => {
    event.handlers.add(handler);
    return () => {
      event.handlers.delete(handler);
    };
  };
}

export const onMessageReceived = subscribe(messageReceived);
export const onMessageUpdated = subscribe(messageUpdated);
export const onMessageReactionsUpdated = subscribe(messageReactionsUpdated);
export const onMessagePinned = subscribe(messagePinned);
export const onMessageDeleted = subscribe(messageDeleted);
export const onChatCreated = subscribe(chatCreated);
export const onChatDeleted = subscribe(chatDeleted);
export const onChatRenamed = subscribe(chatRenamed);
export const onUserTyping = subscribe(userTyping);
export const onReconnected = subscribe(reconnected);

let connection: HubConnection | null = null;

function attach<T>(conn: HubConnection, event: HubEvent<T>): void {
  conn.on(event.name, (payload: T) => {
    event.handlers.forEach((handler) => handler(payload));
  });
}

function buildConnection(token: string): HubConnection {
  const conn = new HubConnectionBuilder()
    .withUrl(HUB_URL, {
      accessTokenFactory: () => token,
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();

  attach(conn, messageReceived);
  attach(conn, messageUpdated);
  attach(conn, messageDeleted);
  attach(conn, chatCreated);
  attach(conn, chatDeleted);
  attach(conn, chatRenamed);
  attach(conn, userTyping);

  conn.onreconnected(() => {
    console.log("[SignalR] Reconnected");
    reconnected.handlers.forEach((handler) => handler());
  });

  return conn;
}

export async function startConnection(token: string): Promise<void> {
  if (connection && connection.state !== HubConnectionState.Disconnected) {
    return;
  }

  connection = buildConnection(token);

  try {
    await connection.start();
    console.log("[SignalR] Connected");
  } catch (err) {
    console.error("[SignalR] Connection failed:", err);
    connection = null;
    throw err;
  }
}

export async function stopConnection(): Promise<void> {
  if (!connection) return;

  try {
    await connection.stop();
    console.log("[SignalR] Disconnected");
  } finally {
    connection = null;
  }
}

export function getConnection(): HubConnection | null {
  return connection;
}

export function isConnected(): boolean {
  return connection?.state === HubConnectionState.Connected;
}

export function sendTyping(chatId: number): void {
  if (connection?.state !== HubConnectionState.Connected) return;
  connection.invoke("Typing", chatId).catch(() => {});
}
