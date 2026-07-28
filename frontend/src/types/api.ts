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
  avatarUpdatedAt?: string | null;
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
  lastMessageContent?: string | null;
  lastMessageSenderName?: string | null;
  lastMessageSenderId?: number | null;
  lastMessageAt?: string | null;
  unreadCount?: number;
  avatarUpdatedAt?: string | null;
}

export interface DirectChatDto extends ChatDto {
  partnerUserName: string | null;
  partnerUserId?: number | null;
  partnerAvatarUpdatedAt?: string | null;
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
  avatarUpdatedAt?: string | null;
}

export interface ChatForCreationDto {
  name: string;
  members?: ChatMemberForCreationDto[];
}

export interface MessageReplyDto {
  id: number;
  userId: number;
  userName?: string | null;
  content: string | null;
}

export interface MessageReactionDto {
  emoji: string;
  userIds: number[];
}

export interface MessageDto {
  id: number;
  chatId: number;
  userId: number;
  userName?: string | null;
  content: string | null;
  createdAt: string;
  isEdited: boolean;
  replyTo?: MessageReplyDto | null;
  reactions?: MessageReactionDto[];
  pinnedAt?: string | null;
}

export interface MessageForCreationDto {
  content: string;
  replyToMessageId?: number | null;
}

export interface MessageReactionsSignalrDto {
  chatId: number;
  messageId: number;
  reactions: MessageReactionDto[];
}

export interface MessagePinnedSignalrDto {
  chatId: number;
  messageId: number;
  pinnedAt?: string | null;
}

export interface MessageDeletedSignalrDto {
  chatId: number;
  messageId: number;
}

export interface ChatDeletedSignalrDto {
  chatId: number;
}

export interface ChatRenamedSignalrDto {
  chatId: number;
  name: string;
}

export interface UserTypingSignalrDto {
  chatId: number;
  userId: number;
  userName: string;
}


export interface CreateDirectChatMessageDto {
  otherUserId: number;
  content: string;
}

export interface ApiError {
  message?: string;
  errors?: Record<string, string[]>;
}
