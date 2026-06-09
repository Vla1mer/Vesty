import { useState } from "react";
import type { FormEvent } from "react";
import type { MessageDto } from "../types/api";

interface Props {
  message: MessageDto;
  isOwn: boolean;
  authorName?: string;
  onEdit?: (id: number, content: string) => Promise<void>;
  onDelete?: (id: number) => void;
}

export function MessageBubble({
  message,
  isOwn,
  authorName,
  onEdit,
  onDelete,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(message.content ?? "");
  const [saving, setSaving] = useState(false);

  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const displayName = authorName ?? `User #${message.userId}`;

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content || saving || !onEdit) return;

    setSaving(true);
    try {
      await onEdit(message.id, content);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function startEdit() {
    setDraft(message.content ?? "");
    setIsEditing(true);
  }

  return (
    <div className={`group flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className="flex flex-col max-w-md">
        {/* Hover-меню — только для своих сообщений и не в режиме редактирования */}
        {isOwn && !isEditing && (onEdit || onDelete) && (
          <div className="flex gap-1 justify-end mb-1 opacity-0 group-hover:opacity-100 transition">
            {onEdit && (
              <button
                type="button"
                onClick={startEdit}
                className="text-xs px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 transition"
              >
                ✏️ Edit
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(message.id)}
                className="text-xs px-2 py-0.5 rounded bg-red-900 hover:bg-red-800 text-red-100 transition"
              >
                🗑️ Delete
              </button>
            )}
          </div>
        )}

        <div
          className={`rounded-2xl px-4 py-2 ${
            isOwn
              ? "bg-amber-600 text-white rounded-br-sm"
              : "bg-slate-700 text-slate-100 rounded-bl-sm"
          }`}
        >
          {!isOwn && (
            <p className="text-xs text-amber-300 font-medium mb-1">{displayName}</p>
          )}

          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                autoFocus
                rows={2}
                maxLength={2000}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setIsEditing(false);
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSave(e);
                }}
                className="w-full px-2 py-1 rounded bg-amber-700 text-white placeholder-amber-200 focus:outline-none resize-none text-sm"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                  className="text-xs px-2 py-1 rounded bg-amber-800 hover:bg-amber-900 text-white disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !draft.trim()}
                  className="text-xs px-2 py-1 rounded bg-white text-amber-700 font-medium hover:bg-amber-100 disabled:opacity-50"
                >
                  {saving ? "..." : "Save"}
                </button>
              </div>
            </form>
          ) : (
            <p className="break-words whitespace-pre-wrap">{message.content}</p>
          )}

          {!isEditing && (
            <p
              className={`text-xs mt-1 ${
                isOwn ? "text-amber-100" : "text-slate-400"
              } text-right`}
            >
              {time}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
