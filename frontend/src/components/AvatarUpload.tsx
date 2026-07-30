import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { ACCEPTED_IMAGE_TYPES, cropToSquare } from "../utils/image";
import { Button } from "./ui/Button";

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
          <Button size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
            {uploading ? "Uploading..." : "Upload photo"}
          </Button>

          {hasAvatar && (
            <Button size="sm" variant="neutral" disabled={busy} onClick={handleRemove}>
              {removing ? "Removing..." : "Remove"}
            </Button>
          )}
        </div>

        <p className="text-xs text-content-muted">JPEG, PNG or WebP</p>
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
