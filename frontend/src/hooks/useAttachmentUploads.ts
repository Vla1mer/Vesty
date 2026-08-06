import { useCallback, useRef, useState } from "react";
import {
  MAX_ATTACHMENT_SIZE,
  MAX_ATTACHMENTS_PER_MESSAGE,
  deleteAttachment,
  uploadAttachment,
} from "../api/attachments";
import type { MessageAttachmentDto } from "../types/api";

let lastLocalId = 0;

export interface PendingUpload {
  localId: string;
  fileName: string;
  contentType: string;
  sizeInBytes: number;
  previewUrl?: string;
  progress: number;
  error?: string;
  attachment?: MessageAttachmentDto;
}

export function useAttachmentUploads(chatId: number) {
  const [uploads, setUploads] = useState<PendingUpload[]>([]);
  const controllers = useRef(new Map<string, AbortController>());
  const discarded = useRef(new Set<string>());

  const update = useCallback(
    (localId: string, patch: Partial<PendingUpload>) =>
      setUploads((prev) =>
        prev.map((u) => (u.localId === localId ? { ...u, ...patch } : u))
      ),
    []
  );

  const remove = useCallback((localId: string) => {
    if (controllers.current.has(localId)) discarded.current.add(localId);
    controllers.current.get(localId)?.abort();
    controllers.current.delete(localId);
    setUploads((prev) => {
      const target = prev.find((u) => u.localId === localId);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      if (target?.attachment) void deleteAttachment(target.attachment.id).catch(() => {});
      return prev.filter((u) => u.localId !== localId);
    });
  }, []);

  const clear = useCallback((discardUploaded = false) => {
    if (discardUploaded) {
      controllers.current.forEach((_, localId) => discarded.current.add(localId));
    }
    controllers.current.forEach((controller) => controller.abort());
    controllers.current.clear();
    setUploads((prev) => {
      prev.forEach((u) => {
        if (u.previewUrl) URL.revokeObjectURL(u.previewUrl);
        if (discardUploaded && u.attachment) {
          void deleteAttachment(u.attachment.id).catch(() => {});
        }
      });
      return [];
    });
  }, []);

  const add = useCallback(
    (files: File[]) => {
      const room = MAX_ATTACHMENTS_PER_MESSAGE - uploads.length;
      const accepted = files.slice(0, Math.max(room, 0));

      const started = accepted.map<PendingUpload>((file) => {
        const localId = `upload-${++lastLocalId}`;
        const tooLarge = file.size > MAX_ATTACHMENT_SIZE;

        if (!tooLarge) {
          const controller = new AbortController();
          controllers.current.set(localId, controller);

          uploadAttachment(
            chatId,
            file,
            (progress) => update(localId, { progress }),
            controller.signal
          )
            .then((attachment) => {
              if (discarded.current.has(localId)) {
                discarded.current.delete(localId);
                void deleteAttachment(attachment.id).catch(() => {});
                return;
              }
              update(localId, { attachment, progress: 100 });
            })
            .catch((error) => {
              if (controller.signal.aborted) return;
              update(localId, { error: "Upload failed", progress: 0 });
              void error;
            })
            .finally(() => controllers.current.delete(localId));
        }

        return {
          localId,
          fileName: file.name,
          contentType: file.type,
          sizeInBytes: file.size,
          previewUrl: file.type.startsWith("image/")
            ? URL.createObjectURL(file)
            : undefined,
          progress: 0,
          error: tooLarge ? "File is larger than 10 MB" : undefined,
        };
      });

      setUploads((prev) => [...prev, ...started]);
    },
    [chatId, update, uploads.length]
  );

  const readyIds = uploads
    .map((u) => u.attachment?.id)
    .filter((id): id is number => id !== undefined);

  const isUploading = uploads.some((u) => !u.attachment && !u.error);

  return { uploads, add, remove, clear, readyIds, isUploading };
}
