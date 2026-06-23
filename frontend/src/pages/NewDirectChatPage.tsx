import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGetUserByIdQuery } from "../store/userApi";
import { useCreateDirectChatAndSendMessageMutation } from "../store/messageApi";
import type { AxiosBaseQueryError } from "../api/axiosBaseQuery";

export function NewDirectChatPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const otherUserId = Number(userId);
  const isValidUser = Number.isFinite(otherUserId);

  const [input, setInput] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);

  const { data: partner, isLoading: loading, error: partnerError } =
    useGetUserByIdQuery(otherUserId, { skip: !isValidUser });
  const [createDirectChatAndSendMessage, { isLoading: sending }] =
    useCreateDirectChatAndSendMessageMutation();

  const loadError = useMemo(() => {
    if (!isValidUser) return "Invalid user id";
    if (!partnerError) return null;
    const status = (partnerError as AxiosBaseQueryError).status;
    return status === 404 ? "User not found" : "Failed to load user";
  }, [isValidUser, partnerError]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending) return;

    try {
      const message = await createDirectChatAndSendMessage({
        otherUserId,
        content,
      }).unwrap();
      navigate(`/chats/${message.chatId}`, { replace: true });
    } catch {
      setSendError("Failed to send message");
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

        {(loadError || sendError) && (
          <div className="text-sm text-red-400 bg-red-950 border border-red-900 rounded p-3">
            {loadError ?? sendError}
          </div>
        )}

        {!loading && !loadError && !sendError && (
          <div className="text-center py-12 text-slate-400">
            <p>No messages yet. Write something to start the conversation!</p>
          </div>
        )}
      </div>

      {!loadError && !sendError && !loading && (
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
