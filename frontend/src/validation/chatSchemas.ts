import * as Yup from "yup";

export const chatNameSchema = Yup.object({
  name: Yup.string()
    .trim()
    .required("Chat name is required")
    .max(200, "Maximum length is 200 characters"),
});
