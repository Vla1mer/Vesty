import * as Yup from "yup";
import {
  userNameField,
  passwordField,
  nameField,
  surnameField,
} from "./fields";

export const loginSchema = Yup.object({
  userName: Yup.string().required("Username is required"),
  password: Yup.string().required("Password is required"),
});

export const registerSchema = Yup.object({
  userName: userNameField,
  password: passwordField,
  confirmPassword: Yup.string()
    .required("Please confirm your password")
    .oneOf([Yup.ref("password")], "Passwords must match"),
  name: nameField,
  surname: surnameField,
});
