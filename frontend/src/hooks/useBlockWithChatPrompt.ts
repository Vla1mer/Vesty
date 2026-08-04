import { useState } from "react";
import { useBlockUserMutation } from "../store/blockApi";
import {
  useClearChatForMeMutation,
  useLazyFindDirectChatQuery,
} from "../store/chatApi";
import { getApiErrorMessage } from "../utils/apiError";

export function useBlockWithChatPrompt() {
  const [blockUser, blockState] = useBlockUserMutation();
  const [clearChatForMe, clearState] = useClearChatForMeMutation();
  const [findDirectChat] = useLazyFindDirectChatQuery();

  const [pendingChatId, setPendingChatId] = useState<number | null>(null);
  const [blockError, setBlockError] = useState<string | null>(null);
  const [clearError, setClearError] = useState<string | null>(null);

  async function block(userId: number) {
    setBlockError(null);
    try {
      await blockUser(userId).unwrap();
    } catch (err) {
      setBlockError(getApiErrorMessage(err, "Failed to block the user"));
      return;
    }

    const chatId = await findDirectChat(userId).unwrap().catch(() => null);
    if (chatId !== null) setPendingChatId(chatId);
  }

  async function confirmClear() {
    if (pendingChatId === null) return;
    setClearError(null);
    try {
      await clearChatForMe(pendingChatId).unwrap();
      setPendingChatId(null);
    } catch (err) {
      setClearError(getApiErrorMessage(err, "Failed to delete the chat"));
    }
  }

  function dismissClear() {
    setPendingChatId(null);
    setClearError(null);
  }

  return {
    block,
    blockingUserId: blockState.isLoading
      ? (blockState.originalArgs ?? null)
      : null,
    isBlocking: blockState.isLoading,
    error: blockError,
    askedForChatId: pendingChatId,
    confirmClear,
    dismissClear,
    isClearing: clearState.isLoading,
    clearError,
  };
}
