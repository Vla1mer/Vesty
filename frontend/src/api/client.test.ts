import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  clearTokens,
  getAccessToken,
  getFreshAccessToken,
  getRefreshToken,
  saveTokens,
} from "./client";

const TOKENS = { accessToken: "access", refreshToken: "refresh" };

function tokenExpiringIn(seconds: number): string {
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + seconds }));
  return `header.${payload}.signature`;
}

describe("token storage", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("keeps a remembered login across browser restarts", () => {
    saveTokens(TOKENS, true);

    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBe("access");
    expect(sessionStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
  });

  it("drops a login that was not remembered when the tab closes", () => {
    saveTokens(TOKENS, false);

    expect(sessionStorage.getItem(REFRESH_TOKEN_KEY)).toBe("refresh");
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
  });

  it("reads the tokens wherever they were kept", () => {
    saveTokens(TOKENS, false);

    expect(getAccessToken()).toBe("access");
    expect(getRefreshToken()).toBe("refresh");
  });

  it("refreshes the tokens where the session already lives", () => {
    saveTokens(TOKENS, false);

    saveTokens({ accessToken: "fresh", refreshToken: "fresh-refresh" });

    expect(sessionStorage.getItem(ACCESS_TOKEN_KEY)).toBe("fresh");
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
  });

  it("refreshes a remembered session in place", () => {
    saveTokens(TOKENS, true);

    saveTokens({ accessToken: "fresh", refreshToken: "fresh-refresh" });

    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBe("fresh");
    expect(sessionStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
  });

  it("never leaves a copy behind when the choice changes", () => {
    saveTokens(TOKENS, true);

    saveTokens(TOKENS, false);

    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
    expect(sessionStorage.getItem(ACCESS_TOKEN_KEY)).toBe("access");
  });

  it("lets this tab keep its own session when another tab is remembered", () => {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, "mine");
    localStorage.setItem(ACCESS_TOKEN_KEY, "somebody-else");

    expect(getAccessToken()).toBe("mine");
  });

  it("falls back to the remembered session when this tab has none", () => {
    localStorage.setItem(ACCESS_TOKEN_KEY, "remembered");

    expect(getAccessToken()).toBe("remembered");
  });

  describe("getFreshAccessToken", () => {
    afterEach(() => vi.restoreAllMocks());

    it("hands out a token that is still good", async () => {
      const token = tokenExpiringIn(600);
      saveTokens({ accessToken: token, refreshToken: "refresh" }, true);
      const post = vi.spyOn(axios, "post");

      expect(await getFreshAccessToken()).toBe(token);
      expect(post).not.toHaveBeenCalled();
    });

    it("renews a token that has run out", async () => {
      saveTokens({ accessToken: tokenExpiringIn(-10), refreshToken: "refresh" }, true);
      vi.spyOn(axios, "post").mockResolvedValue({
        data: { accessToken: "renewed", refreshToken: "renewed-refresh" },
      });

      expect(await getFreshAccessToken()).toBe("renewed");
      expect(getAccessToken()).toBe("renewed");
    });

    it("gives nothing away when renewal fails", async () => {
      saveTokens({ accessToken: tokenExpiringIn(-10), refreshToken: "refresh" }, true);
      vi.spyOn(axios, "post").mockRejectedValue(new Error("nope"));

      expect(await getFreshAccessToken()).toBe("");
    });

    it("asks for nothing when nobody is signed in", async () => {
      const post = vi.spyOn(axios, "post");

      expect(await getFreshAccessToken()).toBe("");
      expect(post).not.toHaveBeenCalled();
    });
  });

  it("signs the user out of both storages", () => {
    saveTokens(TOKENS, true);
    sessionStorage.setItem(ACCESS_TOKEN_KEY, "leftover");

    clearTokens();

    expect(getAccessToken()).toBeNull();
  });
});
