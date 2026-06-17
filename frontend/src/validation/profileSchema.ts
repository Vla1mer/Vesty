import * as Yup from "yup";

export const profileSchema = Yup.object({
  userName: Yup.string()
    .required("Username is required")
    .max(50, "Maximum length is 50 characters"),
  name: Yup.string().max(100, "Maximum length is 100 characters"),
  surname: Yup.string().max(100, "Maximum length is 100 characters"),
  phone: Yup.string()
    .max(20, "Maximum length is 20 characters")
    .matches(/^[+\d\s()-]*$/, "Phone may contain only digits, spaces and + ( ) -"),
  birthday: Yup.string().test(
    "not-in-future",
    "Birthday cannot be in the future",
    (value) => !value || new Date(value) <= new Date()
  ),
});
