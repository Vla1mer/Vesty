import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { ACCEPTED_IMAGE_TYPES, cropToSquare } from "../utils/image";

interface AvatarUploadProps {
  preview: ReactNode;
  hasAvatar: boolean;
  uploading: boolean;
  removing: boolean;
  onUpload: (file: Blob) => Promise<void>;
  onRemove: () => Promise<void>;
}

export function AvatarUpload({
  preview,
  hasAvatar,
  uploading,
  removing,
  onUpload,
  onRemove,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
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
      await onUpload(await cropToSquare(file));
    } catch {
      setError("Could not upload the photo. Try another image.");
    }
  }

  async function handleRemove() {
    setError(null);
    try {
      await onRemove();
    } catch {
      setError("Could not remove the photo.");
    }
  }

  return (
    <div className="flex items-center gap-4">
      {preview}

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

          {hasAvatar && (
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
