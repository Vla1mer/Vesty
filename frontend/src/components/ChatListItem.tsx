import { NavLink } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { Avatar, ChatAvatar } from "./Avatar";
import { getChatDisplayName } from "../utils/chats";
import { formatListTime } from "../utils/date";
import { isDirectChat, type ChatDto } from "../types/api";

interface Props {
  chat: ChatDto;
}

export function ChatListItem({ chat }: Props) {
  const { userId } = useAuth();
  const title = getChatDisplayName(chat);

  const sender =
    !chat.isPrivate && chat.lastMessageContent
      ? chat.lastMessageSenderId === userId
        ? "You"
        : chat.lastMessageSenderName
      : null;

  return (
    <NavLink
      to={`/chats/${chat.id}`}
      className={({ isActive }) =>
        `block mx-2 rounded-card px-3 py-1.5 transition cursor-pointer ${
          isActive ? "bg-accent" : "hover:bg-surface-muted"
        }`
      }
    >
      {({ isActive }) => (
        <div className="flex items-center gap-3">
          {isDirectChat(chat) && chat.partnerUserId ? (
            <Avatar
              userId={chat.partnerUserId}
              userName={chat.partnerUserName ?? undefined}
              avatarUpdatedAt={chat.partnerAvatarUpdatedAt}
              size="lg"
            />
          ) : (
            <ChatAvatar
              chatId={chat.id}
              name={title}
              avatarUpdatedAt={chat.avatarUpdatedAt}
              size="lg"
            />
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <h3
                className={`text-[15px] font-semibold truncate ${
                  isActive ? "text-accent-contrast" : "text-content"
                }`}
              >
                {title}
              </h3>
              {chat.lastMessageAt && (
                <span
                  className={`shrink-0 text-xs ${
                    isActive ? "text-accent-contrast/70" : "text-content-subtle"
                  }`}
                >
                  {formatListTime(chat.lastMessageAt)}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 mt-0.5">
              {chat.lastMessageContent ? (
                <p
                  className={`text-sm truncate ${
                    isActive ? "text-accent-contrast/75" : "text-content-muted"
                  }`}
                >
                  {sender && (
                    <span
                      className={`font-medium ${
                        isActive ? "text-accent-contrast" : "text-accent-strong"
                      }`}
                    >
                      {sender}:{" "}
                    </span>
                  )}
                  {chat.lastMessageContent}
                </p>
              ) : (
                <span />
              )}
              {!!chat.unreadCount && chat.unreadCount > 0 && (
                <span
                  className={`shrink-0 min-w-5 h-5 px-1.5 flex items-center justify-center rounded-full text-xs font-bold ${
                    isActive
                      ? "bg-accent-contrast text-accent"
                      : "bg-accent text-accent-contrast"
                  }`}
                >
                  {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </NavLink>
  );
}
