import { useState } from "react";
import {
  fetchAttachmentBlob,
  formatSize,
  isAudio,
  isImage,
} from "../api/attachments";
import { useAttachmentBlob } from "../hooks/useAttachmentBlob";
import type { MessageAttachmentDto } from "../types/api";

async function download(attachment: MessageAttachmentDto) {
  const blob = await fetchAttachmentBlob(attachment.id);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = attachment.fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function ImageAttachment({
  attachment,
  onOpen,
}: {
  attachment: MessageAttachmentDto;
  onOpen: (url: string) => void;
}) {
  const { url, failed } = useAttachmentBlob(attachment.id, true);

  if (failed) return <FileAttachment attachment={attachment} />;

  if (!url) {
    return <div className="w-44 h-32 rounded bg-surface-raised animate-pulse" />;
  }

  return (
    <button type="button" onClick={() => onOpen(url)} className="block">
      <img
        src={url}
        alt={attachment.fileName}
        className="max-w-44 max-h-44 rounded object-cover hover:opacity-90 transition"
      />
    </button>
  );
}

function AudioAttachment({ attachment }: { attachment: MessageAttachmentDto }) {
  const { url, failed } = useAttachmentBlob(attachment.id, true);

  if (failed) return <FileAttachment attachment={attachment} />;
  if (!url) return <div className="w-56 h-10 rounded bg-surface-raised animate-pulse" />;

  return <audio controls src={url} className="max-w-56" />;
}

function FileAttachment({ attachment }: { attachment: MessageAttachmentDto }) {
  return (
    <button
      type="button"
      onClick={() => download(attachment)}
      className="flex items-center gap-2 rounded bg-surface-raised/80 hover:bg-surface-raised border border-line-strong px-3 py-2 text-left transition"
    >
      <span className="text-xl leading-none">📄</span>
      <span className="min-w-0">
        <span className="block text-xs text-content truncate max-w-40">
          {attachment.fileName}
        </span>
        <span className="block text-[10px] text-content-muted">
          {formatSize(attachment.sizeInBytes)}
        </span>
      </span>
      <span className="text-content-muted text-sm">⬇</span>
    </button>
  );
}

interface MessageAttachmentsProps {
  attachments: MessageAttachmentDto[];
}

export function MessageAttachments({ attachments }: MessageAttachmentsProps) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (attachments.length === 0) return null;

  return (
    <>
      <div className="flex flex-col gap-2 mt-2">
        {attachments.map((attachment) =>
          isImage(attachment.contentType) ? (
            <ImageAttachment
              key={attachment.id}
              attachment={attachment}
              onOpen={setLightbox}
            />
          ) : isAudio(attachment.contentType) ? (
            <AudioAttachment key={attachment.id} attachment={attachment} />
          ) : (
            <FileAttachment key={attachment.id} attachment={attachment} />
          )
        )}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt="Attachment"
            className="max-w-full max-h-full rounded"
          />
        </div>
      )}
    </>
  );
}
