import { beforeEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { UserProfilePage } from "./UserProfilePage";
import { renderWithProviders, signIn } from "../test/renderWithProviders";
import { installServer, resetServer, stub, stubJson } from "../test/server";
import type { UserDto } from "../types/api";

const ME = 1;
const OTHER = 7;

const OPEN_PROFILE: UserDto = {
  id: OTHER,
  userName: "petya",
  name: "Petya",
  surname: "Ivanov",
  avatarUpdatedAt: null,
  isProfileHidden: false,
};

function routes() {
  return (
    <Routes>
      <Route path="/users/:userId" element={<UserProfilePage />} />
      <Route path="/chats/new/:userId" element={<p>compose screen</p>} />
    </Routes>
  );
}

function open(id: number | string) {
  return renderWithProviders(routes(), { route: `/users/${id}` });
}

function show(user: Partial<UserDto> = {}, id = OTHER) {
  stubJson("get", `/api/User/${id}`, { ...OPEN_PROFILE, ...user, id });
  return open(id);
}

describe("UserProfilePage", () => {
  beforeEach(() => {
    resetServer();
    installServer();
    signIn(ME, "me");
  });

  it("shows the username and the full name", async () => {
    show();

    expect(await screen.findByText("petya")).toBeInTheDocument();
    expect(screen.getByText("Petya Ivanov")).toBeInTheDocument();
  });

  it("says so when the profile is hidden", async () => {
    show({ name: undefined, surname: undefined, isProfileHidden: true });

    expect(
      await screen.findByText("This user has hidden their profile")
    ).toBeInTheDocument();
    expect(screen.getByText("petya")).toBeInTheDocument();
  });

  it("keeps the notice away from an open profile", async () => {
    show();

    await screen.findByText("petya");
    expect(screen.queryByText("This user has hidden their profile")).toBeNull();
  });

  it("offers to start a conversation", async () => {
    show();

    await userEvent.click(await screen.findByRole("button", { name: /message/i }));

    expect(await screen.findByText("compose screen")).toBeInTheDocument();
  });

  it("offers no conversation with yourself", async () => {
    show({ userName: "me" }, ME);

    await screen.findByText("me");
    expect(screen.queryByRole("button", { name: /message/i })).toBeNull();
  });

  it("reports a missing user", async () => {
    stub("get", `/api/User/${OTHER}`, () => {
      throw Object.assign(new Error("nope"), {
        response: { status: 404, data: { Message: "Not found" } },
      });
    });
    open(OTHER);

    expect(await screen.findByText("User not found")).toBeInTheDocument();
  });

  it("reports a broken request", async () => {
    stub("get", `/api/User/${OTHER}`, () => {
      throw Object.assign(new Error("nope"), {
        response: { status: 500, data: { Message: "Server error" } },
      });
    });
    open(OTHER);

    expect(
      await screen.findByText("Failed to load the profile")
    ).toBeInTheDocument();
  });

  it.each(["abc", "0", "-1"])("refuses the id %s", async (id) => {
    open(id);

    expect(await screen.findByText("Invalid user id")).toBeInTheDocument();
  });
});
