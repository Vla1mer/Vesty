import * as Yup from "yup";

export const userNameField = Yup.string()
  .required("Username is required")
  .max(50, "Maximum length is 50 characters");

export const passwordField = Yup.string()
  .required("Password is required")
  .min(6, "Minimum length is 6 characters")
  .matches(/[0-9]/, "Password must contain at least one digit");

export const nameField = Yup.string().max(100, "Maximum length is 100 characters");

export const surnameField = Yup.string().max(100, "Maximum length is 100 characters");

export const phoneField = Yup.string()
  .max(20, "Maximum length is 20 characters")
  .matches(/^[+\d\s()-]*$/, "Phone may contain only digits, spaces and + ( ) -");

export const birthdayField = Yup.string().test(
  "not-in-future",
  "Birthday cannot be in the future",
  (value) => !value || new Date(value) <= new Date()
);
