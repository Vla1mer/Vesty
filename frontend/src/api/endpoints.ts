// Central place for backend API paths. Keep these in sync with the server routes.
export const endpoints = {
  auth: {
    register: "/api/User/register",
    login: "/api/User/login",
  },
  user: {
    base: "/api/User",
    byId: (id: number) => `/api/User/${id}`,
    avatar: (id: number) => `/api/User/${id}/avatar`,
  },
  friend: {
    base: "/api/Friend",
    requests: "/api/Friend/requests",
    byUser: (userId: number) => `/api/Friend/${userId}`,
    accept: (userId: number) => `/api/Friend/${userId}/accept`,
  },
  chat: {
    base: "/api/Chat",
    byId: (chatId: number) => `/api/Chat/${chatId}`,
    read: (chatId: number) => `/api/Chat/${chatId}/read`,
    avatar: (chatId: number) => `/api/Chat/${chatId}/avatar`,
    messages: (chatId: number) => `/api/Chat/${chatId}/messages`,
    members: (chatId: number) => `/api/Chat/${chatId}/users`,
    member: (chatId: number, userId: number) =>
      `/api/Chat/${chatId}/users/${userId}`,
    memberRole: (chatId: number, userId: number) =>
      `/api/Chat/${chatId}/users/${userId}/role`,
  },
  message: {
    byId: (id: number) => `/api/Message/${id}`,
    direct: "/api/Message/direct",
    reactions: (id: number) => `/api/Message/${id}/reactions`,
    pin: (id: number) => `/api/Message/${id}/pin`,
    attachments: (chatId: number) => `/api/Message/${chatId}/attachments`,
    attachment: (id: number) => `/api/Message/attachments/${id}`,
    reaction: (id: number, emoji: string) =>
      `/api/Message/${id}/reactions/${encodeURIComponent(emoji)}`,
    forChat: (chatId: number) => `/api/Message/${chatId}/messages`,
    inChat: (chatId: number, id: number) =>
      `/api/Message/${chatId}/messages/${id}`,
  },
} as const;
