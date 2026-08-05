import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MessageBubble } from "./MessageBubble";
import type { MessageDto } from "../types/api";

const ME = 9;

const MESSAGE: MessageDto = {
  id: 1,
  chatId: 10,
  userId: 5,
  userName: "petya",
  content: "hello there",
  createdAt: "2026-01-01T10:00:00Z",
  isEdited: false,
};

function setup(overrides: Partial<Parameters<typeof MessageBubble>[0]> = {}) {
  const handlers = {
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onReply: vi.fn(),
    onTogglePin: vi.fn(),
    onToggleReaction: vi.fn(),
    onSelectStart: vi.fn(),
    onToggleSelect: vi.fn(),
  };
  render(
    <MessageBubble
      message={MESSAGE}
      isOwn={false}
      currentUserId={ME}
      {...handlers}
      {...overrides}
    />
  );
  return handlers;
}

function bubble() {
  return document.querySelector("#message-1 .rounded-bubble") as HTMLElement;
}

function menuIsOpen() {
  return screen.queryByRole("button", { name: /reply/i }) !== null;
}

function openMenus() {
  return document.querySelectorAll(".fixed.z-50").length;
}

function settle(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe("MessageBubble", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("opening the menu", () => {
    it("opens on right click", () => {
      setup();

      fireEvent.contextMenu(bubble());

      expect(menuIsOpen()).toBe(true);
    });

    it("ignores a right click that follows a touch", () => {
      setup();

      fireEvent.pointerDown(bubble(), { pointerType: "touch" });
      fireEvent.contextMenu(bubble());

      expect(menuIsOpen()).toBe(false);
    });

    it("stays closed for an empty message with no actions", () => {
      render(
        <MessageBubble
          message={{ ...MESSAGE, content: null }}
          isOwn={false}
          currentUserId={ME}
        />
      );

      fireEvent.contextMenu(bubble());

      expect(openMenus()).toBe(0);
    });

    it("stays closed on a tap when there is nothing to show", () => {
      render(
        <MessageBubble
          message={{ ...MESSAGE, content: null }}
          isOwn={false}
          currentUserId={ME}
        />
      );

      fireEvent.touchStart(bubble());
      fireEvent.touchEnd(bubble(), {
        changedTouches: [{ clientX: 10, clientY: 10 }],
      });

      expect(openMenus()).toBe(0);
    });

    it("closes on a second right click", () => {
      setup();

      fireEvent.contextMenu(bubble());
      fireEvent.contextMenu(bubble());

      expect(menuIsOpen()).toBe(false);
    });
  });

  describe("closing the menu", () => {
    it("closes on Escape", () => {
      setup();
      fireEvent.contextMenu(bubble());

      fireEvent.keyDown(window, { key: "Escape" });

      expect(menuIsOpen()).toBe(false);
    });

    it("survives the click that opened it", () => {
      setup();
      fireEvent.contextMenu(bubble());

      fireEvent.click(document.body);

      expect(menuIsOpen()).toBe(true);
    });

    it("closes on a later click outside", () => {
      setup();
      fireEvent.contextMenu(bubble());

      settle(300);
      fireEvent.click(document.body);

      expect(menuIsOpen()).toBe(false);
    });

    it("closes when another message opens its own menu", () => {
      setup();
      render(
        <MessageBubble
          message={{ ...MESSAGE, id: 2 }}
          isOwn={false}
          currentUserId={ME}
          onReply={vi.fn()}
        />
      );

      fireEvent.contextMenu(bubble());
      expect(openMenus()).toBe(1);

      fireEvent.contextMenu(
        document.querySelector("#message-2 .rounded-bubble") as HTMLElement
      );

      expect(openMenus()).toBe(1);
    });

    it("closes on scroll", () => {
      setup();
      fireEvent.contextMenu(bubble());

      settle(300);
      fireEvent.scroll(document.body);

      expect(menuIsOpen()).toBe(false);
    });
  });

  describe("menu position", () => {
    function sizeMenu(width: number, height: number) {
      vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: width,
        bottom: height,
        width,
        height,
        toJSON: () => ({}),
      });
    }

    function openAt(x: number, y: number) {
      fireEvent.contextMenu(bubble(), { clientX: x, clientY: y });
      return document.querySelector(".fixed.z-50") as HTMLElement;
    }

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("sits above the pointer when there is room", () => {
      setup();
      sizeMenu(200, 150);

      const menu = openAt(100, 400);

      expect(menu.style.top).toBe("246px");
      expect(menu.style.left).toBe("100px");
    });

    it("drops below the pointer when it would run off the top", () => {
      setup();
      sizeMenu(200, 150);

      const menu = openAt(100, 20);

      expect(menu.style.top).toBe("24px");
    });

    it("keeps clear of the right edge", () => {
      setup();
      sizeMenu(200, 150);

      const menu = openAt(1000, 400);

      expect(menu.style.left).toBe("816px");
    });

    it("follows a second tap on the same message", () => {
      setup();
      sizeMenu(200, 150);

      openAt(100, 400);
      fireEvent.touchStart(bubble());
      fireEvent.touchEnd(bubble(), {
        changedTouches: [{ clientX: 300, clientY: 600 }],
      });

      const menu = document.querySelector(".fixed.z-50") as HTMLElement;
      expect(menu.style.top).toBe("446px");
      expect(menu.style.left).toBe("300px");
    });

    it("keeps clear of the bottom edge", () => {
      setup();
      sizeMenu(200, 760);

      const menu = openAt(100, 20);

      expect(menu.style.top).toBe("8px");
    });
  });

  describe("touch", () => {
    it("starts selection on a long press", () => {
      const { onSelectStart } = setup();

      fireEvent.touchStart(bubble());
      settle(600);

      expect(onSelectStart).toHaveBeenCalledExactlyOnceWith(1);
    });

    it("does not open the menu after a long press", () => {
      setup();

      fireEvent.touchStart(bubble());
      settle(600);
      fireEvent.touchEnd(bubble(), { changedTouches: [{ clientX: 5, clientY: 5 }] });

      expect(menuIsOpen()).toBe(false);
    });

    it("cancels the long press once the finger moves", () => {
      const { onSelectStart } = setup();

      fireEvent.touchStart(bubble());
      settle(300);
      fireEvent.touchMove(bubble());
      settle(600);

      expect(onSelectStart).not.toHaveBeenCalled();
    });

    it("opens no menu when a moved finger is lifted", () => {
      setup();

      fireEvent.touchStart(bubble());
      fireEvent.touchMove(bubble());
      fireEvent.touchEnd(bubble(), { changedTouches: [{ clientX: 5, clientY: 5 }] });

      expect(menuIsOpen()).toBe(false);
    });

    it("opens the menu on a short tap", () => {
      setup();

      fireEvent.touchStart(bubble());
      settle(100);
      fireEvent.touchEnd(bubble(), { changedTouches: [{ clientX: 5, clientY: 5 }] });

      expect(menuIsOpen()).toBe(true);
    });

    it("toggles selection instead of opening the menu while selecting", () => {
      const { onToggleSelect } = setup({ selectionMode: true });

      fireEvent.touchStart(bubble());
      settle(100);
      fireEvent.touchEnd(bubble(), { changedTouches: [{ clientX: 5, clientY: 5 }] });

      expect(onToggleSelect).toHaveBeenCalledExactlyOnceWith(1);
      expect(menuIsOpen()).toBe(false);
    });

    it("cancels a pending long press on touch cancel", () => {
      const { onSelectStart } = setup();

      fireEvent.touchStart(bubble());
      settle(300);
      fireEvent.touchCancel(bubble());
      settle(600);

      expect(onSelectStart).not.toHaveBeenCalled();
    });
  });

  describe("menu actions", () => {
    function openMenu() {
      fireEvent.contextMenu(bubble());
      settle(500);
    }

    it("swallows clicks that land while the menu is still appearing", () => {
      const { onReply } = setup();
      fireEvent.contextMenu(bubble());

      fireEvent.click(screen.getByRole("button", { name: /reply/i }));

      expect(onReply).not.toHaveBeenCalled();
    });

    it("replies", () => {
      const { onReply } = setup();
      openMenu();

      fireEvent.click(screen.getByRole("button", { name: /reply/i }));

      expect(onReply).toHaveBeenCalledExactlyOnceWith(MESSAGE);
      expect(menuIsOpen()).toBe(false);
    });

    it("copies the text", () => {
      const writeText = vi.fn();
      Object.assign(navigator, { clipboard: { writeText } });
      setup();
      openMenu();

      fireEvent.click(screen.getByRole("button", { name: /copy/i }));

      expect(writeText).toHaveBeenCalledWith("hello there");
    });

    it("edits", () => {
      const { onEdit } = setup();
      openMenu();

      fireEvent.click(screen.getByRole("button", { name: /edit/i }));

      expect(onEdit).toHaveBeenCalledExactlyOnceWith(1, "hello there");
    });

    it("deletes", () => {
      const { onDelete } = setup();
      openMenu();

      fireEvent.click(screen.getByRole("button", { name: /delete/i }));

      expect(onDelete).toHaveBeenCalledExactlyOnceWith(1);
    });

    it("pins an unpinned message", () => {
      const { onTogglePin } = setup();
      openMenu();

      fireEvent.click(screen.getByRole("button", { name: /^pin$/i }));

      expect(onTogglePin).toHaveBeenCalledExactlyOnceWith(1, false);
    });

    it("unpins a pinned message", () => {
      const { onTogglePin } = setup({
        message: { ...MESSAGE, pinnedAt: "2026-01-01T10:05:00Z" },
      });
      openMenu();

      fireEvent.click(screen.getByRole("button", { name: /unpin/i }));

      expect(onTogglePin).toHaveBeenCalledExactlyOnceWith(1, true);
    });

    it("offers no copy for a message without text", () => {
      setup({ message: { ...MESSAGE, content: null } });
      openMenu();

      expect(screen.queryByRole("button", { name: /copy/i })).toBeNull();
    });
  });

  describe("reactions", () => {
    const REACTED: MessageDto = {
      ...MESSAGE,
      reactions: [{ emoji: "👍", userIds: [ME, 3] }],
    };

    it("adds a reaction picked from the menu", () => {
      const { onToggleReaction } = setup();
      fireEvent.contextMenu(bubble());
      settle(500);

      fireEvent.click(screen.getByRole("button", { name: "❤️" }));

      expect(onToggleReaction).toHaveBeenCalledExactlyOnceWith(1, "❤️", false);
    });

    it("knows the current user already reacted", () => {
      const { onToggleReaction } = setup({ message: REACTED });
      fireEvent.contextMenu(bubble());
      settle(500);

      fireEvent.click(screen.getByRole("button", { name: "👍" }));

      expect(onToggleReaction).toHaveBeenCalledExactlyOnceWith(1, "👍", true);
    });

    it("shows how many reacted", () => {
      setup({ message: REACTED });

      expect(screen.getByRole("button", { name: "👍 2" })).toBeInTheDocument();
    });

    it("removes own reaction from the chip", () => {
      const { onToggleReaction } = setup({ message: REACTED });

      fireEvent.click(screen.getByRole("button", { name: "👍 2" }));

      expect(onToggleReaction).toHaveBeenCalledExactlyOnceWith(1, "👍", true);
    });

    it("adds someone else's reaction from the chip", () => {
      const { onToggleReaction } = setup({
        message: { ...MESSAGE, reactions: [{ emoji: "🔥", userIds: [3] }] },
      });

      fireEvent.click(screen.getByRole("button", { name: "🔥 1" }));

      expect(onToggleReaction).toHaveBeenCalledExactlyOnceWith(1, "🔥", false);
    });
  });

  describe("rendering", () => {
    it("names the author of an incoming message", () => {
      setup({ authorName: "petya" });

      expect(screen.getByText("petya")).toBeInTheDocument();
    });

    it("hides the author on a follow-up message", () => {
      setup({ authorName: "petya", showAuthor: false });

      expect(screen.queryByText("petya")).toBeNull();
    });

    it("hides the author of an own message", () => {
      setup({ authorName: "petya", isOwn: true });

      expect(screen.queryByText("petya")).toBeNull();
    });

    it("falls back to the user id when the name is unknown", () => {
      setup();

      expect(screen.getByText("User #5")).toBeInTheDocument();
    });

    it("marks an edited message", () => {
      setup({ message: { ...MESSAGE, isEdited: true } });

      expect(screen.getAllByText(/^edited /)).not.toHaveLength(0);
    });

    it("marks a pinned message", () => {
      setup({ message: { ...MESSAGE, pinnedAt: "2026-01-01T10:05:00Z" } });

      expect(screen.getByText("Pinned")).toBeInTheDocument();
    });

    it("jumps to the quoted message", () => {
      const onJumpToMessage = vi.fn();
      setup({
        message: {
          ...MESSAGE,
          replyTo: { id: 77, userId: 3, content: "earlier" },
        },
        replyAuthorName: "vasya",
        onJumpToMessage,
      });

      fireEvent.click(screen.getByText("earlier"));

      expect(onJumpToMessage).toHaveBeenCalledExactlyOnceWith(77);
    });
  });
});
