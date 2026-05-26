import type { MessageDto } from "../types/api";

interface Props {
  message: MessageDto;
  isOwn: boolean;
  authorName?: string;
}

export function MessageBubble({ message, isOwn, authorName }: Props) {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const displayName = authorName ?? `User #${message.userId}`;

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-md rounded-2xl px-4 py-2 ${
          isOwn
            ? "bg-amber-600 text-white rounded-br-sm"
            : "bg-slate-700 text-slate-100 rounded-bl-sm"
        }`}
      >
        {!isOwn && (
          <p className="text-xs text-amber-300 font-medium mb-1">{displayName}</p>
        )}
        <p className="break-words whitespace-pre-wrap">{message.content}</p>
        <p
          className={`text-xs mt-1 ${
            isOwn ? "text-amber-100" : "text-slate-400"
          } text-right`}
        >
          {time}
        </p>
      </div>
    </div>
  );
}
