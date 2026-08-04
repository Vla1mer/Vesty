import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useGetChatByIdQuery,
  useGetChatMembersQuery,
  useMarkChatReadMutation,
} from "../store/chatApi";
import {
  useGetMessagesByChatQuery,
  useCreateMessageMutation,
  useUpdateMessageMutation,
  useDeleteMessageMutation,
  useToggleReactionMutation,
  useTogglePinMutation,
} from "../store/messageApi";
import { useAuth } from "../context/useAuth";
import { Avatar, ChatAvatar } from "../components/Avatar";
import { MessageList } from "../components/MessageList";
import { ChatInfoModal } from "../components/ChatInfoModal";
import { ChatSettingsModal } from "../components/ChatSettingsModal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { getChatDisplayName } from "../utils/chats";
import { onChatDeleted } from "../lib/signalr";
import { setActiveChat } from "../lib/activeChat";
import { useTypingIndicator } from "../hooks/useTypingIndicator";
import { useAttachmentUploads } from "../hooks/useAttachmentUploads";
import { useIsMobile } from "../hooks/useIsMobile";
import { ArrowDown, ArrowLeft, ChevronRight, Copy, Pencil, Pin, Trash2, X } from "lucide-react";
import { MessageComposer } from "../components/MessageComposer";
import type { AxiosBaseQueryError } from "../api/axiosBaseQuery";
import { isDirectChat, UserRole, type ChatMemberWithRoleDto, type MessageDto } from "../types/api";
import { AnimatePresence, motion } from "framer-motion";
import { getApiErrorMessage } from "../utils/apiError";
import { useGetBlockedUsersQuery } from "../store/blockApi";

function typingText(names: string[]): string {
  if (names.length === 1) return `${names[0]} is typing`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing`;
  return "Several people are typing";
}

export function ChatDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const chatId = Number(id);
  const isValidChat = Number.isFinite(chatId);

  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const { data: blockedUsers = [] } = useGetBlockedUsersQuery();
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [unreadOnEntry, setUnreadOnEntry] = useState<number | null>(null);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);
  const [initialScrollDone, setInitialScrollDone] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: chat, isLoading: chatLoading, error: chatError } =
    useGetChatByIdQuery(chatId, {
      skip: !isValidChat,
      refetchOnMountOrArgChange: true,
    });
  const { data: members = [] } = useGetChatMembersQuery(chatId, {
    skip: !isValidChat,
    refetchOnMountOrArgChange: true,
  });
  const {
    data: messages = [],
    isLoading: messagesLoading,
    isError: messagesError,
  } = useGetMessagesByChatQuery(chatId, {
    skip: !isValidChat,
    refetchOnMountOrArgChange: true,
  });
  const [createMessage, { isLoading: sending }] = useCreateMessageMutation();
  const [updateMessage, { isLoading: saving }] = useUpdateMessageMutation();
  const [deleteMessage, { isLoading: deletingMessage }] =
    useDeleteMessageMutation();
  const [markChatRead] = useMarkChatReadMutation();
  const [toggleReaction] = useToggleReactionMutation();
  const [togglePin] = useTogglePinMutation();
  const attachments = useAttachmentUploads(chatId);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const { typingNames, notifyTyping } = useTypingIndicator(chatId, isValidChat);
  const isMobile = useIsMobile();

  const bottomRef = useRef<HTMLDivElement>(null);
  const [replyTo, setReplyTo] = useState<MessageDto | null>(null);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [pinnedIndex, setPinnedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const editingMessage =
    editingId !== null ? messages.find((m) => m.id === editingId) : undefined;

  const selectionMode = selectedIds.size > 0;
  const selectedMessages = useMemo(
    () => messages.filter((m) => selectedIds.has(m.id)),
    [messages, selectedIds]
  );
  const ownSelectedIds = selectedMessages
    .filter((m) => m.userId === userId)
    .map((m) => m.id);

  const memberById = useMemo(() => {
    const map = new Map<number, ChatMemberWithRoleDto>();
    for (const m of members) map.set(m.userId, m);
    return map;
  }, [members]);

  const canPin = useMemo(() => {
    if (!chat) return false;
    if (chat.isPrivate) return true;
    const me = members.find((m) => m.userId === userId);
    return me?.roleId === UserRole.Owner || me?.roleId === UserRole.Admin;
  }, [chat, members, userId]);

  const pinnedMessages = useMemo(
    () =>
      messages
        .filter((m) => m.pinnedAt)
        .sort((a, b) => (a.pinnedAt! < b.pinnedAt! ? 1 : -1)),
    [messages]
  );

  const activePinned =
    pinnedMessages.length > 0
      ? pinnedMessages[pinnedIndex % pinnedMessages.length]
      : undefined;

  function showNextPinned() {
    if (!activePinned) return;
    jumpToMessage(activePinned.id);
    if (pinnedMessages.length > 1) {
      setPinnedIndex((prev) => (prev + 1) % pinnedMessages.length);
    }
  }

  const loadError = useMemo(() => {
    if (!isValidChat) return "Invalid chat id";
    if (!chatError) return null;
    const status = (chatError as AxiosBaseQueryError).status;
    if (status === 403) return "You don't have access to this chat";
    if (status === 404) return "Chat not found";
    return "Failed to load chat";
  }, [isValidChat, chatError]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowJumpToBottom(distanceFromBottom > 240);
  }

  function jumpToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  const blockedPartner =
    chat && isDirectChat(chat) && chat.partnerUserId
      ? blockedUsers.some((b) => b.userId === chat.partnerUserId)
      : false;

  const firstUnreadId = useMemo(() => {
    if (!unreadOnEntry || unreadOnEntry > messages.length) return null;
    return messages[messages.length - unreadOnEntry]?.id ?? null;
  }, [messages, unreadOnEntry]);

  useEffect(() => {
    if (messages.length === 0) return;

    if (!initialScrollDone) {
      if (unreadOnEntry === null) return;

      const anchor =
        firstUnreadId !== null
          ? document.getElementById(`message-${firstUnreadId}`)
          : null;

      if (anchor) anchor.scrollIntoView({ block: "center" });
      else bottomRef.current?.scrollIntoView();
      setInitialScrollDone(true);
      return;
    }

    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, firstUnreadId, unreadOnEntry, initialScrollDone]);

  useEffect(() => {
    if (!isValidChat) return;
    setActiveChat(chatId);
    return () => setActiveChat(null);
  }, [chatId, isValidChat]);

  useEffect(() => {
    setPinnedIndex(0);
    setUnreadOnEntry(null);
    setInitialScrollDone(false);
  }, [chatId]);

  useEffect(() => {
    if (unreadOnEntry !== null) return;
    if (chat) setUnreadOnEntry(chat.unreadCount ?? 0);
    else if (chatError) setUnreadOnEntry(0);
  }, [chat, chatError, unreadOnEntry]);

  useEffect(() => {
    if (isValidChat && initialScrollDone) markChatRead(chatId);
  }, [chatId, isValidChat, initialScrollDone, messages.length, markChatRead]);

  useEffect(() => {
    if (!isValidChat) return;

    const unsubscribeChatDeleted = onChatDeleted(({ chatId: deletedChatId }) => {
      if (deletedChatId !== chatId) return;
      navigate("/chats", { replace: true });
    });

    return () => {
      unsubscribeChatDeleted();
    };
  }, [chatId, isValidChat, navigate]);

  function startEdit(id: number, content: string) {
    setEditingId(id);
    setInput(content);
    inputRef.current?.focus();
  }

  function cancelEdit() {
    setEditingId(null);
    setInput("");
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (sending || saving || attachments.isUploading) return;
    if (!content && attachments.readyIds.length === 0) return;

    setActionError(null);

    if (editingId !== null) {
      if (content === editingMessage?.content) {
        cancelEdit();
        return;
      }
      try {
        await updateMessage({ chatId, id: editingId, content }).unwrap();
        cancelEdit();
      } catch (error) {
        setActionError(getApiErrorMessage(error, "Failed to edit message"));
      }
      return;
    }

    try {
      await createMessage({
        chatId,
        content,
        replyToMessageId: replyTo?.id,
        attachmentIds: attachments.readyIds.length ? attachments.readyIds : undefined,
      }).unwrap();
      setInput("");
      setReplyTo(null);
      attachments.clear();
    } catch (error) {
      setActionError(getApiErrorMessage(error, "Failed to send message"));
    }
  }

  async function confirmDeleteMessage() {
    if (deleteTargetId === null) return;
    try {
      await deleteMessage({ chatId, id: deleteTargetId }).unwrap();
      setDeleteTargetId(null);
    } catch {
      setActionError("Failed to delete message");
    }
  }

  function jumpToMessage(id: number) {
    const node = document.getElementById(`message-${id}`);
    if (!node) return;
    node.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightedId(id);
    window.setTimeout(() => setHighlightedId(null), 1600);
  }

  function selectStart(id: number) {
    setSelectedIds((prev) => new Set(prev).add(id));
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function copySelected() {
    const text = selectedMessages.map((m) => m.content ?? "").join("\n");
    if (text) navigator.clipboard?.writeText(text);
    clearSelection();
  }

  function editSelected() {
    const target = selectedMessages[0];
    if (target && target.userId === userId) {
      startEdit(target.id, target.content ?? "");
    }
    clearSelection();
  }

  async function confirmBulkDelete() {
    try {
      await Promise.all(
        ownSelectedIds.map((id) => deleteMessage({ chatId, id }).unwrap())
      );
      setBulkDeleteOpen(false);
      clearSelection();
    } catch {
      setActionError("Failed to delete messages");
      setBulkDeleteOpen(false);
    }
  }

  const title = chat ? getChatDisplayName(chat) : `Chat #${chatId}`;

  return (
    <div
      className="relative h-full flex flex-col"
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        setIsDraggingFile(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsDraggingFile(false);
      }}
      onDrop={(e) => {
        if (!e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        setIsDraggingFile(false);
        attachments.add(Array.from(e.dataTransfer.files));
      }}
      onPaste={(e) => {
        const files = Array.from(e.clipboardData.files);
        if (files.length > 0) attachments.add(files);
      }}
    >
      {isDraggingFile && (
        <div className="absolute inset-0 z-30 flex items-center justify-center border-2 border-dashed border-accent-strong bg-surface/80 pointer-events-none">
          <p className="text-lg font-medium text-accent-strong">Drop files to attach</p>
        </div>
      )}
      <div className="absolute top-0 inset-x-0 overflow-hidden min-h-[88px] z-10">
        <header
          className={`absolute inset-0 flex items-center gap-4 p-4 border-b border-line bg-surface/80 backdrop-blur transition-transform duration-200 ${
            selectionMode ? "-translate-y-full" : "translate-y-0"
          }`}
        >
          <button
            onClick={() => navigate("/chats")}
            className="md:hidden text-content-muted hover:text-content"
            aria-label="Back"
          >
            <ArrowLeft size={22} />
          </button>
          <button
            type="button"
            onClick={() => {
              if (!chat) return;
              if (isMobile) navigate(`/chats/${chatId}/info`);
              else setIsInfoOpen(true);
            }}
            disabled={!chat}
            className="group flex-1 flex items-center gap-2 text-left rounded px-2 -mx-2 hover:bg-surface-muted transition disabled:cursor-default disabled:hover:bg-transparent"
          >
            {chat &&
              (isDirectChat(chat) && chat.partnerUserId ? (
                <Avatar
                  userId={chat.partnerUserId}
                  userName={chat.partnerUserName ?? undefined}
                  avatarUpdatedAt={chat.partnerAvatarUpdatedAt}
                />
              ) : (
                <ChatAvatar
                  chatId={chat.id}
                  name={title}
                  avatarUpdatedAt={chat.avatarUpdatedAt}
                />
              ))}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-content truncate">{title}</h1>
              {chat &&
                (typingNames.length > 0 ? (
                  <p className="text-xs text-accent-strong italic">
                    {typingText(typingNames)}
                    <span className="typing-dots" />
                  </p>
                ) : !chat.isPrivate ? (
                  <p className="text-xs text-content-muted">
                    {members.length > 0
                      ? `${members.length} ${members.length === 1 ? "member" : "members"}`
                      : "Loading..."}
                  </p>
                ) : null)}
            </div>
            {chat && (
              <ChevronRight
                size={20}
                aria-hidden="true"
                className="shrink-0 text-content-subtle transition group-hover:translate-x-0.5 group-hover:text-accent-strong"
              />
            )}
          </button>
        </header>

        <header
          className={`absolute inset-0 flex items-center gap-4 p-4 border-b border-line bg-surface/80 backdrop-blur transition-transform duration-200 ${
            selectionMode ? "translate-y-0" : "-translate-y-full"
          }`}
        >
          <button
            onClick={clearSelection}
            className="text-content-muted hover:text-content"
            aria-label="Cancel selection"
          >
            <X size={22} />
          </button>
          <span className="flex-1 font-semibold text-content">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-4 text-content-muted">
            <button onClick={copySelected} aria-label="Copy" title="Copy">
              <Copy size={20} />
            </button>
            {selectedIds.size === 1 && ownSelectedIds.length === 1 && (
              <button onClick={editSelected} aria-label="Edit" title="Edit">
                <Pencil size={20} />
              </button>
            )}
            {ownSelectedIds.length > 0 && (
              <button
                onClick={() => setBulkDeleteOpen(true)}
                aria-label="Delete"
                title="Delete"
                className="text-danger"
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>
        </header>
      </div>

      {activePinned && !selectionMode && (
        <button
          type="button"
          onClick={showNextPinned}
          className="absolute top-[88px] inset-x-0 z-10 flex items-center gap-3 px-4 py-2 border-b border-line bg-surface-muted/95 backdrop-blur text-left hover:bg-surface transition"
        >
          <Pin size={15} aria-hidden="true" className="shrink-0 text-accent-strong" />
          <div className="min-w-0 flex-1 border-l-2 border-accent-strong pl-3">
            <p className="text-xs font-medium text-accent-strong">
              {pinnedMessages.length > 1
                ? `Pinned message ${(pinnedIndex % pinnedMessages.length) + 1} of ${pinnedMessages.length}`
                : "Pinned message"}
            </p>
            <p className="text-sm text-content-muted truncate">
              {activePinned.content}
            </p>
          </div>
        </button>
      )}

      <MessageList
        chat={chat}
        messages={messages}
        members={memberById}
        currentUserId={userId}
        loading={chatLoading || messagesLoading}
        error={
          loadError ?? (messagesError ? "Failed to load messages" : null)
        }
        firstUnreadId={firstUnreadId}
        highlightedId={highlightedId}
        editingId={editingId}
        selection={{
          mode: selectionMode,
          ids: selectedIds,
          onStart: selectStart,
          onToggle: toggleSelect,
        }}
        actions={{
          onReply: setReplyTo,
          onToggleReaction: (messageId, emoji, active) =>
            toggleReaction({ chatId, messageId, emoji, active }),
          onTogglePin: canPin
            ? (messageId, pinned) => togglePin({ chatId, messageId, pinned })
            : undefined,
          onJumpTo: jumpToMessage,
          onEdit: startEdit,
          onDelete: (id) => setDeleteTargetId(id),
        }}
        containerRef={scrollRef}
        bottomRef={bottomRef}
        onScroll={handleScroll}
        compact={!activePinned || selectionMode}
      />

      <AnimatePresence>
        {isInfoOpen && chat && (
          <ChatInfoModal
            chat={chat}
            onClose={() => setIsInfoOpen(false)}
            onOpenSettings={() => {
              setIsInfoOpen(false);
              if (isMobile) navigate(`/chats/${chatId}/settings`);
              else setIsSettingsOpen(true);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSettingsOpen && chat && (
          <ChatSettingsModal
            chat={chat}
            onBack={() => {
              setIsSettingsOpen(false);
              setIsInfoOpen(true);
            }}
            onDeleted={() => navigate("/chats", { replace: true })}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTargetId !== null && (
          <ConfirmDialog
            title="Delete message?"
            message="This message will be permanently deleted."
            confirmText="Delete"
            variant="danger"
            loading={deletingMessage}
            onConfirm={confirmDeleteMessage}
            onCancel={() => setDeleteTargetId(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {bulkDeleteOpen && (
          <ConfirmDialog
            title={`Delete ${ownSelectedIds.length} ${
              ownSelectedIds.length === 1 ? "message" : "messages"
            }?`}
            message="The selected messages will be permanently deleted."
            confirmText="Delete"
            variant="danger"
            loading={deletingMessage}
            onConfirm={confirmBulkDelete}
            onCancel={() => setBulkDeleteOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showJumpToBottom && (
          <motion.button
            type="button"
            onClick={jumpToBottom}
            aria-label="Jump to latest message"
            title="Jump to latest message"
            initial={{ opacity: 0, scale: 0.8, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 8 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="absolute bottom-24 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface-overlay text-content shadow-float transition-colors hover:bg-surface-raised"
          >
            <ArrowDown size={18} />
          </motion.button>
        )}
      </AnimatePresence>

      {!loadError && (
        <MessageComposer
          value={input}
          onChange={(next) => {
            setInput(next);
            notifyTyping();
          }}
          onSubmit={handleSend}
          inputRef={inputRef}
          attachments={attachments}
          editingMessage={editingMessage}
          onCancelEdit={cancelEdit}
          replyTo={replyTo}
          replyAuthorName={
            replyTo ? memberById.get(replyTo.userId)?.userName : undefined
          }
          onCancelReply={() => setReplyTo(null)}
          error={actionError}
          busy={sending || saving}
          blocked={blockedPartner}
        />
      )}
    </div>
  );
}
