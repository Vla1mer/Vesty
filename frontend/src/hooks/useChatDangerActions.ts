import { useState } from "react";
import {
  useClearChatForMeMutation,
  useDeleteChatMutation,
  useRemoveChatMemberMutation,
} from "../store/chatApi";
import { getApiErrorMessage } from "../utils/apiError";

interface Options {
  chatId: number;
  currentUserId: number | null;
  onError: (message: string | null) => void;
  onDone: () => void;
}

export function useChatDangerActions({
  chatId,
  currentUserId,
  onError,
  onDone,
}: Options) {
  const [removeChatMember] = useRemoveChatMemberMutation();
  const [deleteChat] = useDeleteChatMutation();
  const [clearChatForMe, { isLoading: clearing }] = useClearChatForMeMutation();

  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function confirmLeave() {
    if (currentUserId === null) {
      setLeaveOpen(false);
      return;
    }
    setLeaving(true);
    onError(null);
    try {
      await removeChatMember({ chatId, userId: currentUserId }).unwrap();
      setLeaveOpen(false);
      setLeaving(false);
      onDone();
    } catch (err) {
      onError(getApiErrorMessage(err, "Failed to leave the chat"));
      setLeaveOpen(false);
      setLeaving(false);
    }
  }

  async function confirmClear() {
    onError(null);
    try {
      await clearChatForMe(chatId).unwrap();
      setClearOpen(false);
      onDone();
    } catch (err) {
      onError(getApiErrorMessage(err, "Failed to clear the conversation"));
      setClearOpen(false);
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    onError(null);
    try {
      await deleteChat(chatId).unwrap();
      setDeleteOpen(false);
      setDeleting(false);
      onDone();
    } catch (err) {
      onError(getApiErrorMessage(err, "Failed to delete the chat"));
      setDeleteOpen(false);
      setDeleting(false);
    }
  }

  return {
    busy: leaving || deleting || clearing,
    leave: {
      open: leaveOpen,
      loading: leaving,
      ask: () => setLeaveOpen(true),
      cancel: () => setLeaveOpen(false),
      confirm: confirmLeave,
    },
    clear: {
      open: clearOpen,
      loading: clearing,
      ask: () => setClearOpen(true),
      cancel: () => setClearOpen(false),
      confirm: confirmClear,
    },
    remove: {
      open: deleteOpen,
      loading: deleting,
      ask: () => setDeleteOpen(true),
      cancel: () => setDeleteOpen(false),
      confirm: confirmDelete,
    },
  };
}
