import { Link } from "react-router-dom";
import { getChatDisplayName } from "../utils/chats";
import type { ChatDto } from "../types/api";

interface Props {
  chat: ChatDto;
}

export function ChatListItem({ chat }: Props) {
  const title = getChatDisplayName(chat);

  return (
    <Link
      to={`/chats/${chat.id}`}
      className="block rounded-lg border border-slate-700 bg-slate-800 p-4 hover:bg-slate-700 hover:border-amber-500 transition cursor-pointer"
    >
      <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
    </Link>
  );
}
