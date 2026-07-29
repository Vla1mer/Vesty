import { useEffect, useState } from "react";
import { fetchAttachmentBlob } from "../api/attachments";

export function useAttachmentBlob(id: number, enabled: boolean) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    let objectUrl: string | null = null;
    let cancelled = false;

    fetchAttachmentBlob(id)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, enabled]);

  return { url, failed };
}
