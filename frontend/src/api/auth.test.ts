import { beforeEach, describe, expect, it, vi } from "vitest";
import { login } from "./auth";
import { ACCESS_TOKEN_KEY, api } from "./client";

const TOKENS = { accessToken: "access", refreshToken: "refresh" };

describe("login", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.spyOn(api, "post").mockResolvedValue({ data: TOKENS });
  });

  it("keeps a remembered session where it survives a restart", async () => {
    await login({ userName: "petya", password: "Secret1", rememberMe: true });

    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBe("access");
  });

  it("keeps a plain session only for this tab", async () => {
    await login({ userName: "petya", password: "Secret1", rememberMe: false });

    expect(sessionStorage.getItem(ACCESS_TOKEN_KEY)).toBe("access");
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
  });
});
