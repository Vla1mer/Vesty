import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { Avatar } from "./Avatar";
import { renderWithProviders } from "../test/renderWithProviders";
import { LANGUAGE_STORAGE_KEY } from "../context/languageContextInternal";

describe("Avatar", () => {
  it("shows no dot for someone offline", () => {
    renderWithProviders(<Avatar userId={7} userName="petya" />);

    expect(screen.queryByLabelText("petya is online")).toBeNull();
  });

  it("marks someone online with a dot", () => {
    renderWithProviders(<Avatar userId={7} userName="petya" online />);

    expect(screen.getByLabelText("petya is online")).toBeInTheDocument();
  });

  it("keeps the picture next to the dot", () => {
    renderWithProviders(<Avatar userId={7} userName="petya" online />);

    expect(screen.getByLabelText("petya")).toBeInTheDocument();
    expect(screen.getByLabelText("petya is online")).toBeInTheDocument();
  });

  it("sizes the dot with the picture", () => {
    const { rerender } = renderWithProviders(
      <Avatar userId={7} userName="petya" online size="sm" />
    );
    const small = screen.getByLabelText("petya is online").className;

    rerender(<Avatar userId={7} userName="petya" online size="xl" />);
    const large = screen.getByLabelText("petya is online").className;

    expect(small).not.toBe(large);
  });

  it("describes the dot in the chosen language", () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "pl");
    renderWithProviders(<Avatar userId={7} userName="petya" online />);

    expect(screen.getByLabelText("petya jest w sieci")).toBeInTheDocument();
  });
});
