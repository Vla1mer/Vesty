import { afterEach, describe, expect, it, vi } from "vitest";
import { LANGUAGE_STORAGE_KEY, readStoredLanguage } from "./languageContextInternal";

function speaking(...languages: string[]) {
  vi.spyOn(navigator, "languages", "get").mockReturnValue(languages);
}

describe("readStoredLanguage", () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("uses the language chosen last time", () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "pl");
    speaking("en-US");

    expect(readStoredLanguage()).toBe("pl");
  });

  it("falls back to the language of the browser", () => {
    speaking("pl-PL", "en-US");

    expect(readStoredLanguage()).toBe("pl");
  });

  it("still asks the browser when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage is blocked");
    });
    speaking("pl-PL");

    expect(readStoredLanguage()).toBe("pl");
  });

  it("settles on English for a language we do not speak", () => {
    speaking("de-DE", "fr-FR");

    expect(readStoredLanguage()).toBe("en");
  });
});
