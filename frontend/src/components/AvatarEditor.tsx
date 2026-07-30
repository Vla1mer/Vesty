import { Avatar } from "./Avatar";
import { AvatarUpload } from "./AvatarUpload";
import {
  useUploadAvatarMutation,
  useDeleteAvatarMutation,
} from "../store/userApi";
import type { UserDto } from "../types/api";

interface AvatarEditorProps {
  user: UserDto;
}

export function AvatarEditor({ user }: AvatarEditorProps) {
  const [uploadAvatar, { isLoading: uploading }] = useUploadAvatarMutation();
  const [deleteAvatar, { isLoading: removing }] = useDeleteAvatarMutation();

  return (
    <div className="pb-5 mb-5 border-b border-line">
      <AvatarUpload
        preview={
          <Avatar
            userId={user.id}
            userName={user.userName}
            name={user.name}
            surname={user.surname}
            avatarUpdatedAt={user.avatarUpdatedAt}
            size="xl"
          />
        }
        heading={
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-content">
              {[user.name, user.surname].filter(Boolean).join(" ") || user.userName}
            </p>
            <p className="truncate text-xs text-content-muted">@{user.userName}</p>
          </div>
        }
        hasAvatar={Boolean(user.avatarUpdatedAt)}
        uploading={uploading}
        removing={removing}
        onUpload={(file) => uploadAvatar({ id: user.id, file }).unwrap()}
        onRemove={() => deleteAvatar(user.id).unwrap()}
      />
    </div>
  );
}
