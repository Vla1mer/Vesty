import * as Yup from "yup";
import {
  birthdayField,
  nameField,
  phoneField,
  surnameField,
  userNameField,
} from "./fields";
import type { Translate } from "../context/languageContextInternal";

export function profileSchema(t: Translate) {
  return Yup.object({
    userName: userNameField(t),
    name: nameField(t),
    surname: surnameField(t),
    phone: phoneField(t),
    birthday: birthdayField(t),
  });
}
