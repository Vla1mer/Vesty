import { describe, expect, it } from "vitest";
import { isStandaloneEmoji } from "./emoji";

describe("isStandaloneEmoji", () => {
  it.each(["🔥", "🔥🔥", "🔥🔥🔥", "👍🏽", "👨‍👩‍👧", "🔥 🎉", "  🔥  "])(
    "treats %s as a standalone emoji",
    (text) => {
      expect(isStandaloneEmoji(text)).toBe(true);
    }
  );

  it("stops after three", () => {
    expect(isStandaloneEmoji("🔥🔥🔥🔥")).toBe(false);
  });

  it("counts a family as one", () => {
    expect(isStandaloneEmoji("👨‍👩‍👧👨‍👩‍👧👨‍👩‍👧")).toBe(true);
  });

  it.each(["hi 🔥", "🔥 hi", "hello", "123", "#", "*", ""])(
    "leaves %s in a normal bubble",
    (text) => {
      expect(isStandaloneEmoji(text)).toBe(false);
    }
  );

  it("does not mistake digits for emoji", () => {
    expect(isStandaloneEmoji("1")).toBe(false);
    expect(isStandaloneEmoji("2026")).toBe(false);
  });

  it("survives no content at all", () => {
    expect(isStandaloneEmoji(null)).toBe(false);
    expect(isStandaloneEmoji(undefined)).toBe(false);
    expect(isStandaloneEmoji("   ")).toBe(false);
  });
});
