import { Link } from "react-router-dom";
import type { ChatDto } from "../types/api";

interface Props {
  chat: ChatDto;
}

export function ChatListItem({ chat }: Props) {
  const title =
    chat.name ??
    (chat.isPrivate
      ? chat.partnerUserName ?? "Direct chat"
      : `Chat #${chat.id}`);

  return (
    <Link
      to={`/chats/${chat.id}`}
      className="block rounded-lg border border-slate-700 bg-slate-800 p-4 hover:bg-slate-700 hover:border-amber-500 transition cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
        <span
          className={`text-xs px-2 py-1 rounded ${
            chat.isPrivate
              ? "bg-orange-900 text-orange-200"
              : "bg-amber-900 text-amber-200"
          }`}
        >
          {chat.isPrivate ? "Private" : "Group"}
        </span>
      </div>
    </Link>
  );
}
