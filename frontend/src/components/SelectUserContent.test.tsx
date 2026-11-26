import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SelectUserContent } from "./SelectUserContent";
import { renderWithProviders } from "../test/renderWithProviders";
import { installServer, requests, resetServer, stubJson } from "../test/server";

const OTHER_USER = {
  id: 7,
  userName: "petya",
  name: "Petya",
  surname: null,
  avatarUpdatedAt: null,
};

describe("SelectUserContent", () => {
  beforeEach(() => {
    resetServer();
    installServer();
  });

  it("asks for nothing until something is typed", async () => {
    renderWithProviders(<SelectUserContent onSelected={vi.fn()} />);

    expect(screen.getByText("Start typing to find someone")).toBeInTheDocument();
    expect(requests.some((r) => r.url === "/api/User")).toBe(false);
  });

  it("shows people returned by the search", async () => {
    stubJson("get", "/api/User", [OTHER_USER]);
    renderWithProviders(<SelectUserContent onSelected={vi.fn()} />);

    await userEvent.type(screen.getByPlaceholderText("Search by username..."), "pet");

    expect(await screen.findByText("petya")).toBeInTheDocument();
  });

  it("reports the picked user once", async () => {
    stubJson("get", "/api/User", [OTHER_USER]);
    const onSelected = vi.fn();
    renderWithProviders(<SelectUserContent onSelected={onSelected} />);

    await userEvent.type(screen.getByPlaceholderText("Search by username..."), "pet");
    await userEvent.click(await screen.findByLabelText("Message petya"));

    expect(onSelected).toHaveBeenCalledExactlyOnceWith(7);
  });

  it("leaves out people who do not accept messages", async () => {
    stubJson("get", "/api/User", [
      OTHER_USER,
      { ...OTHER_USER, id: 8, userName: "pavel", canMessage: false },
    ]);
    renderWithProviders(<SelectUserContent onSelected={vi.fn()} />);

    await userEvent.type(screen.getByPlaceholderText("Search by username..."), "p");

    expect(await screen.findByText("petya")).toBeInTheDocument();
    expect(screen.queryByText("pavel")).not.toBeInTheDocument();
  });

  it("says so when only closed people match", async () => {
    stubJson("get", "/api/User", [{ ...OTHER_USER, canMessage: false }]);
    renderWithProviders(<SelectUserContent onSelected={vi.fn()} />);

    await userEvent.type(screen.getByPlaceholderText("Search by username..."), "pet");

    expect(await screen.findByText("No users match your search")).toBeInTheDocument();
  });

  it("says so when nobody matches", async () => {
    stubJson("get", "/api/User", []);
    renderWithProviders(<SelectUserContent onSelected={vi.fn()} />);

    await userEvent.type(screen.getByPlaceholderText("Search by username..."), "zzz");

    expect(await screen.findByText("No users match your search")).toBeInTheDocument();
  });
});
