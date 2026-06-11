import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import type { MessageDto } from "../types/api";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5005";
const HUB_URL = `${API_URL}/chatHub`;

const MESSAGE_RECEIVED = "MessageReceived";

type MessageHandler = (message: MessageDto) => void;

let connection: HubConnection | null = null;

// Handler registry survives connection rebuilds (logout/login).
const messageHandlers = new Set<MessageHandler>();

function buildConnection(token: string): HubConnection {
  const conn = new HubConnectionBuilder()
    .withUrl(HUB_URL, {
      accessTokenFactory: () => token,
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();

  conn.on(MESSAGE_RECEIVED, (message: MessageDto) => {
    messageHandlers.forEach((handler) => handler(message));
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

/**
 * Subscribe to incoming messages. Returns an unsubscribe function
 * suitable for a useEffect cleanup.
 */
export function onMessageReceived(handler: MessageHandler): () => void {
  messageHandlers.add(handler);
  return () => {
    messageHandlers.delete(handler);
  };
}

export function getConnection(): HubConnection | null {
  return connection;
}

export function isConnected(): boolean {
  return connection?.state === HubConnectionState.Connected;
}
