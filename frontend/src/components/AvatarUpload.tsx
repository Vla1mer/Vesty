import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { Pencil } from "lucide-react";
import { ACCEPTED_IMAGE_TYPES, cropToSquare } from "../utils/image";
import { Button } from "./ui/Button";

interface AvatarUploadProps {
  preview: ReactNode;
  heading?: ReactNode;
  hasAvatar: boolean;
  uploading: boolean;
  removing: boolean;
  onUpload: (file: Blob) => Promise<void>;
  onRemove: () => Promise<void>;
}

export function AvatarUpload({
  preview,
  heading,
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
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        aria-label={hasAvatar ? "Change photo" : "Upload photo"}
        title={hasAvatar ? "Change photo" : "Upload photo"}
        className="group relative shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong disabled:cursor-not-allowed"
      >
        {preview}
        <span
          className={`pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-scrim/55 text-white transition-opacity duration-150 ${
            uploading
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
          }`}
        >
          <Pencil size={18} aria-hidden="true" />
        </span>
      </button>

      <div className="flex min-w-0 flex-col items-start gap-1.5">
        {heading}

        {hasAvatar && (
          <Button size="xs" variant="ghost" disabled={busy} onClick={handleRemove}>
            {removing ? "Removing..." : "Remove photo"}
          </Button>
        )}

        {error && <p className="text-xs text-danger">{error}</p>}
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
