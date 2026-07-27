import { ChatAvatar } from "./Avatar";
import { AvatarUpload } from "./AvatarUpload";
import {
  useUploadChatAvatarMutation,
  useDeleteChatAvatarMutation,
} from "../store/chatApi";

interface ChatAvatarEditorProps {
  chatId: number;
  name: string;
  avatarUpdatedAt?: string | null;
}

export function ChatAvatarEditor({
  chatId,
  name,
  avatarUpdatedAt,
}: ChatAvatarEditorProps) {
  const [uploadAvatar, { isLoading: uploading }] =
    useUploadChatAvatarMutation();
  const [deleteAvatar, { isLoading: removing }] =
    useDeleteChatAvatarMutation();

  return (
    <AvatarUpload
      preview={
        <ChatAvatar
          chatId={chatId}
          name={name}
          avatarUpdatedAt={avatarUpdatedAt}
          size="xl"
        />
      }
      hasAvatar={Boolean(avatarUpdatedAt)}
      uploading={uploading}
      removing={removing}
      onUpload={(file) => uploadAvatar({ chatId, file }).unwrap()}
      onRemove={() => deleteAvatar(chatId).unwrap()}
    />
  );
}
