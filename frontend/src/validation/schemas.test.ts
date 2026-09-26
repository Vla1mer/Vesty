import { describe, expect, it } from "vitest";
import { ValidationError } from "yup";
import { registerSchema } from "./authSchemas";
import { profileSchema } from "./profileSchema";
import { chatNameSchema } from "./chatSchemas";
import { createTranslate } from "../i18n/translations";

const inEnglish = createTranslate("en");
const inPolish = createTranslate("pl");

async function complaintAbout(check: Promise<unknown>): Promise<string> {
  try {
    await check;
  } catch (error) {
    return (error as ValidationError).message;
  }
  throw new Error("The value was accepted, so there is nothing to report");
}

describe("form checks speak the chosen language", () => {
  it("asks for a username", async () => {
    expect(
      await complaintAbout(registerSchema(inEnglish).validateAt("userName", { userName: "" }))
    ).toBe("Username is required");
    expect(
      await complaintAbout(registerSchema(inPolish).validateAt("userName", { userName: "" }))
    ).toBe("Nazwa użytkownika jest wymagana");
  });

  it("counts the characters of a name", async () => {
    const tooLong = { name: "n".repeat(101) };

    expect(await complaintAbout(profileSchema(inEnglish).validateAt("name", tooLong))).toBe(
      "Maximum length is 100 characters"
    );
    expect(await complaintAbout(profileSchema(inPolish).validateAt("name", tooLong))).toBe(
      "Maksymalna długość to 100 znaków"
    );
  });

  it("asks for a chat name", async () => {
    expect(await complaintAbout(chatNameSchema(inEnglish).validate({ name: "  " }))).toBe(
      "Chat name is required"
    );
    expect(await complaintAbout(chatNameSchema(inPolish).validate({ name: "  " }))).toBe(
      "Nazwa czatu jest wymagana"
    );
  });

  it("refuses a birthday in the future", async () => {
    const future = { birthday: "2999-01-01" };

    expect(await complaintAbout(profileSchema(inPolish).validateAt("birthday", future))).toBe(
      "Data urodzenia nie może być w przyszłości"
    );
  });
});
