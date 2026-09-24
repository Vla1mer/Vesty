import { beforeEach, describe, expect, it } from "vitest";
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from "./client";

const TOKENS = { accessToken: "access", refreshToken: "refresh" };

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

  it("signs the user out of both storages", () => {
    saveTokens(TOKENS, true);
    sessionStorage.setItem(ACCESS_TOKEN_KEY, "leftover");

    clearTokens();

    expect(getAccessToken()).toBeNull();
  });
});
