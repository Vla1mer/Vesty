import { beforeEach, describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserProfileContent } from "./UserProfileContent";
import { renderWithProviders, signIn } from "../test/renderWithProviders";
import { installServer, requests, resetServer, stub, stubJson } from "../test/server";
import type { FriendDto, UserDto } from "../types/api";

const USER: UserDto = {
  id: 7,
  userName: "petya",
  avatarUpdatedAt: null,
  isProfileHidden: true,
  canMessage: true,
};

const relation = (isIncoming: boolean, status = 1): FriendDto => ({
  userId: 7,
  userName: "petya",
  avatarUpdatedAt: null,
  status,
  isIncoming,
  createdAt: "2026-11-26T12:00:00Z",
});

function showProfile(
  user: UserDto,
  { friends = [], requests: pending = [] }: { friends?: FriendDto[]; requests?: FriendDto[] } = {}
) {
  stubJson("get", "/api/Friend", friends);
  stubJson("get", "/api/Friend/requests", pending);
  stubJson("get", "/api/User/presence/(7)", []);
  return renderWithProviders(<UserProfileContent user={user} />);
}

describe("UserProfileContent", () => {
  beforeEach(() => {
    resetServer();
    installServer();
    signIn(1, "me");
  });

  it("lets a stranger be added to friends from the profile", async () => {
    stubJson("post", "/api/Friend/7", relation(false));
    showProfile(USER);

    await userEvent.click(await screen.findByRole("button", { name: /Add to friends/ }));

    await waitFor(() =>
      expect(requests.some((r) => r.method.toLowerCase() === "post" && r.url === "/api/Friend/7")).toBe(true)
    );
  });

  it("says why a friend request failed", async () => {
    stub("post", "/api/Friend/7", () => {
      throw Object.assign(new Error("nope"), {
        response: { status: 403, data: { Message: "This user has blocked you." } },
      });
    });
    showProfile(USER);

    await userEvent.click(await screen.findByRole("button", { name: /Add to friends/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("This user has blocked you.");
  });

  it("offers to accept a request the user sent", async () => {
    showProfile(USER, { requests: [relation(true)] });

    expect(await screen.findByRole("button", { name: /Accept request/ })).toBeInTheDocument();
  });

  it("shows a request that is still waiting", async () => {
    showProfile(USER, { requests: [relation(false)] });

    expect(await screen.findByText("Request pending")).toBeInTheDocument();
  });

  it("shows that the user is already a friend", async () => {
    showProfile(USER, { friends: [relation(false, 2)] });

    expect(await screen.findByText("Friend")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Add to friends/ })).not.toBeInTheDocument();
  });

  it("explains instead of failing when messages are closed", async () => {
    showProfile({ ...USER, canMessage: false });

    expect(screen.getByRole("button", { name: /Message/ })).toBeDisabled();
    expect(
      screen.getByText("This user is not accepting messages from you")
    ).toBeInTheDocument();
    await screen.findByRole("button", { name: /Add to friends/ });
  });
});
