import { useGetUserByIdQuery } from "../store/userApi";
import { UserProfileContent } from "./UserProfileContent";
import { FormError } from "./FormError";
import { Modal } from "./ui/Modal";

interface Props {
  userId: number;
  onClose: () => void;
}

export function UserProfileModal({ userId, onClose }: Props) {
  const { data: user, isLoading, isError } = useGetUserByIdQuery(userId);

  return (
    <Modal title="Profile" onClose={onClose} size="sm" layout="scroll">
      {isError ? (
        <FormError message="Failed to load the profile" />
      ) : isLoading || !user ? (
        <p className="py-6 text-center text-sm text-content-subtle">Loading...</p>
      ) : (
        <UserProfileContent user={user} />
      )}
    </Modal>
  );
}
