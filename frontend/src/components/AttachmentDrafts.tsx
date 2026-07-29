import { formatSize } from "../api/attachments";
import type { PendingUpload } from "../hooks/useAttachmentUploads";

interface AttachmentDraftsProps {
  uploads: PendingUpload[];
  onRemove: (localId: string) => void;
}

export function AttachmentDrafts({ uploads, onRemove }: AttachmentDraftsProps) {
  if (uploads.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto px-4 pt-3 pb-1 scrollbar-none">
      {uploads.map((upload) => (
        <div
          key={upload.localId}
          className={`relative shrink-0 w-28 rounded border p-2 ${
            upload.error
              ? "border-danger/40 bg-danger-soft"
              : "border-line bg-surface-raised"
          }`}
        >
          <button
            type="button"
            onClick={() => onRemove(upload.localId)}
            aria-label="Remove attachment"
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-surface-overlay hover:bg-line-strong text-content text-xs leading-none"
          >
            ×
          </button>

          {upload.previewUrl ? (
            <img
              src={upload.previewUrl}
              alt={upload.fileName}
              className="w-full h-16 object-cover rounded mb-1"
            />
          ) : (
            <div className="w-full h-16 rounded mb-1 bg-surface flex items-center justify-center text-2xl">
              📄
            </div>
          )}

          <p className="text-[11px] text-content truncate" title={upload.fileName}>
            {upload.fileName}
          </p>

          {upload.error ? (
            <p className="text-[10px] text-danger">{upload.error}</p>
          ) : upload.attachment ? (
            <p className="text-[10px] text-content-muted">
              {formatSize(upload.sizeInBytes)}
            </p>
          ) : (
            <div className="h-1 mt-1 rounded bg-surface-overlay overflow-hidden">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${upload.progress}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
