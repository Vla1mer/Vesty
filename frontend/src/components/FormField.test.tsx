import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Formik } from "formik";
import { FormField } from "./FormField";
import { LanguageProvider } from "../context/LanguageContext";

function renderFields() {
  render(
    <Formik initialValues={{ userName: "", password: "" }} onSubmit={() => {}}>
      <>
        <FormField label="Username" name="userName" />
        <FormField label="Password" name="password" type="password" />
      </>
    </Formik>,
    { wrapper: LanguageProvider }
  );
}

describe("FormField", () => {
  it("names each input by its label", () => {
    renderFields();

    expect(screen.getByLabelText("Username")).toHaveAttribute("name", "userName");
    expect(screen.getByLabelText("Password")).toHaveAttribute("name", "password");
  });

  it("focuses the input when its label is clicked", async () => {
    renderFields();

    await userEvent.click(screen.getByText("Password"));

    expect(screen.getByLabelText("Password")).toHaveFocus();
  });
});
