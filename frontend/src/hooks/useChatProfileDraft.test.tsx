import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { makeStore } from "../store/store";
import { useChatProfileDraft } from "./useChatProfileDraft";
import { api } from "../api/client";
import { installServer, requests, resetServer, stubJson } from "../test/server";
import { ChatPermission } from "../types/api";
import type { ChatDto } from "../types/api";

const CHAT: ChatDto = {
  id: 42,
  name: "Team",
  description: "About work",
  isPrivate: false,
  creatorId: 1,
  createdAt: "2026-01-01T10:00:00Z",
  whoCanInvite: ChatPermission.Members,
  whoCanEdit: ChatPermission.Admins,
  whoCanPost: ChatPermission.Members,
  avatarUpdatedAt: null,
  unreadCount: 0,
};

function setup() {
  const onError = vi.fn();
  const store = makeStore();

  function Wrapper({ children }: { children: ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  }

  const view = renderHook(({ chat }: { chat: ChatDto }) => useChatProfileDraft(chat, onError), {
    initialProps: { chat: CHAT },
    wrapper: Wrapper,
  });

  return { ...view, onError };
}

function saveRequests() {
  return requests.filter(
    (r) => r.method.toUpperCase() === "PUT" && r.url === "/api/Chat/42"
  );
}

describe("useChatProfileDraft", () => {
  beforeEach(() => {
    resetServer();
    installServer();
    stubJson("put", "/api/Chat/42", {});
  });

  describe("saving", () => {
    it("refuses a blank name and sends nothing", async () => {
      const { result, onError } = setup();

      act(() => result.current.setName("   "));
      await act(() => result.current.save());

      expect(onError).toHaveBeenCalledWith("Chat name is required");
      expect(saveRequests()).toHaveLength(0);
    });

    it("ignores a second save while the first is still running", async () => {
      resetServer();
      const request = vi
        .spyOn(api, "request")
        .mockReturnValue(new Promise(() => {}) as never);
      const { result } = setup();

      act(() => result.current.setName("Renamed"));
      act(() => {
        void result.current.save();
      });
      await waitFor(() => expect(result.current.saving).toBe(true));
      await act(async () => {
        void result.current.save();
      });

      expect(request).toHaveBeenCalledOnce();
    });
  });

  describe("tracking changes", () => {
    it("reports nothing changed at first", () => {
      const { result } = setup();

      expect(result.current.changed).toBe(false);
    });

    it("ignores surrounding spaces", () => {
      const { result } = setup();

      act(() => result.current.setName("  Team  "));

      expect(result.current.changed).toBe(false);
    });

    it("ignores padding the server itself stored", () => {
      const onError = vi.fn();
      const store = makeStore();
      const { result } = renderHook(
        () => useChatProfileDraft({ ...CHAT, name: "  Team  " }, onError),
        {
          wrapper: ({ children }: { children: ReactNode }) => (
            <Provider store={store}>{children}</Provider>
          ),
        }
      );

      expect(result.current.changed).toBe(false);
    });

    it("notices a real edit", () => {
      const { result } = setup();

      act(() => result.current.setName("Renamed"));

      expect(result.current.changed).toBe(true);
    });
  });

  describe("following the server", () => {
    it("takes the new values when another chat is shown", () => {
      const { result, rerender } = setup();

      act(() => result.current.setName("typed"));
      rerender({
        chat: { ...CHAT, id: 99, name: "Other", description: "Other notes" },
      });

      expect(result.current.name).toBe("Other");
      expect(result.current.description).toBe("Other notes");
    });

    it("picks up a rename made elsewhere while the field was untouched", () => {
      const { result, rerender } = setup();

      rerender({ chat: { ...CHAT, name: "Renamed elsewhere" } });

      expect(result.current.name).toBe("Renamed elsewhere");
    });

    it("keeps what the user typed when a rename lands mid-edit", () => {
      const { result, rerender } = setup();

      act(() => result.current.setName("my own title"));
      rerender({ chat: { ...CHAT, name: "Renamed elsewhere" } });

      expect(result.current.name).toBe("my own title");
    });

    it("keeps a typed description when the server description changes", () => {
      const { result, rerender } = setup();

      act(() => result.current.setDescription("my own notes"));
      rerender({ chat: { ...CHAT, description: "Changed elsewhere" } });

      expect(result.current.description).toBe("my own notes");
    });

    it("picks up a description change while the field was untouched", () => {
      const { result, rerender } = setup();

      rerender({ chat: { ...CHAT, description: "Changed elsewhere" } });

      expect(result.current.description).toBe("Changed elsewhere");
    });
  });
});
