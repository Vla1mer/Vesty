import { api } from "./client";
import type { ChatDto, ChatForCreationDto, UserDto } from "../types/api";

export async function getChats(): Promise<ChatDto[]> {
  const response = await api.get<ChatDto[]>("/api/Chat");
  return response.data;
}

export async function getChatById(id: number): Promise<ChatDto> {
  const response = await api.get<ChatDto>(`/api/Chat/${id}`);
  return response.data;
}

export async function createChat(dto: ChatForCreationDto): Promise<ChatDto> {
  const response = await api.post<ChatDto>("/api/Chat", dto);
  return response.data;
}

export async function deleteChat(chatId: number): Promise<void> {
  await api.delete(`/api/Chat/${chatId}`);
}

export async function renameChat(chatId: number, name: string): Promise<void> {
  await api.put(`/api/Chat/${chatId}`, { name });
}

export async function getChatMembers(chatId: number): Promise<UserDto[]> {
  const response = await api.get<UserDto[]>(`/api/Chat/${chatId}/users`);
  return response.data;
}

export async function addChatMember(chatId: number, userId: number): Promise<void> {
  await api.post(`/api/Chat/${chatId}/users`, { userId });
}

export async function removeChatMember(chatId: number, userId: number): Promise<void> {
  await api.delete(`/api/Chat/${chatId}/users/${userId}`);
}
