import { describe, expect, it } from "vitest";
import {
  formatDateSeparator,
  formatLastSeen,
  formatListTime,
  formatTime,
} from "./date";
import { createTranslate } from "../i18n/translations";

const inEnglish = createTranslate("en");
const inPolish = createTranslate("pl");

function yesterdayAtNoon(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  date.setHours(12, 0, 0, 0);
  return date.toISOString();
}

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(12, 0, 0, 0);
  return date.toISOString();
}

function monthsAgo(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date.toISOString();
}

describe("formatLastSeen", () => {
  it("gives the time for today", () => {
    const today = new Date();
    today.setHours(9, 5, 0, 0);

    expect(formatLastSeen(today.toISOString(), "en", inEnglish)).toBe("last seen at 09:05");
  });

  it("says yesterday", () => {
    expect(formatLastSeen(yesterdayAtNoon(), "en", inEnglish)).toMatch(/^last seen yesterday at /);
  });

  it("gives the day for anything older", () => {
    expect(formatLastSeen(daysAgo(10), "en", inEnglish)).toMatch(/^last seen on /);
  });

  it("speaks Polish when asked", () => {
    const today = new Date();
    today.setHours(9, 5, 0, 0);

    expect(formatLastSeen(today.toISOString(), "pl", inPolish)).toBe(
      "ostatnio widziany o 09:05"
    );
  });
});

describe("dates follow the chosen language", () => {
  it("names the month in English", () => {
    expect(formatListTime(monthsAgo(3), "en", inEnglish)).toMatch(
      /^\d{1,2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/
    );
  });

  it("names the month in Polish", () => {
    expect(formatListTime(monthsAgo(3), "pl", inPolish)).toMatch(
      /^\d{1,2} [a-ząćęłńóśźż]{3,}/
    );
  });

  it("separates the days in the chosen language", () => {
    expect(formatDateSeparator(yesterdayAtNoon(), "en", inEnglish)).toBe("Yesterday");
    expect(formatDateSeparator(yesterdayAtNoon(), "pl", inPolish)).toBe("Wczoraj");
  });

  it("keeps the clock on twenty-four hours", () => {
    const evening = new Date();
    evening.setHours(19, 5, 0, 0);

    expect(formatTime(evening.toISOString(), "en")).toBe("19:05");
    expect(formatTime(evening.toISOString(), "pl")).toBe("19:05");
  });
});
