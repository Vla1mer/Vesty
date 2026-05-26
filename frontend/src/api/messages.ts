import { api } from "./client";
import type { MessageDto, MessageForCreationDto } from "../types/api";

export async function getMessagesByChat(chatId: number): Promise<MessageDto[]> {
  const response = await api.get<MessageDto[]>(`/api/Chat/${chatId}/messages`);
  return response.data;
}

export async function createMessage(
  chatId: number,
  dto: MessageForCreationDto
): Promise<MessageDto> {
  const response = await api.post<MessageDto>(
    `/api/Message/${chatId}/messages`,
    dto
  );
  return response.data;
}
