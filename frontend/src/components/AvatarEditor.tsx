import { useRef, useState } from "react";
import { Avatar } from "./Avatar";
import {
  useUploadAvatarMutation,
  useDeleteAvatarMutation,
} from "../store/userApi";
import { ACCEPTED_IMAGE_TYPES, cropToSquare } from "../utils/image";
import type { UserDto } from "../types/api";

interface AvatarEditorProps {
  user: UserDto;
}

export function AvatarEditor({ user }: AvatarEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const [uploadAvatar, { isLoading: uploading }] = useUploadAvatarMutation();
  const [deleteAvatar, { isLoading: removing }] = useDeleteAvatarMutation();
  const busy = uploading || removing;

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError("Choose a JPEG, PNG or WebP image.");
      return;
    }

    try {
      const cropped = await cropToSquare(file);
      await uploadAvatar({ id: user.id, file: cropped }).unwrap();
    } catch {
      setError("Could not upload the photo. Try another image.");
    }
  }

  async function handleRemove() {
    setError(null);
    try {
      await deleteAvatar(user.id).unwrap();
    } catch {
      setError("Could not remove the photo.");
    }
  }

  return (
    <div className="flex items-center gap-4 pb-5 mb-5 border-b border-slate-700">
      <Avatar
        userId={user.id}
        userName={user.userName}
        name={user.name}
        surname={user.surname}
        avatarUpdatedAt={user.avatarUpdatedAt}
        size="xl"
      />

      <div className="flex flex-col gap-2 min-w-0">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium disabled:opacity-50 transition"
          >
            {uploading ? "Uploading..." : "Upload photo"}
          </button>

          {user.avatarUpdatedAt && (
            <button
              type="button"
              disabled={busy}
              onClick={handleRemove}
              className="px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-100 text-sm disabled:opacity-50 transition"
            >
              {removing ? "Removing..." : "Remove"}
            </button>
          )}
        </div>

        <p className="text-xs text-slate-400">JPEG, PNG or WebP</p>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}
