import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
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
    stubJson("get", "/api/Friend", []);
    stubJson("get", "/api/Friend/requests", []);
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

  it("sends a friend request without picking the user", async () => {
    stubJson("get", "/api/User", [OTHER_USER]);
    stubJson("post", "/api/Friend/7", {});
    const onSelected = vi.fn();
    renderWithProviders(<SelectUserContent onSelected={onSelected} />);

    await userEvent.type(screen.getByPlaceholderText("Search by username..."), "pet");
    await userEvent.click(await screen.findByLabelText("Add petya to friends"));

    await waitFor(() =>
      expect(requests.some((r) => r.url === "/api/Friend/7")).toBe(true)
    );
    expect(onSelected).not.toHaveBeenCalled();
  });

  it("says so when nobody matches", async () => {
    stubJson("get", "/api/User", []);
    renderWithProviders(<SelectUserContent onSelected={vi.fn()} />);

    await userEvent.type(screen.getByPlaceholderText("Search by username..."), "zzz");

    expect(await screen.findByText("No users match your search")).toBeInTheDocument();
  });
});
