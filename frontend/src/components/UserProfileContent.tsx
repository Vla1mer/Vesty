import { Lock, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { Avatar } from "./Avatar";
import { Button } from "./ui/Button";
import type { UserDto } from "../types/api";

interface Props {
  user: UserDto;
}

export function UserProfileContent({ user }: Props) {
  const { userId: currentUserId } = useAuth();
  const navigate = useNavigate();

  const isMe = user.id === currentUserId;
  const fullName = [user.name, user.surname].filter(Boolean).join(" ");

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <Avatar
          userId={user.id}
          userName={user.userName}
          name={user.name}
          surname={user.surname}
          avatarUpdatedAt={user.avatarUpdatedAt}
          size="xl"
        />
        <div className="w-full min-w-0">
          <h2 className="break-words text-xl font-bold text-content">
            {user.userName}
          </h2>
          {fullName && (
            <p className="break-words text-sm text-content-muted">{fullName}</p>
          )}
        </div>
      </div>

      {user.isProfileHidden && (
        <p className="flex items-center justify-center gap-2 rounded-card border border-line bg-surface-muted p-3 text-sm text-content-muted">
          <Lock size={15} aria-hidden="true" className="shrink-0" />
          This user has hidden their profile
        </p>
      )}

      {!isMe && (
        <Button fullWidth onClick={() => navigate(`/chats/new/${user.id}`)}>
          <MessageSquare size={16} aria-hidden="true" />
          Message
        </Button>
      )}
    </div>
  );
}
