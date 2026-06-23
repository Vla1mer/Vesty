import { api } from "./client";
import type { ChatDto, ChatMemberWithRoleDto } from "../types/api";

export async function getChatById(id: number): Promise<ChatDto> {
  const response = await api.get<ChatDto>(`/api/Chat/${id}`);
  return response.data;
}

export async function getChatMembers(
  chatId: number
): Promise<ChatMemberWithRoleDto[]> {
  const response = await api.get<ChatMemberWithRoleDto[]>(
    `/api/Chat/${chatId}/users`
  );
  return response.data;
}

export async function addChatMember(chatId: number, userId: number): Promise<void> {
  await api.post(`/api/Chat/${chatId}/users`, { userId });
}

export async function removeChatMember(chatId: number, userId: number): Promise<void> {
  await api.delete(`/api/Chat/${chatId}/users/${userId}`);
}

export async function updateMemberRole(
  chatId: number,
  userId: number,
  roleId: number
): Promise<void> {
  await api.patch(`/api/Chat/${chatId}/users/${userId}/role`, { roleId });
}
