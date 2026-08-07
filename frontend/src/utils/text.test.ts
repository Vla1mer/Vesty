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

  it("stops at the limit", () => {
    expect(insertAtSelection("123456789", "ab", 9, 9, LIMIT)).toEqual({
      value: "123456789a",
      caret: 10,
    });
  });

  it("keeps the caret inside the clipped text", () => {
    const { value, caret } = insertAtSelection("1234567890", "ab", 10, 10, LIMIT);

    expect(value).toHaveLength(LIMIT);
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
