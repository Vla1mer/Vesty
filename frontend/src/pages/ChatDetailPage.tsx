import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getChatById, getChatMembers } from "../api/chats";
import { getMessagesByChat, createMessage } from "../api/messages";
import { useAuth } from "../context/useAuth";
import { MessageBubble } from "../components/MessageBubble";
import { MembersModal } from "../components/MembersModal";
import type { ChatDto, MessageDto, UserDto } from "../types/api";
import type { AxiosError } from "axios";

export function ChatDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const chatId = Number(id);

  const [chat, setChat] = useState<ChatDto | null>(null);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [members, setMembers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(Number.isFinite(chatId));
  const [error, setError] = useState<string | null>(
    Number.isFinite(chatId) ? null : "Invalid chat id"
  );
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  const userNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const m of members) map.set(m.id, m.userName);
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
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending) return;

    setSending(true);
    try {
      const created = await createMessage(chatId, { content });
      setMessages((prev) => [...prev, created]);
      setInput("");
    } catch {
      setError("Failed to send message");
    } finally {
      setSending(false);
    }
  }

  const title = chat?.name ?? (chat?.isPrivate ? "Direct chat" : `Chat #${chatId}`);

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
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-100">{title}</h1>
        </div>
        {chat && !chat.isPrivate && (
          <button
            onClick={() => setIsMembersOpen(true)}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm border border-slate-600 transition"
          >
            👥 Members
          </button>
        )}
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
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {isMembersOpen && (
        <MembersModal
          chatId={chatId}
          onClose={() => setIsMembersOpen(false)}
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
