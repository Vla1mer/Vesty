import { beforeEach, describe, expect, it, vi } from "vitest";

const captured: { accessTokenFactory?: () => string } = {};

const hub = {
  on: vi.fn(),
  onreconnected: vi.fn(),
  start: vi.fn(async () => {}),
  stop: vi.fn(async () => {}),
  state: "Disconnected",
};

vi.mock("@microsoft/signalr", () => {
  class HubConnectionBuilder {
    withUrl(_url: string, options: { accessTokenFactory: () => string }) {
      captured.accessTokenFactory = options.accessTokenFactory;
      return this;
    }
    withAutomaticReconnect() {
      return this;
    }
    configureLogging() {
      return this;
    }
    build() {
      return hub;
    }
  }

  return {
    HubConnection: class {},
    HubConnectionBuilder,
    HubConnectionState: { Disconnected: "Disconnected", Connected: "Connected" },
    LogLevel: { Warning: 2 },
  };
});

import { startConnection, stopConnection } from "./signalr";
import { ACCESS_TOKEN_KEY } from "../api/client";

describe("startConnection", () => {
  beforeEach(async () => {
    await stopConnection();
    localStorage.clear();
    captured.accessTokenFactory = undefined;
  });

  it("signs in to the hub with the stored token", async () => {
    localStorage.setItem(ACCESS_TOKEN_KEY, "first-token");

    await startConnection();

    expect(captured.accessTokenFactory!()).toBe("first-token");
  });

  it("picks up a refreshed token when reconnecting", async () => {
    localStorage.setItem(ACCESS_TOKEN_KEY, "first-token");
    await startConnection();

    localStorage.setItem(ACCESS_TOKEN_KEY, "second-token");

    expect(captured.accessTokenFactory!()).toBe("second-token");
  });

  it("survives a missing token", async () => {
    await startConnection();

    expect(captured.accessTokenFactory!()).toBe("");
  });
});
