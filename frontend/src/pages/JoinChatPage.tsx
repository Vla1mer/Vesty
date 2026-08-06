import { Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import {
  useJoinChatByInviteMutation,
  usePreviewChatInviteQuery,
} from "../store/chatInvitesApi";
import { getApiErrorMessage } from "../utils/apiError";
import { ChatAvatar } from "../components/Avatar";
import { Button } from "../components/ui/Button";
import { FormError } from "../components/FormError";

export function JoinChatPage() {
  const { code = "" } = useParams();
  const navigate = useNavigate();
  const { data: preview, isLoading, isError } = usePreviewChatInviteQuery(code);
  const [joinChat, { isLoading: joining }] = useJoinChatByInviteMutation();
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    setError(null);
    try {
      const chat = await joinChat(code).unwrap();
      navigate(`/chats/${chat.id}`, { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to join the chat"));
    }
  }

  return (
    <div className="flex min-h-viewport items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-card border border-line bg-surface p-6 text-center shadow-md">
        {isLoading ? (
          <p className="text-sm text-content-muted">Checking the link...</p>
        ) : isError || !preview ? (
          <>
            <h1 className="text-lg font-semibold text-content">
              This link is no longer valid
            </h1>
            <p className="mt-2 text-sm text-content-muted">
              It may have been revoked or has expired.
            </p>
            <Button className="mt-5" fullWidth onClick={() => navigate("/chats")}>
              Back to chats
            </Button>
          </>
        ) : (
          <>
            <div className="flex justify-center">
              <ChatAvatar
                chatId={preview.chatId}
                name={preview.name ?? "Group"}
                avatarUpdatedAt={preview.avatarUpdatedAt}
                size="xl"
              />
            </div>

            <h1 className="mt-4 text-lg font-semibold text-content">
              {preview.name ?? "Group chat"}
            </h1>

            <p className="mt-1 flex items-center justify-center gap-1 text-sm text-content-muted">
              <Users size={14} aria-hidden="true" />
              {preview.memberCount}{" "}
              {preview.memberCount === 1 ? "member" : "members"}
            </p>

            {preview.description && (
              <p className="mt-3 whitespace-pre-line text-sm text-content-muted">
                {preview.description}
              </p>
            )}

            <FormError message={error} className="mt-4" />

            <Button
              className="mt-5"
              fullWidth
              onClick={handleJoin}
              disabled={joining}
            >
              {joining
                ? "..."
                : preview.alreadyMember
                ? "Open chat"
                : "Join chat"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
