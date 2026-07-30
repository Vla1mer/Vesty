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
import { MessageBubble } from "../components/MessageBubble";
import { ChatInfoModal } from "../components/ChatInfoModal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { getChatDisplayName } from "../utils/chats";
import { formatDateSeparator, isSameDay } from "../utils/date";
import { onChatDeleted } from "../lib/signalr";
import { setActiveChat } from "../lib/activeChat";
import { useTypingIndicator } from "../hooks/useTypingIndicator";
import { useAttachmentUploads } from "../hooks/useAttachmentUploads";
import { ArrowLeft, ChevronRight, Copy, MessageCircle, Paperclip, Pencil, Pin, Reply, Trash2, X } from "lucide-react";
import { AttachmentDrafts } from "../components/AttachmentDrafts";
import type { AxiosBaseQueryError } from "../api/axiosBaseQuery";
import { isDirectChat, UserRole, type ChatMemberWithRoleDto, type MessageDto } from "../types/api";
import { Button } from "../components/ui/Button";
import { TextInput } from "../components/ui/TextInput";
import { FormError } from "../components/FormError";
import { AnimatePresence, motion } from "framer-motion";
import { EmptyState } from "../components/ui/EmptyState";
import { MessageListSkeleton } from "../components/ui/Skeleton";

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
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const { typingNames, notifyTyping } = useTypingIndicator(chatId, isValidChat);

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isValidChat) return;
    setActiveChat(chatId);
    return () => setActiveChat(null);
  }, [chatId, isValidChat]);

  useEffect(() => {
    setPinnedIndex(0);
  }, [chatId]);

  useEffect(() => {
    if (isValidChat) markChatRead(chatId);
  }, [chatId, isValidChat, messages.length, markChatRead]);

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

    if (editingId !== null) {
      if (content === editingMessage?.content) {
        cancelEdit();
        return;
      }
      try {
        await updateMessage({ chatId, id: editingId, content }).unwrap();
        cancelEdit();
      } catch {
        setActionError("Failed to edit message");
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
    } catch {
      setActionError("Failed to send message");
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
            onClick={() => chat && setIsInfoOpen(true)}
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

      <div
        className={`flex-1 min-h-0 overflow-y-auto px-4 pb-4 flex flex-col ${
          activePinned && !selectionMode ? "pt-[140px]" : "pt-[88px]"
        }`}
      >
        {(chatLoading || messagesLoading) && <MessageListSkeleton />}

        {(loadError || actionError || messagesError) && (
          <FormError
            className="mt-auto"
            message={loadError ?? actionError ?? "Failed to load messages"}
          />
        )}

        {!chatLoading &&
          !messagesLoading &&
          !loadError &&
          !actionError &&
          !messagesError &&
          messages.length === 0 && (
            <EmptyState
              className="m-auto"
              Icon={MessageCircle}
              title="No messages yet"
              description="Say hello — your first message will appear here."
            />
          )}

        <div className="mt-auto space-y-3">
        <AnimatePresence initial={false}>
          {messages.map((msg, index) => {
          const prev = messages[index - 1];
          const showDate =
            !prev || !isSameDay(prev.createdAt, msg.createdAt);
          return (
            <motion.div
              key={msg.id}
              layout="position"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              {showDate && (
                <div className="flex justify-center my-2">
                  <span className="text-xs text-content-muted bg-surface-raised px-3 py-1 rounded-full">
                    {formatDateSeparator(msg.createdAt)}
                  </span>
                </div>
              )}
              <MessageBubble
                message={msg}
                isOwn={msg.userId === userId}
                authorName={memberById.get(msg.userId)?.userName}
                authorAvatarUpdatedAt={memberById.get(msg.userId)?.avatarUpdatedAt}
                replyAuthorName={
                  msg.replyTo
                    ? memberById.get(msg.replyTo.userId)?.userName
                    : undefined
                }
                onReply={setReplyTo}
                currentUserId={userId}
                onToggleReaction={(messageId, emoji, active) =>
                  toggleReaction({ chatId, messageId, emoji, active })
                }
                onTogglePin={
                  canPin
                    ? (messageId, pinned) =>
                        togglePin({ chatId, messageId, pinned })
                    : undefined
                }
                onJumpToMessage={jumpToMessage}
                highlighted={highlightedId === msg.id}
                showAuthor={chat ? !chat.isPrivate : false}
                isEditing={editingId === msg.id}
                selectionMode={selectionMode}
                selected={selectedIds.has(msg.id)}
                onSelectStart={selectStart}
                onToggleSelect={toggleSelect}
                onEdit={msg.userId === userId ? startEdit : undefined}
                onDelete={
                  msg.userId === userId
                    ? (id) => setDeleteTargetId(id)
                    : undefined
                }
              />
            </motion.div>
          );
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
        </div>
      </div>

      <AnimatePresence>
        {isInfoOpen && chat && (
          <ChatInfoModal
            chat={chat}
            onClose={() => setIsInfoOpen(false)}
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

      {!loadError && !actionError && (
        <div className="relative border-t border-line bg-surface sticky bottom-0">
          {editingMessage && (
            <div className="flex items-center gap-3 px-4 pt-3 -mb-1">
              <Pencil size={18} aria-hidden="true" className="shrink-0 text-accent-strong" />
              <div className="flex-1 min-w-0 border-l-2 border-accent-strong pl-3">
                <p className="text-xs font-medium text-accent-strong">Editing</p>
                <p className="text-sm text-content-muted truncate">
                  {editingMessage.content}
                </p>
              </div>
              <button
                type="button"
                onClick={cancelEdit}
                aria-label="Cancel editing"
                className="text-content-muted hover:text-content"
              >
                <X size={20} />
              </button>
            </div>
          )}
          {replyTo && !editingMessage && (
            <div className="flex items-center gap-3 px-4 pt-3 -mb-1">
              <Reply size={18} aria-hidden="true" className="shrink-0 text-accent-strong" />
              <div className="flex-1 min-w-0 border-l-2 border-accent-strong pl-3">
                <p className="text-xs font-medium text-accent-strong">
                  Reply to {memberById.get(replyTo.userId)?.userName ?? `User #${replyTo.userId}`}
                </p>
                <p className="text-sm text-content-muted truncate">
                  {replyTo.content}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                aria-label="Cancel reply"
                className="text-content-muted hover:text-content"
              >
                <X size={20} />
              </button>
            </div>
          )}
          <AttachmentDrafts uploads={attachments.uploads} onRemove={attachments.remove} />
          <form onSubmit={handleSend} className="flex gap-2 p-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach file"
              title="Attach file"
              className="shrink-0 px-2 text-content-muted hover:text-accent-strong transition"
            >
              <Paperclip size={20} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => {
                attachments.add(Array.from(e.target.files ?? []));
                e.target.value = "";
              }}
              className="hidden"
            />
            <TextInput
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                notifyTyping();
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape" && editingId !== null) cancelEdit();
              }}
              placeholder="Type a message..."
              maxLength={2000}
              disabled={sending || saving}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={
                sending ||
                saving ||
                attachments.isUploading ||
                (!input.trim() && attachments.readyIds.length === 0)
              }
              className="px-5"
            >
              {sending || saving ? "..." : editingId !== null ? "Save" : "Send"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
