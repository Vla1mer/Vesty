import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Avatar } from "./Avatar";

describe("Avatar", () => {
  it("shows no dot for someone offline", () => {
    render(<Avatar userId={7} userName="petya" />);

    expect(screen.queryByLabelText("petya is online")).toBeNull();
  });

  it("marks someone online with a dot", () => {
    render(<Avatar userId={7} userName="petya" online />);

    expect(screen.getByLabelText("petya is online")).toBeInTheDocument();
  });

  it("keeps the picture next to the dot", () => {
    render(<Avatar userId={7} userName="petya" online />);

    expect(screen.getByLabelText("petya")).toBeInTheDocument();
    expect(screen.getByLabelText("petya is online")).toBeInTheDocument();
  });

  it("sizes the dot with the picture", () => {
    const { rerender } = render(<Avatar userId={7} userName="petya" online size="sm" />);
    const small = screen.getByLabelText("petya is online").className;

    rerender(<Avatar userId={7} userName="petya" online size="xl" />);
    const large = screen.getByLabelText("petya is online").className;

    expect(small).not.toBe(large);
  });
});
