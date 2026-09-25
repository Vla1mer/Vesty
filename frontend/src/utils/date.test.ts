import { describe, expect, it } from "vitest";
import {
  formatDateSeparator,
  formatLastSeen,
  formatListTime,
  formatTime,
} from "./date";

function at(hoursAgo: number): string {
  return new Date(Date.now() - hoursAgo * 3600_000).toISOString();
}

describe("formatLastSeen", () => {
  it("gives the time for today", () => {
    const today = new Date();
    today.setHours(9, 5, 0, 0);

    expect(formatLastSeen(today.toISOString())).toMatch(/^last seen at /);
  });

  it("says yesterday", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(12, 0, 0, 0);

    expect(formatLastSeen(yesterday.toISOString())).toMatch(/^last seen yesterday at /);
  });

  it("gives a date for anything older", () => {
    expect(formatLastSeen(at(24 * 10))).toMatch(/^last seen on /);
  });

  it("keeps the year off a recent date", () => {
    const thisYear = new Date();
    thisYear.setMonth(0, 15);
    thisYear.setHours(12, 0, 0, 0);
    const shown = formatLastSeen(thisYear.toISOString());

    if (!shown.startsWith("last seen on ")) return;
    expect(shown).not.toMatch(/\d{4}/);
  });
});

describe("English dates whatever the browser speaks", () => {
  it("names the month in English in the last seen line", () => {
    const longAgo = new Date();
    longAgo.setMonth(longAgo.getMonth() - 3);

    expect(formatLastSeen(longAgo.toISOString())).toMatch(
      /^last seen on \d{1,2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/
    );
  });

  it("names the month in English in the date separator", () => {
    const longAgo = new Date();
    longAgo.setMonth(longAgo.getMonth() - 3);

    expect(formatDateSeparator(longAgo.toISOString())).toMatch(
      /^\d{1,2} (January|February|March|April|May|June|July|August|September|October|November|December)/
    );
  });

  it("names the month in English in the chat list", () => {
    const longAgo = new Date();
    longAgo.setMonth(longAgo.getMonth() - 3);

    expect(formatListTime(longAgo.toISOString())).toMatch(
      /^\d{1,2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/
    );
  });

  it("keeps the clock on twenty-four hours", () => {
    const morning = new Date();
    morning.setHours(19, 5, 0, 0);

    expect(formatTime(morning.toISOString())).toBe("19:05");
  });
});
