import { NavLink } from "react-router-dom";
import { getChatDisplayName } from "../utils/chats";
import type { ChatDto } from "../types/api";

interface Props {
  chat: ChatDto;
}

export function ChatListItem({ chat }: Props) {
  const title = getChatDisplayName(chat);

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
      <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
    </NavLink>
  );
}
