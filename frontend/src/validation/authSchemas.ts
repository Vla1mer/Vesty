import * as Yup from "yup";

export const loginSchema = Yup.object({
  userName: Yup.string().required("Username is required"),
  password: Yup.string().required("Password is required"),
});

export const registerSchema = Yup.object({
  userName: Yup.string()
    .required("Username is required")
    .max(50, "Maximum length is 50 characters"),
  password: Yup.string()
    .required("Password is required")
    .min(6, "Minimum length is 6 characters")
    .matches(/[0-9]/, "Password must contain at least one digit"),
  name: Yup.string().max(100, "Maximum length is 100 characters"),
  surname: Yup.string().max(100, "Maximum length is 100 characters"),
});
