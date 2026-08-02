import * as Yup from "yup";

export const CHAT_NAME_LIMIT = 100;
export const CHAT_DESCRIPTION_LIMIT = 255;

export const chatNameSchema = Yup.object({
  name: Yup.string()
    .trim()
    .required("Chat name is required")
    .max(CHAT_NAME_LIMIT, `Maximum length is ${CHAT_NAME_LIMIT} characters`),
});
