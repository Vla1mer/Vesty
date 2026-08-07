import { describe, expect, it } from "vitest";
import { formatLastSeen } from "./date";

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
