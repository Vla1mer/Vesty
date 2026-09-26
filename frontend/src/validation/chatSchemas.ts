import * as Yup from "yup";
import type { Translate } from "../context/languageContextInternal";

export const CHAT_NAME_LIMIT = 100;
export const CHAT_DESCRIPTION_LIMIT = 255;

export function chatNameSchema(t: Translate) {
  return Yup.object({
    name: Yup.string()
      .trim()
      .required(t("check.chatNameRequired"))
      .max(CHAT_NAME_LIMIT, t("check.maxLength", { max: CHAT_NAME_LIMIT })),
  });
}
