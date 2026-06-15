import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getChatById, getChatMembers } from "../api/chats";
import {
  getMessagesByChat,
  createMessage,
  updateMessage,
  deleteMessage,
} from "../api/messages";
import { useAuth } from "../context/useAuth";
import { MessageBubble } from "../components/MessageBubble";
import { ChatInfoModal } from "../components/ChatInfoModal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { getChatDisplayName } from "../utils/chats";
import {
  onMessageReceived,
  onMessageUpdated,
  onMessageDeleted,
  onChatDeleted,
  onChatRenamed,
  onReconnected,
} from "../lib/signalr";
import type { ChatDto, MessageDto, ChatMemberWithRoleDto } from "../types/api";
import type { AxiosError } from "axios";

export function ChatDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const chatId = Number(id);

  const [chat, setChat] = useState<ChatDto | null>(null);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [members, setMembers] = useState<ChatMemberWithRoleDto[]>([]);
  const [loading, setLoading] = useState(Number.isFinite(chatId));
  const [error, setError] = useState<string | null>(
    Number.isFinite(chatId) ? null : "Invalid chat id"
  );
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deletingMessage, setDeletingMessage] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);

  const userNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const m of members) map.set(m.userId, m.userName);
    return map;
  }, [members]);

  useEffect(() => {
    if (!Number.isFinite(chatId)) {
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const [chatData, messagesData, membersData] = await Promise.all([
          getChatById(chatId),
          getMessagesByChat(chatId),
          getChatMembers(chatId),
        ]);
        if (!cancelled) {
          setChat(chatData);
          setMessages(messagesData);
          setMembers(membersData);
        }
      } catch (err) {
        const axiosErr = err as AxiosError;
        if (!cancelled) {
          if (axiosErr.response?.status === 403) {
            setError("You don't have access to this chat");
          } else if (axiosErr.response?.status === 404) {
            setError("Chat not found");
          } else {
            setError("Failed to load chat");
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chatId, reloadKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!Number.isFinite(chatId)) return;

    const unsubscribeReceived = onMessageReceived((message) => {
      if (message.chatId !== chatId) return;
      setMessages((prev) =>
        prev.some((m) => m.id === message.id) ? prev : [...prev, message]
      );
    });

    const unsubscribeUpdated = onMessageUpdated((message) => {
      if (message.chatId !== chatId) return;
      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? message : m))
      );
    });

    const unsubscribeDeleted = onMessageDeleted((eventChatId, messageId) => {
      if (eventChatId !== chatId) return;
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    });

    const unsubscribeChatDeleted = onChatDeleted((deletedChatId) => {
      if (deletedChatId !== chatId) return;
      navigate("/chats", { replace: true });
    });

    const unsubscribeChatRenamed = onChatRenamed((renamedChatId, name) => {
      if (renamedChatId !== chatId) return;
      setChat((prev) => (prev ? { ...prev, name } : prev));
    });

    const unsubscribeReconnected = onReconnected(() => {
      setReloadKey((key) => key + 1);
    });

    return () => {
      unsubscribeReceived();
      unsubscribeUpdated();
      unsubscribeDeleted();
      unsubscribeChatDeleted();
      unsubscribeChatRenamed();
      unsubscribeReconnected();
    };
  }, [chatId, navigate]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending) return;

    setSending(true);
    try {
      const created = await createMessage(chatId, { content });
      setMessages((prev) =>
        prev.some((m) => m.id === created.id) ? prev : [...prev, created]
      );
      setInput("");
    } catch {
      setError("Failed to send message");
    } finally {
      setSending(false);
    }
  }

  async function handleEditMessage(id: number, content: string) {
    await updateMessage(chatId, id, content);
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content } : m))
    );
  }

  async function confirmDeleteMessage() {
    if (deleteTargetId === null) return;
    setDeletingMessage(true);
    try {
      await deleteMessage(deleteTargetId);
      setMessages((prev) => prev.filter((m) => m.id !== deleteTargetId));
      setDeleteTargetId(null);
    } catch {
      setError("Failed to delete message");
    } finally {
      setDeletingMessage(false);
    }
  }

  const title = chat ? getChatDisplayName(chat) : `Chat #${chatId}`;

  return (
    <div className="min-h-screen flex flex-col max-w-4xl mx-auto">
      <header className="flex items-center gap-4 p-4 border-b border-slate-700 bg-slate-900 sticky top-0 z-10">
        <button
          onClick={() => navigate("/chats")}
          className="text-slate-400 hover:text-slate-100 text-2xl"
          aria-label="Back"
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => chat && setIsInfoOpen(true)}
          disabled={!chat}
          className="group flex-1 flex items-center gap-2 text-left rounded px-2 py-1 -mx-2 hover:bg-slate-800 transition disabled:cursor-default disabled:hover:bg-transparent"
        >
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-100">{title}</h1>
            {chat && (
              <p className="text-xs text-slate-400">
                {members.length > 0
                  ? `${members.length} ${members.length === 1 ? "member" : "members"}`
                  : "Loading..."}
              </p>
            )}
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

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && <p className="text-slate-400 text-center">Loading...</p>}

        {error && (
          <div className="text-sm text-red-400 bg-red-950 border border-red-900 rounded p-3">
            {error}
          </div>
        )}

        {!loading && !error && messages.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <p>No messages yet. Be the first to write something!</p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.userId === userId}
            authorName={userNameById.get(msg.userId)}
            onEdit={msg.userId === userId ? handleEditMessage : undefined}
            onDelete={
              msg.userId === userId ? (id) => setDeleteTargetId(id) : undefined
            }
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {isInfoOpen && chat && (
        <ChatInfoModal
          chat={chat}
          onClose={() => setIsInfoOpen(false)}
          onDeleted={() => navigate("/chats", { replace: true })}
          onRenamed={(newName) =>
            setChat((prev) => (prev ? { ...prev, name: newName } : prev))
          }
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

      {!error && (
        <form
          onSubmit={handleSend}
          className="flex gap-2 p-4 border-t border-slate-700 bg-slate-900 sticky bottom-0"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            maxLength={2000}
            disabled={sending}
            className="flex-1 px-3 py-2 rounded bg-slate-800 border border-slate-600 text-slate-100 focus:outline-none focus:border-amber-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="px-5 py-2 rounded bg-amber-600 hover:bg-amber-500 text-white disabled:bg-slate-700 disabled:cursor-not-allowed font-medium transition"
          >
            {sending ? "..." : "Send"}
          </button>
        </form>
      )}
    </div>
  );
}
