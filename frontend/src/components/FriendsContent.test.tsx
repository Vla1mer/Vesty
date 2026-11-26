import { beforeEach, describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { FriendsContent } from "./FriendsContent";
import { renderWithProviders, signIn } from "../test/renderWithProviders";
import { installServer, requests, resetServer, stubJson } from "../test/server";
import type { FriendDto } from "../types/api";

const ME = 1;

const PETYA: FriendDto = {
  userId: 7,
  userName: "petya",
  name: "Petya",
  surname: "Ivanov",
  avatarUpdatedAt: null,
  status: 2,
  isIncoming: false,
  createdAt: "2026-01-01T10:00:00Z",
};

function open(friends: FriendDto[] = [PETYA]) {
  stubJson("get", "/api/Friend", friends);
  stubJson("get", "/api/Friend/requests", []);
  return renderWithProviders(
    <Routes>
      <Route path="/friends" element={<FriendsContent />} />
    </Routes>,
    { route: "/friends" }
  );
}

describe("FriendsContent", () => {
  beforeEach(() => {
    resetServer();
    installServer();
    signIn(ME, "me");
  });

  it("lists a friend", async () => {
    open();

    expect(await screen.findByText("Petya Ivanov")).toBeInTheDocument();
    expect(screen.getByText("@petya")).toBeInTheDocument();
  });

  it("opens the profile of a friend", async () => {
    stubJson("get", "/api/User/7", {
      id: 7,
      userName: "petya",
      name: "Petya",
      surname: "Ivanov",
      avatarUpdatedAt: null,
    });
    open();

    await userEvent.click(
      await screen.findByRole("button", { name: "Open the profile of petya" })
    );

    expect(await screen.findAllByText("Petya Ivanov")).not.toHaveLength(0);
  });

  it("offers to add a stranger found by the search", async () => {
    stubJson("get", "/api/User", [{ id: 9, userName: "vasya", avatarUpdatedAt: null }]);
    stubJson("post", "/api/Friend/9", {});
    open([]);

    await userEvent.type(
      await screen.findByPlaceholderText("Find people by username..."),
      "vas"
    );
    await userEvent.click(await screen.findByRole("button", { name: /Add to friends/ }));

    await waitFor(() =>
      expect(requests.some((r) => r.url === "/api/Friend/9")).toBe(true)
    );
  });

  it("shows a found friend as a friend", async () => {
    stubJson("get", "/api/User", [{ id: 7, userName: "petya", avatarUpdatedAt: null }]);
    open();

    await userEvent.type(
      await screen.findByPlaceholderText("Find people by username..."),
      "pet"
    );

    expect(await screen.findByText("Friend")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Add to friends/ })).not.toBeInTheDocument();
  });
});
