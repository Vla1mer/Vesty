import { NavLink } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { Avatar } from "./Avatar";
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
        `block border-l-4 border-b border-slate-800 p-4 transition cursor-pointer ${
          isActive
            ? "border-l-amber-500 bg-slate-800"
            : "border-l-transparent hover:bg-slate-800/50"
        }`
      }
    >
      <div className="flex items-center gap-3">
        {isDirectChat(chat) && chat.partnerUserId ? (
          <Avatar
            userId={chat.partnerUserId}
            userName={chat.partnerUserName ?? undefined}
            avatarUpdatedAt={chat.partnerAvatarUpdatedAt}
          />
        ) : (
          <div className="shrink-0 w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-semibold text-slate-200">
            {title.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-lg font-semibold text-slate-100 truncate">{title}</h3>
            {chat.lastMessageAt && (
              <span className="shrink-0 text-xs text-slate-500">
                {formatListTime(chat.lastMessageAt)}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            {chat.lastMessageContent ? (
              <p className="text-sm text-slate-400 truncate">
                {sender && (
                  <span className="text-amber-400 font-medium">{sender}: </span>
                )}
                {chat.lastMessageContent}
              </p>
            ) : (
              <span />
            )}
            {!!chat.unreadCount && chat.unreadCount > 0 && (
              <span className="shrink-0 min-w-5 h-5 px-1.5 flex items-center justify-center rounded-full bg-amber-500 text-slate-900 text-xs font-bold">
                {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </NavLink>
  );
}
