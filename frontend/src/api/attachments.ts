import { api, API_URL } from "./client";
import { endpoints } from "./endpoints";
import type { MessageAttachmentDto } from "../types/api";

export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
export const MAX_ATTACHMENTS_PER_MESSAGE = 10;

export function attachmentUrl(id: number): string {
  return `${API_URL}${endpoints.message.attachment(id)}`;
}

export function isImage(contentType: string): boolean {
  return contentType.startsWith("image/");
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function uploadAttachment(
  chatId: number,
  file: File,
  onProgress: (percent: number) => void,
  signal: AbortSignal
): Promise<MessageAttachmentDto> {
  const form = new FormData();
  form.append("file", file, file.name);

  const response = await api.post<MessageAttachmentDto>(
    endpoints.message.attachments(chatId),
    form,
    {
      signal,
      onUploadProgress: (event) => {
        if (!event.total) return;
        onProgress(Math.round((event.loaded * 100) / event.total));
      },
    }
  );

  return response.data;
}
