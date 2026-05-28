import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUserById } from "../api/users";
import { sendDirectMessage } from "../api/messages";
import type { UserDto } from "../types/api";
import type { AxiosError } from "axios";

export function NewDirectChatPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const otherUserId = Number(userId);

  const [partner, setPartner] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(
    Number.isFinite(otherUserId) ? null : "Invalid user id"
  );
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(otherUserId)) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const user = await getUserById(otherUserId);
        if (!cancelled) setPartner(user);
      } catch (err) {
        const axiosErr = err as AxiosError;
        if (!cancelled) {
          setError(
            axiosErr.response?.status === 404
              ? "User not found"
              : "Failed to load user"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [otherUserId]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending) return;

    setSending(true);
    try {
      const result = await sendDirectMessage(otherUserId, { content });
      navigate(`/chats/${result.chat.id}`, { replace: true });
    } catch {
      setError("Failed to send message");
      setSending(false);
    }
  }

  const title = partner?.userName ?? "Loading...";

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
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && <p className="text-slate-400 text-center">Loading...</p>}

        {error && (
          <div className="text-sm text-red-400 bg-red-950 border border-red-900 rounded p-3">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="text-center py-12 text-slate-400">
            <p>No messages yet. Write something to start the conversation!</p>
          </div>
        )}
      </div>

      {!error && !loading && (
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
