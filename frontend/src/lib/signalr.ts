import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5005";
const HUB_URL = `${API_URL}/chatHub`;

let connection: HubConnection | null = null;

function buildConnection(token: string): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(HUB_URL, {
      accessTokenFactory: () => token,
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();
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
