export interface TokenDto {
  accessToken: string;
  refreshToken: string;
}

export interface UserForRegistrationDto {
  userName: string;
  password: string;
  name?: string;
  surname?: string;
  phone?: string;
  birthday?: string;
}

export interface UserForAuthenticationDto {
  userName: string;
  password: string;
}

export interface UserDto {
  id: number;
  userName: string;
  name?: string;
  surname?: string;
  phone?: string;
  birthday?: string;
}

export interface UserForUpdateDto {
  userName: string;
  name?: string;
  surname?: string;
  phone?: string;
  birthday?: string;
}

export interface ChatDto {
  id: number;
  name: string | null;
  creatorId: number | null;
  isPrivate: boolean;
  createdAt: string;
}

export interface DirectChatDto extends ChatDto {
  partnerUserName: string | null;
}

export function isDirectChat(chat: ChatDto): chat is DirectChatDto {
  return chat.isPrivate;
}

export interface ChatMemberForCreationDto {
  userId: number;
}

export const UserRole = {
  Owner: 1,
  Admin: 2,
  User: 3,
} as const;

export interface ChatMemberWithRoleDto {
  userId: number;
  userName: string;
  name?: string;
  surname?: string;
  roleId: number;
}

export interface ChatForCreationDto {
  name: string;
  members?: ChatMemberForCreationDto[];
}

export interface MessageDto {
  id: number;
  chatId: number;
  userId: number;
  content: string | null;
  createdAt: string;
}

export interface MessageForCreationDto {
  content: string;
}

export interface MessageDeletedDto {
  chatId: number;
  messageId: number;
}

export interface ChatDeletedDto {
  chatId: number;
}

export interface ChatRenamedDto {
  chatId: number;
  name: string;
}

export interface CreateDirectChatMessageDto {
  otherUserId: number;
  content: string;
}

export interface ApiError {
  message?: string;
  errors?: Record<string, string[]>;
}
