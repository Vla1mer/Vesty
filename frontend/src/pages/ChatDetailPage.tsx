import { Fragment, useEffect, useMemo, useRef, useState } from "react";
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
} from "../store/messageApi";
import { useAuth } from "../context/useAuth";
import { MessageBubble } from "../components/MessageBubble";
import { ChatInfoModal } from "../components/ChatInfoModal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { getChatDisplayName } from "../utils/chats";
import { formatDateSeparator, isSameDay } from "../utils/date";
import { onChatDeleted } from "../lib/signalr";
import { setActiveChat } from "../lib/activeChat";
import { useTypingIndicator } from "../hooks/useTypingIndicator";
import type { AxiosBaseQueryError } from "../api/axiosBaseQuery";

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
  const { typingNames, notifyTyping } = useTypingIndicator(chatId, isValidChat);

  const bottomRef = useRef<HTMLDivElement>(null);
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

  const userNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const m of members) map.set(m.userId, m.userName);
    return map;
  }, [members]);

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
    if (!content || sending || saving) return;

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
      await createMessage({ chatId, content }).unwrap();
      setInput("");
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
    <div className="relative h-full flex flex-col">
      <div className="absolute top-0 inset-x-0 overflow-hidden min-h-[88px] z-10">
        <header
          className={`absolute inset-0 flex items-center gap-4 p-4 border-b border-slate-700 bg-slate-900/80 backdrop-blur transition-transform duration-200 ${
            selectionMode ? "-translate-y-full" : "translate-y-0"
          }`}
        >
          <button
            onClick={() => navigate("/chats")}
            className="md:hidden text-slate-400 hover:text-slate-100 text-2xl"
            aria-label="Back"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => chat && setIsInfoOpen(true)}
            disabled={!chat}
            className="group flex-1 flex items-center gap-2 text-left rounded px-2 -mx-2 hover:bg-slate-800 transition disabled:cursor-default disabled:hover:bg-transparent"
          >
            <div className="flex-1">
              <h1 className="text-xl font-bold text-slate-100">{title}</h1>
              {chat &&
                (typingNames.length > 0 ? (
                  <p className="text-xs text-amber-400 italic">
                    {typingText(typingNames)}
                    <span className="typing-dots" />
                  </p>
                ) : !chat.isPrivate ? (
                  <p className="text-xs text-slate-400">
                    {members.length > 0
                      ? `${members.length} ${members.length === 1 ? "member" : "members"}`
                      : "Loading..."}
                  </p>
                ) : null)}
            </div>
            {chat && (
              <span
                className="text-slate-500 group-hover:text-amber-400 transition text-3xl leading-none"
                aria-hidden="true"
              >
                ›
              </span>
            )}
          </button>
        </header>

        <header
          className={`absolute inset-0 flex items-center gap-4 p-4 border-b border-slate-700 bg-slate-900/80 backdrop-blur transition-transform duration-200 ${
            selectionMode ? "translate-y-0" : "-translate-y-full"
          }`}
        >
          <button
            onClick={clearSelection}
            className="text-slate-400 hover:text-slate-100 text-2xl leading-none"
            aria-label="Cancel selection"
          >
            ✕
          </button>
          <span className="flex-1 font-semibold text-slate-100">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-4 text-xl">
            <button onClick={copySelected} aria-label="Copy" title="Copy">
              📋
            </button>
            {selectedIds.size === 1 && ownSelectedIds.length === 1 && (
              <button onClick={editSelected} aria-label="Edit" title="Edit">
                ✏️
              </button>
            )}
            {ownSelectedIds.length > 0 && (
              <button
                onClick={() => setBulkDeleteOpen(true)}
                aria-label="Delete"
                title="Delete"
              >
                🗑️
              </button>
            )}
          </div>
        </header>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 pt-[88px] flex flex-col">
        <div className="mt-auto space-y-3">
        {(chatLoading || messagesLoading) && (
          <p className="text-slate-400 text-center">Loading...</p>
        )}

        {(loadError || actionError || messagesError) && (
          <div className="text-sm text-red-400 bg-red-950 border border-red-900 rounded p-3">
            {loadError ?? actionError ?? "Failed to load messages"}
          </div>
        )}

        {!chatLoading &&
          !messagesLoading &&
          !loadError &&
          !actionError &&
          !messagesError &&
          messages.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <p>No messages yet. Be the first to write something!</p>
            </div>
          )}

        {messages.map((msg, index) => {
          const prev = messages[index - 1];
          const showDate =
            !prev || !isSameDay(prev.createdAt, msg.createdAt);
          return (
            <Fragment key={msg.id}>
              {showDate && (
                <div className="flex justify-center my-2">
                  <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
                    {formatDateSeparator(msg.createdAt)}
                  </span>
                </div>
              )}
              <MessageBubble
                message={msg}
                isOwn={msg.userId === userId}
                authorName={userNameById.get(msg.userId)}
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
            </Fragment>
          );
        })}
        <div ref={bottomRef} />
        </div>
      </div>

      {isInfoOpen && chat && (
        <ChatInfoModal
          chat={chat}
          onClose={() => setIsInfoOpen(false)}
          onDeleted={() => navigate("/chats", { replace: true })}
        />
      )}

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

      {!loadError && !actionError && (
        <div className="relative border-t border-slate-700 bg-slate-900 sticky bottom-0">
          {editingMessage && (
            <div className="flex items-center gap-3 px-4 pt-3 -mb-1">
              <span className="text-amber-400 text-lg leading-none">✏️</span>
              <div className="flex-1 min-w-0 border-l-2 border-amber-500 pl-3">
                <p className="text-xs font-medium text-amber-400">Editing</p>
                <p className="text-sm text-slate-300 truncate">
                  {editingMessage.content}
                </p>
              </div>
              <button
                type="button"
                onClick={cancelEdit}
                aria-label="Cancel editing"
                className="text-slate-400 hover:text-slate-100 text-2xl leading-none"
              >
                ×
              </button>
            </div>
          )}
          <form onSubmit={handleSend} className="flex gap-2 p-4">
            <input
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
              className="flex-1 px-3 py-2 rounded bg-slate-800 border border-slate-600 text-slate-100 focus:outline-none focus:border-amber-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={sending || saving || !input.trim()}
              className="px-5 py-2 rounded bg-amber-600 hover:bg-amber-500 text-white disabled:bg-slate-700 disabled:cursor-not-allowed font-medium transition"
            >
              {sending || saving ? "..." : editingId !== null ? "Save" : "Send"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
