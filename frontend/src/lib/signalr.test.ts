import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";

const captured: { accessTokenFactory?: () => Promise<string> } = {};

const hub = {
  on: vi.fn(),
  onreconnected: vi.fn(),
  start: vi.fn(async () => {}),
  stop: vi.fn(async () => {}),
  state: "Disconnected",
};

vi.mock("@microsoft/signalr", () => {
  class HubConnectionBuilder {
    withUrl(_url: string, options: { accessTokenFactory: () => Promise<string> }) {
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
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "../api/client";

function liveToken(name: string): string {
  return tokenValidFor(600, name);
}

function tokenValidFor(seconds: number, name: string): string {
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + seconds, name }));
  return `header.${payload}.signature`;
}

describe("startConnection", () => {
  beforeEach(async () => {
    await stopConnection();
    localStorage.clear();
    captured.accessTokenFactory = undefined;
  });

  afterEach(() => vi.restoreAllMocks());

  it("signs in to the hub with the stored token", async () => {
    const token = liveToken("first");
    localStorage.setItem(ACCESS_TOKEN_KEY, token);

    await startConnection();

    expect(await captured.accessTokenFactory!()).toBe(token);
  });

  it("picks up a refreshed token when reconnecting", async () => {
    localStorage.setItem(ACCESS_TOKEN_KEY, liveToken("first"));
    await startConnection();

    const renewed = liveToken("second");
    localStorage.setItem(ACCESS_TOKEN_KEY, renewed);

    expect(await captured.accessTokenFactory!()).toBe(renewed);
  });

  it("renews an expired token before reconnecting", async () => {
    localStorage.setItem(ACCESS_TOKEN_KEY, liveToken("first"));
    await startConnection();

    localStorage.setItem(ACCESS_TOKEN_KEY, tokenValidFor(-10, "stale"));
    localStorage.setItem(REFRESH_TOKEN_KEY, "refresh");
    vi.spyOn(axios, "post").mockResolvedValue({
      data: { accessToken: "renewed", refreshToken: "renewed-refresh" },
    });

    expect(await captured.accessTokenFactory!()).toBe("renewed");
  });

  it("survives a missing token", async () => {
    await startConnection();

    expect(await captured.accessTokenFactory!()).toBe("");
  });
});
