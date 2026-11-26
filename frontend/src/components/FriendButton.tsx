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
}

export function FriendButton({ userId }: Props) {
  const { t } = useLanguage();
  const { data: friends = [] } = useGetFriendsQuery();
  const { data: requests = [] } = useGetFriendRequestsQuery();
  const [sendRequest, sendState] = useSendFriendRequestMutation();
  const [acceptRequest, acceptState] = useAcceptFriendRequestMutation();

  if (friends.some((f) => f.userId === userId)) {
    return (
      <span className="flex items-center gap-1.5 px-4 py-2 text-sm text-content-muted">
        <Check size={16} aria-hidden="true" /> {t("friends.alreadyFriend")}
      </span>
    );
  }

  const request = requests.find((r) => r.userId === userId);

  if (request?.isIncoming) {
    return (
      <Button
        variant="neutral"
        disabled={acceptState.isLoading}
        onClick={() => acceptRequest(userId)}
      >
        <Check size={16} aria-hidden="true" /> {t("friends.accept")}
      </Button>
    );
  }

  if (request) {
    return (
      <span className="flex items-center gap-1.5 px-4 py-2 text-sm text-content-muted">
        <Clock size={16} aria-hidden="true" /> {t("users.requestPending")}
      </span>
    );
  }

  return (
    <Button
      variant="neutral"
      disabled={sendState.isLoading}
      onClick={() => sendRequest(userId)}
    >
      <UserPlus size={16} aria-hidden="true" /> {t("users.addFriend")}
    </Button>
  );
}
