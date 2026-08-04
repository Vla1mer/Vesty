import { describe, expect, it } from "vitest";
import { getApiErrorMessage, parseApiErrors } from "./apiError";

function axiosError(data: unknown) {
  return { response: { data } };
}

describe("parseApiErrors", () => {
  it("maps identity error keys onto form fields", () => {
    const parsed = parseApiErrors(
      axiosError({ DuplicateUserName: ["Name is taken."] }),
      "fallback"
    );

    expect(parsed.fieldErrors).toEqual({ userName: "Name is taken." });
    expect(parsed.generalError).toBeUndefined();
  });

  it("joins several messages for the same field", () => {
    const parsed = parseApiErrors(
      axiosError({
        PasswordTooShort: ["Too short."],
        PasswordRequiresDigit: ["Needs a digit."],
      }),
      "fallback"
    );

    expect(parsed.fieldErrors.password).toBe("Too short. Needs a digit.");
  });

  it("keeps unknown keys as a general error", () => {
    const parsed = parseApiErrors(
      axiosError({ Something: ["Went wrong."] }),
      "fallback"
    );

    expect(parsed.fieldErrors).toEqual({});
    expect(parsed.generalError).toBe("Went wrong.");
  });

  it("reads the exception handler shape", () => {
    const parsed = parseApiErrors(
      axiosError({ StatusCode: 403, Message: "Not allowed." }),
      "fallback"
    );

    expect(parsed.generalError).toBe("Not allowed.");
  });

  it("falls back when the payload carries nothing usable", () => {
    expect(parseApiErrors(axiosError(null), "fallback").generalError).toBe(
      "fallback"
    );
    expect(parseApiErrors({}, "fallback").generalError).toBe("fallback");
  });

  it("reads the RTK Query shape where data sits at the top level", () => {
    const parsed = parseApiErrors({ data: { Message: "From baseQuery." } }, "f");

    expect(parsed.generalError).toBe("From baseQuery.");
  });
});

describe("getApiErrorMessage", () => {
  it("returns the fallback when nothing is parsed", () => {
    expect(getApiErrorMessage(undefined, "Could not save")).toBe(
      "Could not save"
    );
  });

  it("combines field errors with the general one", () => {
    const message = getApiErrorMessage(
      axiosError({ UserName: ["Taken."], Other: ["Also broken."] }),
      "fallback"
    );

    expect(message).toBe("Taken. Also broken.");
  });
});
