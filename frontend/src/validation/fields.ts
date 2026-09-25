import * as Yup from "yup";
import type { Translate } from "../context/languageContextInternal";

export function userNameField(t: Translate) {
  return Yup.string()
    .required(t("check.userNameRequired"))
    .max(50, t("check.maxLength", { max: 50 }));
}

export function passwordField(t: Translate) {
  return Yup.string()
    .required(t("check.passwordRequired"))
    .min(6, t("check.passwordShort"))
    .matches(/[0-9]/, t("check.passwordDigit"));
}

export function nameField(t: Translate) {
  return Yup.string().max(100, t("check.maxLength", { max: 100 }));
}

export function surnameField(t: Translate) {
  return Yup.string().max(100, t("check.maxLength", { max: 100 }));
}

export function phoneField(t: Translate) {
  return Yup.string()
    .max(20, t("check.maxLength", { max: 20 }))
    .matches(/^[+\d\s()-]*$/, t("check.phoneCharacters"));
}

export function birthdayField(t: Translate) {
  return Yup.string().test(
    "not-in-future",
    t("check.birthdayFuture"),
    (value) => !value || new Date(value) <= new Date()
  );
}
