import { afterEach, describe, expect, it, vi } from "vitest";
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

  describe("without Intl.Segmenter", () => {
    afterEach(() => {
      vi.unstubAllGlobals();
      vi.resetModules();
    });

    async function withoutSegmenter() {
      vi.stubGlobal("Intl", { ...Intl, Segmenter: undefined });
      vi.resetModules();
      return (await import("./emoji")).isStandaloneEmoji;
    }

    it("still counts a family as one", async () => {
      const check = await withoutSegmenter();

      expect(check("\u{1F468}‍\u{1F469}‍\u{1F467}")).toBe(true);
    });

    it("still counts a skin tone as one", async () => {
      const check = await withoutSegmenter();

      expect(check("\u{1F44D}\u{1F3FD}")).toBe(true);
    });

    it("still stops after three", async () => {
      const check = await withoutSegmenter();

      expect(check("\u{1F525}\u{1F525}\u{1F525}\u{1F525}")).toBe(false);
    });
  });

  it("survives no content at all", () => {
    expect(isStandaloneEmoji(null)).toBe(false);
    expect(isStandaloneEmoji(undefined)).toBe(false);
    expect(isStandaloneEmoji("   ")).toBe(false);
  });
});
