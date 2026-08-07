import { beforeEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { FriendsContent } from "./FriendsContent";
import { renderWithProviders, signIn } from "../test/renderWithProviders";
import { installServer, resetServer, stubJson } from "../test/server";
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
      <Route path="/users/:userId" element={<p>profile screen</p>} />
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
    open();

    await userEvent.click(
      await screen.findByRole("button", { name: "Open the profile of petya" })
    );

    expect(await screen.findByText("profile screen")).toBeInTheDocument();
  });
});
