import * as Yup from "yup";
import {
  userNameField,
  nameField,
  surnameField,
  phoneField,
  birthdayField,
} from "./fields";

export const profileSchema = Yup.object({
  userName: userNameField,
  name: nameField,
  surname: surnameField,
  phone: phoneField,
  birthday: birthdayField,
});
