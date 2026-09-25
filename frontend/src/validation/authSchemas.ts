import * as Yup from "yup";
import { nameField, passwordField, surnameField, userNameField } from "./fields";
import type { Translate } from "../context/languageContextInternal";

export function loginSchema(t: Translate) {
  return Yup.object({
    userName: Yup.string().required(t("check.userNameRequired")),
    password: Yup.string().required(t("check.passwordRequired")),
  });
}

export function registerSchema(t: Translate) {
  return Yup.object({
    userName: userNameField(t),
    password: passwordField(t),
    confirmPassword: Yup.string()
      .required(t("check.confirmRequired"))
      .oneOf([Yup.ref("password")], t("check.passwordsMatch")),
    name: nameField(t),
    surname: surnameField(t),
  });
}
