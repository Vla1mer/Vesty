import { afterEach, describe, expect, it, vi } from "vitest";
import { LANGUAGE_STORAGE_KEY, readStoredLanguage } from "./languageContextInternal";

describe("readStoredLanguage", () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("uses the language chosen last time", () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "pl");

    expect(readStoredLanguage(["en-US"])).toBe("pl");
  });

  it("falls back to the language of the browser", () => {
    expect(readStoredLanguage(["pl-PL", "en-US"])).toBe("pl");
  });

  it("still asks the browser when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage is blocked");
    });

    expect(readStoredLanguage(["pl-PL"])).toBe("pl");
  });

  it("settles on English for a language we do not speak", () => {
    expect(readStoredLanguage(["de-DE", "fr-FR"])).toBe("en");
  });

  it("settles on English when the browser names nothing", () => {
    expect(readStoredLanguage([])).toBe("en");
  });
});
