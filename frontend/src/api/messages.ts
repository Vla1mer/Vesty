import { api } from "./client";
import type {
  MessageDto,
  MessageForCreationDto,
  SendDirectMessageDto,
  SentDirectMessageDto,
} from "../types/api";

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

export async function sendDirectMessage(
  dto: SendDirectMessageDto
): Promise<SentDirectMessageDto> {
  const response = await api.post<SentDirectMessageDto>(
    `/api/Message/direct`,
    dto
  );
  return response.data;
}
