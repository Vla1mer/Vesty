import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatSettingsContent } from "./ChatSettingsContent";
import { renderWithProviders, signIn } from "../test/renderWithProviders";
import { installServer, requests, resetServer, stub, stubJson } from "../test/server";
import { ChatPermission, UserRole } from "../types/api";
import type { ChatDto, ChatMemberWithRoleDto } from "../types/api";

const ME = 1;
const CHAT_ID = 42;

const GROUP: ChatDto = {
  id: CHAT_ID,
  name: "Team",
  description: "About work",
  isPrivate: false,
  creatorId: ME,
  createdAt: "2026-01-01T10:00:00Z",
  whoCanInvite: ChatPermission.Members,
  whoCanEdit: ChatPermission.Admins,
  whoCanPost: ChatPermission.Members,
  avatarUpdatedAt: null,
  unreadCount: 0,
};

function member(userId: number, roleId: number): ChatMemberWithRoleDto {
  return {
    userId,
    userName: `user${userId}`,
    roleId,
    avatarUpdatedAt: null,
  } as ChatMemberWithRoleDto;
}

function setup(
  chat: Partial<ChatDto> = {},
  members: ChatMemberWithRoleDto[] = [member(ME, UserRole.Owner), member(2, UserRole.User)]
) {
  stubJson("get", `/api/Chat/${CHAT_ID}/users`, members);
  const onDeleted = vi.fn();
  const onViewChange = vi.fn();
  renderWithProviders(
    <ChatSettingsContent
      chat={{ ...GROUP, ...chat }}
      view="settings"
      onViewChange={onViewChange}
      onDeleted={onDeleted}
    />
  );
  return { onDeleted, onViewChange };
}

function sent(method: string, url: string) {
  return requests.find(
    (r) => r.method.toUpperCase() === method.toUpperCase() && r.url === url
  );
}

describe("ChatSettingsContent", () => {
  beforeEach(() => {
    resetServer();
    installServer();
    signIn(ME, "user1");
    stubJson("get", `/api/Chat/${CHAT_ID}/invite`, null);
  });

  describe("what each role sees", () => {
    it("offers permissions and admins to the owner", async () => {
      setup();

      expect(await screen.findByText("Permissions")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /administrators/i })).toBeInTheDocument();
    });

    it("hides permissions from a plain member", async () => {
      setup({}, [member(ME, UserRole.User), member(2, UserRole.Owner)]);

      expect(await screen.findByRole("button", { name: /leave chat/i })).toBeInTheDocument();
      expect(screen.queryByText("Permissions")).toBeNull();
    });

    it("lets an admin edit the profile when the permission allows it", async () => {
      setup({ whoCanEdit: ChatPermission.Admins }, [
        member(ME, UserRole.Admin),
        member(2, UserRole.Owner),
      ]);

      expect(await screen.findByPlaceholderText("Chat name")).toBeInTheDocument();
    });

    it("keeps the profile away from a member without the permission", async () => {
      setup({ whoCanEdit: ChatPermission.Owner }, [
        member(ME, UserRole.User),
        member(2, UserRole.Owner),
      ]);

      await screen.findByRole("button", { name: /leave chat/i });
      expect(screen.queryByPlaceholderText("Chat name")).toBeNull();
    });

    it("tells the owner to hand over ownership before leaving", async () => {
      setup();

      expect(
        await screen.findByText(/hand ownership to another member/i)
      ).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /leave chat/i })).toBeNull();
    });

    it("offers no leave button to a lone owner", async () => {
      setup({}, [member(ME, UserRole.Owner)]);

      await screen.findByText("Permissions");
      expect(screen.queryByRole("button", { name: /leave chat/i })).toBeNull();
      expect(screen.queryByText(/hand ownership/i)).toBeNull();
    });

    it("shows delete for me in a direct chat instead of leaving", async () => {
      setup({ isPrivate: true, name: null }, [
        member(ME, UserRole.User),
        member(2, UserRole.User),
      ]);

      expect(
        await screen.findByRole("button", { name: /delete for me/i })
      ).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /leave chat/i })).toBeNull();
    });

    it("keeps chat deletion from a member of a group", async () => {
      setup({}, [member(ME, UserRole.User), member(2, UserRole.Owner)]);

      await screen.findByRole("button", { name: /leave chat/i });
      expect(screen.queryByRole("button", { name: /delete chat/i })).toBeNull();
    });
  });

  describe("profile", () => {
    it("saves a new name and description", async () => {
      stubJson("put", `/api/Chat/${CHAT_ID}`, {});
      setup({ whoCanEdit: ChatPermission.Members });

      const name = await screen.findByPlaceholderText("Chat name");
      await userEvent.clear(name);
      await userEvent.type(name, "Renamed");
      await userEvent.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => expect(sent("put", `/api/Chat/${CHAT_ID}`)).toBeDefined());
      expect(sent("put", `/api/Chat/${CHAT_ID}`)?.data).toEqual({
        name: "Renamed",
        description: "About work",
      });
    });

    it("keeps save disabled until something changes", async () => {
      setup({ whoCanEdit: ChatPermission.Members });

      await screen.findByPlaceholderText("Chat name");
      expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    });

    it("refuses to save a blank name", async () => {
      setup({ whoCanEdit: ChatPermission.Members });

      const name = await screen.findByPlaceholderText("Chat name");
      await userEvent.clear(name);

      expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    });

    it("sends no description when it was cleared", async () => {
      stubJson("put", `/api/Chat/${CHAT_ID}`, {});
      setup({ whoCanEdit: ChatPermission.Members });

      const description = await screen.findByPlaceholderText(/description/i);
      await userEvent.clear(description);
      await userEvent.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => expect(sent("put", `/api/Chat/${CHAT_ID}`)).toBeDefined());
      expect(sent("put", `/api/Chat/${CHAT_ID}`)?.data).toEqual({
        name: "Team",
        description: null,
      });
    });

    it("reports a failed save", async () => {
      stub("put", `/api/Chat/${CHAT_ID}`, () => {
        throw Object.assign(new Error("nope"), {
          response: { status: 400, data: { Message: "Name already taken" } },
        });
      });
      setup({ whoCanEdit: ChatPermission.Members });

      const name = await screen.findByPlaceholderText("Chat name");
      await userEvent.type(name, "!");
      await userEvent.click(screen.getByRole("button", { name: "Save" }));

      expect(await screen.findByText("Name already taken")).toBeInTheDocument();
    });

    it("counts the characters left in the name", async () => {
      setup({ whoCanEdit: ChatPermission.Members });

      await screen.findByPlaceholderText("Chat name");
      expect(screen.getByText("4 / 100")).toBeInTheDocument();
    });
  });

  describe("permissions", () => {
    it("sends the changed level", async () => {
      stubJson("put", `/api/Chat/${CHAT_ID}/permissions`, {});
      setup();

      await screen.findByText("Permissions");
      await userEvent.selectOptions(
        screen.getByRole("combobox", { name: /who can add members/i }),
        String(ChatPermission.Owner)
      );

      await waitFor(() =>
        expect(sent("put", `/api/Chat/${CHAT_ID}/permissions`)).toBeDefined()
      );
      expect(sent("put", `/api/Chat/${CHAT_ID}/permissions`)?.data).toEqual({
        whoCanInvite: ChatPermission.Owner,
        whoCanEdit: ChatPermission.Admins,
        whoCanPost: ChatPermission.Members,
      });
    });

    it("keeps the chosen level after saving", async () => {
      stubJson("put", `/api/Chat/${CHAT_ID}/permissions`, {});
      setup();

      await screen.findByText("Permissions");
      const select = screen.getByRole("combobox", { name: /who can add members/i });
      await userEvent.selectOptions(select, String(ChatPermission.Owner));

      await waitFor(() =>
        expect((select as HTMLSelectElement).value).toBe(String(ChatPermission.Owner))
      );
    });

    it("reports a failed change", async () => {
      stub("put", `/api/Chat/${CHAT_ID}/permissions`, () => {
        throw Object.assign(new Error("nope"), {
          response: { status: 403, data: { Message: "Not allowed" } },
        });
      });
      setup();

      await screen.findByText("Permissions");
      await userEvent.selectOptions(
        screen.getByRole("combobox", { name: /who can add members/i }),
        String(ChatPermission.Owner)
      );

      expect(await screen.findByText("Not allowed")).toBeInTheDocument();
    });
  });

  describe("leaving, clearing and deleting", () => {
    it("asks before leaving and then removes the member", async () => {
      stubJson("delete", `/api/Chat/${CHAT_ID}/users/${ME}`, {});
      const { onDeleted } = setup({}, [
        member(ME, UserRole.User),
        member(2, UserRole.Owner),
      ]);

      await userEvent.click(
        await screen.findByRole("button", { name: /leave chat/i })
      );
      expect(await screen.findByText("Leave chat?")).toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "Leave" }));

      await waitFor(() => expect(onDeleted).toHaveBeenCalledOnce());
      expect(sent("delete", `/api/Chat/${CHAT_ID}/users/${ME}`)).toBeDefined();
    });

    it("leaves nothing behind when the confirmation is dismissed", async () => {
      const { onDeleted } = setup({}, [
        member(ME, UserRole.User),
        member(2, UserRole.Owner),
      ]);

      await userEvent.click(
        await screen.findByRole("button", { name: /leave chat/i })
      );
      await userEvent.click(screen.getByRole("button", { name: /cancel/i }));

      expect(sent("delete", `/api/Chat/${CHAT_ID}/users/${ME}`)).toBeUndefined();
      expect(onDeleted).not.toHaveBeenCalled();
    });

    it("deletes the chat after confirmation", async () => {
      stubJson("delete", `/api/Chat/${CHAT_ID}`, {});
      const { onDeleted } = setup();

      await userEvent.click(
        await screen.findByRole("button", { name: /delete chat/i })
      );
      expect(await screen.findByText("Delete chat?")).toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "Delete" }));

      await waitFor(() => expect(onDeleted).toHaveBeenCalledOnce());
      expect(sent("delete", `/api/Chat/${CHAT_ID}`)).toBeDefined();
    });

    it("clears a direct chat for the current user only", async () => {
      stubJson("delete", `/api/Chat/${CHAT_ID}/for-me`, {});
      const { onDeleted } = setup({ isPrivate: true, name: null }, [
        member(ME, UserRole.User),
        member(2, UserRole.User),
      ]);

      await userEvent.click(
        await screen.findByRole("button", { name: /delete for me/i })
      );
      await userEvent.click(screen.getByRole("button", { name: "Delete" }));

      await waitFor(() => expect(onDeleted).toHaveBeenCalledOnce());
      expect(sent("delete", `/api/Chat/${CHAT_ID}/for-me`)).toBeDefined();
    });

    it("reports a failed delete and keeps the chat", async () => {
      stub("delete", `/api/Chat/${CHAT_ID}`, () => {
        throw Object.assign(new Error("nope"), {
          response: { status: 403, data: { Message: "You cannot delete this" } },
        });
      });
      const { onDeleted } = setup();

      await userEvent.click(
        await screen.findByRole("button", { name: /delete chat/i })
      );
      await userEvent.click(screen.getByRole("button", { name: "Delete" }));

      expect(await screen.findByText("You cannot delete this")).toBeInTheDocument();
      expect(onDeleted).not.toHaveBeenCalled();
    });
  });

  it("opens the admins view", async () => {
    const { onViewChange } = setup();

    await userEvent.click(
      await screen.findByRole("button", { name: /administrators/i })
    );

    expect(onViewChange).toHaveBeenCalledExactlyOnceWith("admins");
  });
});
