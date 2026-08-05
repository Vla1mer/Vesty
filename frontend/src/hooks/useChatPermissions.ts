import { useEffect, useState } from "react";
import { useUpdateChatPermissionsMutation } from "../store/chatsApi";
import { getApiErrorMessage } from "../utils/apiError";
import type { ChatDto, ChatPermissionsDto } from "../types/api";

type PermissionKey = keyof ChatPermissionsDto;

export function useChatPermissions(
  chat: ChatDto,
  onError: (message: string | null) => void
) {
  const [updateChatPermissions] = useUpdateChatPermissionsMutation();
  const [saved, setSaved] = useState<
    ({ chatId: number } & ChatPermissionsDto) | null
  >(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    setSaved(null);
  }, [chat.id, chat.whoCanInvite, chat.whoCanEdit, chat.whoCanPost]);

  const levels =
    saved?.chatId === chat.id
      ? saved
      : {
          chatId: chat.id,
          whoCanInvite: chat.whoCanInvite,
          whoCanEdit: chat.whoCanEdit,
          whoCanPost: chat.whoCanPost,
        };

  async function change(key: PermissionKey, value: number) {
    const next = { ...levels, [key]: value };
    setSaving(key);
    onError(null);
    try {
      await updateChatPermissions(next).unwrap();
      setSaved(next);
    } catch (err) {
      onError(getApiErrorMessage(err, "Failed to update permissions"));
    } finally {
      setSaving(null);
    }
  }

  return { levels, busy: saving !== null, change };
}
