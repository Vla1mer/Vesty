import { useEffect, useRef, useState } from "react";
import { ValidationError } from "yup";
import { useRenameChatMutation } from "../store/chatsApi";
import { chatNameSchema } from "../validation/chatSchemas";
import { getApiErrorMessage } from "../utils/apiError";
import type { ChatDto } from "../types/api";

export function useChatProfileDraft(
  chat: ChatDto,
  onError: (message: string | null) => void
) {
  const [renameChat] = useRenameChatMutation();

  const serverName = chat.name ?? "";
  const serverDescription = chat.description ?? "";

  const [name, setName] = useState(serverName);
  const [description, setDescription] = useState(serverDescription);
  const [saving, setSaving] = useState(false);

  const known = useRef({
    chatId: chat.id,
    name: serverName,
    description: serverDescription,
  });

  useEffect(() => {
    const previous = known.current;
    known.current = {
      chatId: chat.id,
      name: serverName,
      description: serverDescription,
    };

    if (previous.chatId !== chat.id) {
      setName(serverName);
      setDescription(serverDescription);
      return;
    }

    if (previous.name !== serverName)
      setName((draft) => (draft === previous.name ? serverName : draft));

    if (previous.description !== serverDescription)
      setDescription((draft) =>
        draft === previous.description ? serverDescription : draft
      );
  }, [chat.id, serverName, serverDescription]);

  const changed =
    name.trim() !== serverName.trim() ||
    description.trim() !== serverDescription.trim();

  async function save() {
    if (saving) return;
    const newName = name.trim();

    try {
      await chatNameSchema.validate({ name: newName });
    } catch (validationErr) {
      onError((validationErr as ValidationError).message);
      return;
    }

    setSaving(true);
    onError(null);
    try {
      await renameChat({
        chatId: chat.id,
        name: newName,
        description: description.trim() || null,
      }).unwrap();
    } catch (err) {
      onError(getApiErrorMessage(err, "Failed to save the chat profile"));
    } finally {
      setSaving(false);
    }
  }

  return { name, description, setName, setDescription, changed, saving, save };
}
