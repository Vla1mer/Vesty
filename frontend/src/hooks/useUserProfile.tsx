import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "./useIsMobile";
import { UserProfileModal } from "../components/UserProfileModal";

export function useUserProfile() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [openFor, setOpenFor] = useState<number | null>(null);

  function open(userId: number) {
    if (isMobile) navigate(`/users/${userId}`);
    else setOpenFor(userId);
  }

  const modal =
    openFor === null ? null : (
      <UserProfileModal userId={openFor} onClose={() => setOpenFor(null)} />
    );

  return { open, modal };
}
