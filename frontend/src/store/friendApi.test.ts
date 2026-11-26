import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/signalr", async () => (await import("../test/signalrMock")).signalrMock);

import { makeStore } from "./store";
import { friendApi } from "./friendApi";
import { blockApi } from "./blockApi";
import { userApi } from "./userApi";
import { installServer, requests, resetServer, stubJson } from "../test/server";

const profileLoads = () =>
  requests.filter((r) => r.method.toLowerCase() === "get" && r.url === "/api/User/7").length;

async function openProfile() {
  const store = makeStore();
  const subscription = store.dispatch(userApi.endpoints.getUserById.initiate(7));
  await subscription;
  return store;
}

describe("friendship changes refresh the profile", () => {
  beforeEach(() => {
    resetServer();
    installServer();
    stubJson("get", "/api/User/7", { id: 7, userName: "petya", canMessage: false });
  });

  it("reloads the profile after accepting a request", async () => {
    stubJson("post", "/api/Friend/7/accept", {});
    const store = await openProfile();

    await store.dispatch(friendApi.endpoints.acceptFriendRequest.initiate(7));

    await vi.waitFor(() => expect(profileLoads()).toBe(2));
  });

  it("reloads the profile after removing a friend", async () => {
    stubJson("delete", "/api/Friend/7", {});
    const store = await openProfile();

    await store.dispatch(friendApi.endpoints.removeFriend.initiate(7));

    await vi.waitFor(() => expect(profileLoads()).toBe(2));
  });

  it("reloads the profile after blocking", async () => {
    stubJson("post", "/api/Block/7", {});
    const store = await openProfile();

    await store.dispatch(blockApi.endpoints.blockUser.initiate(7));

    await vi.waitFor(() => expect(profileLoads()).toBe(2));
  });
});
