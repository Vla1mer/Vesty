import { Check, Clock, UserPlus } from "lucide-react";
import { useLanguage } from "../context/useLanguage";
import {
  useAcceptFriendRequestMutation,
  useGetFriendRequestsQuery,
  useGetFriendsQuery,
  useSendFriendRequestMutation,
} from "../store/friendApi";
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

  const iconSize = compact ? 13 : 16;
  const buttonSize = compact ? "xs" : "md";
  const labelClass = `flex shrink-0 items-center gap-1.5 text-content-muted ${
    compact ? "text-xs" : "px-4 py-2 text-sm"
  }`;

  if (friends.some((f) => f.userId === userId)) {
    return (
      <span className={labelClass}>
        <Check size={iconSize} aria-hidden="true" /> {t("friends.alreadyFriend")}
      </span>
    );
  }

  const request = requests.find((r) => r.userId === userId);

  if (request?.isIncoming) {
    return (
      <Button
        variant="neutral"
        size={buttonSize}
        disabled={acceptState.isLoading}
        onClick={() => acceptRequest(userId)}
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

  return (
    <Button
      variant="neutral"
      size={buttonSize}
      disabled={sendState.isLoading}
      onClick={() => sendRequest(userId)}
    >
      <UserPlus size={iconSize} aria-hidden="true" /> {t("users.addFriend")}
    </Button>
  );
}
