import { beforeEach, describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PrivacySettings } from "./PrivacySettings";
import { renderWithProviders, signIn } from "../test/renderWithProviders";
import { installServer, requests, resetServer, stub, stubJson } from "../test/server";
import { PRIVACY_LEVEL } from "../types/api";

const STORED = {
  whoCanMessage: PRIVACY_LEVEL.EVERYONE,
  whoCanInvite: PRIVACY_LEVEL.FRIENDS_ONLY,
  whoCanSeeProfile: PRIVACY_LEVEL.NOBODY,
  whoCanSeeOnline: PRIVACY_LEVEL.FRIENDS_ONLY,
};

function sentPrivacy() {
  return requests.find(
    (r) => r.method.toUpperCase() === "PUT" && r.url === "/api/User/privacy"
  )?.data;
}

function choice(group: string, label: string) {
  const section = screen.getByText(group).parentElement!;
  return within(section).getByRole("button", { name: label });
}

describe("PrivacySettings", () => {
  beforeEach(() => {
    resetServer();
    installServer();
    signIn(1, "me");
    stubJson("get", "/api/User/privacy", STORED);
    stubJson("put", "/api/User/privacy", STORED);
  });

  it("offers every privacy question", async () => {
    renderWithProviders(<PrivacySettings />);

    expect(await screen.findByText("Who can message me")).toBeInTheDocument();
    expect(screen.getByText("Who can add me to groups")).toBeInTheDocument();
    expect(screen.getByText("Who can see my profile")).toBeInTheDocument();
    expect(screen.getByText("Who can see when I am online")).toBeInTheDocument();
  });

  it("marks the stored level of each question", async () => {
    renderWithProviders(<PrivacySettings />);

    await screen.findByText("Who can see my profile");

    expect(choice("Who can message me", "Everyone")).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(choice("Who can add me to groups", "Friends only")).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(choice("Who can see my profile", "Nobody")).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(
      choice("Who can see when I am online", "Friends only")
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("sends every level when one of them changes", async () => {
    renderWithProviders(<PrivacySettings />);

    await screen.findByText("Who can see my profile");
    await userEvent.click(choice("Who can see my profile", "Everyone"));

    await waitFor(() => expect(sentPrivacy()).toBeDefined());
    expect(sentPrivacy()).toEqual({
      whoCanMessage: PRIVACY_LEVEL.EVERYONE,
      whoCanInvite: PRIVACY_LEVEL.FRIENDS_ONLY,
      whoCanSeeProfile: PRIVACY_LEVEL.EVERYONE,
      whoCanSeeOnline: PRIVACY_LEVEL.FRIENDS_ONLY,
    });
  });

  it("leaves the other questions untouched", async () => {
    renderWithProviders(<PrivacySettings />);

    await screen.findByText("Who can message me");
    await userEvent.click(choice("Who can message me", "Friends only"));

    await waitFor(() => expect(sentPrivacy()).toBeDefined());
    expect(sentPrivacy()).toEqual({
      whoCanMessage: PRIVACY_LEVEL.FRIENDS_ONLY,
      whoCanInvite: PRIVACY_LEVEL.FRIENDS_ONLY,
      whoCanSeeProfile: PRIVACY_LEVEL.NOBODY,
      whoCanSeeOnline: PRIVACY_LEVEL.FRIENDS_ONLY,
    });
  });

  it("saves a new online visibility", async () => {
    renderWithProviders(<PrivacySettings />);

    await screen.findByText("Who can see when I am online");
    await userEvent.click(choice("Who can see when I am online", "Nobody"));

    await waitFor(() => expect(sentPrivacy()).toBeDefined());
    expect(sentPrivacy()).toEqual({
      whoCanMessage: PRIVACY_LEVEL.EVERYONE,
      whoCanInvite: PRIVACY_LEVEL.FRIENDS_ONLY,
      whoCanSeeProfile: PRIVACY_LEVEL.NOBODY,
      whoCanSeeOnline: PRIVACY_LEVEL.NOBODY,
    });
  });

  it("reports a failed save", async () => {
    stub("put", "/api/User/privacy", () => {
      throw Object.assign(new Error("nope"), {
        response: { status: 500, data: { Message: "Server error" } },
      });
    });
    renderWithProviders(<PrivacySettings />);

    await screen.findByText("Who can see my profile");
    await userEvent.click(choice("Who can see my profile", "Nobody"));

    expect(
      await screen.findByText("Could not save privacy settings")
    ).toBeInTheDocument();
  });

  it("reports a failed load", async () => {
    resetServer();
    installServer();
    renderWithProviders(<PrivacySettings />);

    expect(
      await screen.findByText("Failed to load privacy settings")
    ).toBeInTheDocument();
  });
});
