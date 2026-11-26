import { useState } from "react";
import { Check, Clock, UserPlus } from "lucide-react";
import { useLanguage } from "../context/useLanguage";
import {
  useAcceptFriendRequestMutation,
  useGetFriendRequestsQuery,
  useGetFriendsQuery,
  useSendFriendRequestMutation,
} from "../store/friendApi";
import { parseApiErrors } from "../utils/apiError";
import { Button } from "./ui/Button";

interface Props {
  userId: number;
  compact?: boolean;
}

export function FriendButton({ userId, compact = false }: Props) {
  const { t } = useLanguage();
  const { data: friends = [] } = useGetFriendsQuery();
  const { data: requests = [] } = useGetFriendRequestsQuery();
  const [sendRequest, sendState] = useSendFriendRequestMutation();
  const [acceptRequest, acceptState] = useAcceptFriendRequestMutation();
  const [error, setError] = useState<string | null>(null);

  const iconSize = compact ? 13 : 16;
  const buttonSize = compact ? "xs" : "md";
  const labelClass = `flex shrink-0 items-center gap-1.5 text-content-muted ${
    compact ? "text-xs" : "px-4 py-2 text-sm"
  }`;

  async function run(action: (id: number) => { unwrap: () => Promise<unknown> }) {
    setError(null);
    try {
      await action(userId).unwrap();
    } catch (err) {
      setError(parseApiErrors(err, t("friends.actionFailed")).generalError ?? null);
    }
  }

  function withError(button: React.ReactNode) {
    if (!error) return button;
    return (
      <span className={`flex flex-col gap-1 ${compact ? "items-end" : "items-center"}`}>
        {button}
        <span role="alert" className="text-xs text-danger">
          {error}
        </span>
      </span>
    );
  }

  if (friends.some((f) => f.userId === userId)) {
    return (
      <span className={labelClass}>
        <Check size={iconSize} aria-hidden="true" /> {t("friends.alreadyFriend")}
      </span>
    );
  }

  const request = requests.find((r) => r.userId === userId);

  if (request?.isIncoming) {
    return withError(
      <Button
        variant="neutral"
        size={buttonSize}
        disabled={acceptState.isLoading}
        onClick={() => run(acceptRequest)}
      >
        <Check size={iconSize} aria-hidden="true" /> {t("friends.accept")}
      </Button>
    );
  }

  if (request) {
    return (
      <span className={labelClass}>
        <Clock size={iconSize} aria-hidden="true" /> {t("users.requestPending")}
      </span>
    );
  }

  return withError(
    <Button
      variant="neutral"
      size={buttonSize}
      disabled={sendState.isLoading}
      onClick={() => run(sendRequest)}
    >
      <UserPlus size={iconSize} aria-hidden="true" /> {t("users.addFriend")}
    </Button>
  );
}
