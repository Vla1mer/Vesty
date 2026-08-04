import { ChatAvatar } from "./Avatar";
import { AvatarUpload } from "./AvatarUpload";
import { useUploadChatAvatarMutation } from "../store/chatApi";

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
      onUpload={(file) => uploadAvatar({ chatId, file }).unwrap()}
    />
  );
}
