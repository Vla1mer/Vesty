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

export interface ChatDto {
  id: number;
  name: string | null;
  creatorId: number | null;
  isPrivate: boolean;
  createdAt: string;
}

export interface ChatMemberForCreationDto {
  userId: number;
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

export interface ApiError {
  message?: string;
  errors?: Record<string, string[]>;
}
