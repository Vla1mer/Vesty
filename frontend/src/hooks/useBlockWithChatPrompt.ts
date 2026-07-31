import { useState } from "react";
import { useBlockUserMutation } from "../store/blockApi";
import { useClearChatForMeMutation, useGetChatsQuery } from "../store/chatApi";
import { isDirectChat } from "../types/api";

/**
 * Блокирует пользователя и, если с ним есть личная переписка,
 * предлагает убрать её у себя. У собеседника чат остаётся.
 */
export function useBlockWithChatPrompt() {
  const [blockUser, blockState] = useBlockUserMutation();
  const [clearChatForMe, clearState] = useClearChatForMeMutation();
  const { data: chats = [] } = useGetChatsQuery();

  const [pendingChatId, setPendingChatId] = useState<number | null>(null);

  function findDirectChatWith(userId: number): number | null {
    const chat = chats.find(
      (c) => isDirectChat(c) && c.partnerUserId === userId
    );
    return chat?.id ?? null;
  }

  async function block(userId: number) {
    await blockUser(userId).unwrap();
    setPendingChatId(findDirectChatWith(userId));
  }

  async function confirmClear() {
    if (pendingChatId === null) return;
    try {
      await clearChatForMe(pendingChatId).unwrap();
    } finally {
      setPendingChatId(null);
    }
  }

  return {
    block,
    isBlocking: blockState.isLoading,
    askedForChatId: pendingChatId,
    confirmClear,
    dismissClear: () => setPendingChatId(null),
    isClearing: clearState.isLoading,
  };
}
