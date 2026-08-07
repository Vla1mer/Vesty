import { describe, expect, it } from "vitest";
import { insertAtSelection } from "./text";

const LIMIT = 10;

describe("insertAtSelection", () => {
  it("puts the text where the caret is", () => {
    expect(insertAtSelection("ac", "b", 1, 1, LIMIT)).toEqual({
      value: "abc",
      caret: 2,
    });
  });

  it("appends when the caret sits at the end", () => {
    expect(insertAtSelection("ab", "c", 2, 2, LIMIT)).toEqual({
      value: "abc",
      caret: 3,
    });
  });

  it("replaces the selected range", () => {
    expect(insertAtSelection("abcd", "X", 1, 3, LIMIT)).toEqual({
      value: "aXd",
      caret: 2,
    });
  });

  it("inserts what exactly fits", () => {
    expect(insertAtSelection("123456789", "a", 9, 9, LIMIT)).toEqual({
      value: "123456789a",
      caret: 10,
    });
  });

  it("inserts nothing rather than a piece of it", () => {
    expect(insertAtSelection("123456789", "ab", 9, 9, LIMIT)).toEqual({
      value: "123456789",
      caret: 9,
    });
  });

  it("never leaves half of an emoji behind", () => {
    const value = "x".repeat(LIMIT - 1);

    const { value: next } = insertAtSelection(value, "🔥", LIMIT - 1, LIMIT - 1, LIMIT);

    expect(next).toBe(value);
    expect(next.length).toBeLessThanOrEqual(LIMIT);
    expect([...next].every((c) => c.codePointAt(0)! < 0xd800)).toBe(true);
  });

  it("keeps an emoji that fits whole", () => {
    const value = "x".repeat(LIMIT - 2);

    const { value: next, caret } = insertAtSelection(
      value,
      "🔥",
      LIMIT - 2,
      LIMIT - 2,
      LIMIT
    );

    expect(next).toBe(`${value}🔥`);
    expect(next).toHaveLength(LIMIT);
    expect(caret).toBe(LIMIT);
  });

  it("survives a caret beyond the text", () => {
    expect(insertAtSelection("ab", "c", 99, 99, LIMIT)).toEqual({
      value: "abc",
      caret: 3,
    });
  });

  it("normalises a backwards range", () => {
    expect(insertAtSelection("abcd", "X", 3, 1, LIMIT)).toEqual({
      value: "aXd",
      caret: 2,
    });
  });
});
