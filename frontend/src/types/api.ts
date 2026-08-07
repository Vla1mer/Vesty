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
  isProfileHidden?: boolean;
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
  description?: string | null;
  whoCanInvite: number;
  whoCanEdit: number;
  whoCanPost: number;
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

export const ChatPermission = {
  Owner: 1,
  Admins: 2,
  Members: 3,
} as const;

export function permissionAllows(permission: number, roleId: number): boolean {
  if (permission === ChatPermission.Members) return true;
  if (permission === ChatPermission.Admins)
    return roleId === UserRole.Owner || roleId === UserRole.Admin;
  if (permission === ChatPermission.Owner) return roleId === UserRole.Owner;
  return false;
}

export interface ChatPermissionsDto {
  whoCanInvite: number;
  whoCanEdit: number;
  whoCanPost: number;
}

export interface ChatInviteDto {
  code: string;
  expiresAt?: string | null;
  createdAt: string;
}

export interface ChatInvitePreviewDto {
  chatId: number;
  name: string | null;
  description?: string | null;
  memberCount: number;
  avatarUpdatedAt?: string | null;
  alreadyMember: boolean;
}

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

export interface MessageAttachmentDto {
  id: number;
  fileName: string;
  contentType: string;
  sizeInBytes: number;
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
  attachments?: MessageAttachmentDto[];
}

export interface MessageForCreationDto {
  content: string;
  replyToMessageId?: number | null;
  attachmentIds?: number[];
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

export const FRIENDSHIP_STATUS = {
  PENDING: 1,
  ACCEPTED: 2,
} as const;

export interface FriendDto {
  userId: number;
  userName: string;
  name?: string | null;
  surname?: string | null;
  avatarUpdatedAt?: string | null;
  status: number;
  isIncoming: boolean;
  createdAt: string;
}

export const PRIVACY_LEVEL = {
  EVERYONE: 1,
  FRIENDS_ONLY: 2,
  NOBODY: 3,
} as const;

export interface PrivacySettingsDto {
  whoCanMessage: number;
  whoCanInvite: number;
  whoCanSeeProfile: number;
  whoCanSeeOnline: number;
}

export interface BlockedUserDto {
  userId: number;
  userName: string;
  name?: string | null;
  surname?: string | null;
  avatarUpdatedAt?: string | null;
  createdAt: string;
}
