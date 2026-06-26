import { apiSlice } from "./apiSlice";
import {
  onChatCreated,
  onChatDeleted,
  onChatRenamed,
  onMessageReceived,
  onReconnected,
} from "../lib/signalr";
import type {
  ChatDto,
  ChatForCreationDto,
  ChatMemberWithRoleDto,
} from "../types/api";

export const chatApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getChats: builder.query<ChatDto[], void>({
      query: () => ({ url: "/api/Chat", params: { pageSize: 50 } }),
      providesTags: (result) =>
        result
          ? [
              ...result.map((chat) => ({ type: "Chat" as const, id: chat.id })),
              { type: "Chat" as const, id: "LIST" },
            ]
          : [{ type: "Chat" as const, id: "LIST" }],
      async onCacheEntryAdded(
        _arg,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, dispatch }
      ) {
        const subscriptions: Array<() => void> = [];
        try {
          await cacheDataLoaded;

          subscriptions.push(
            onChatCreated((chat) => {
              updateCachedData((draft) => {
                if (!draft.some((c) => c.id === chat.id)) draft.unshift(chat);
              });
            })
          );

          subscriptions.push(
            onChatDeleted(({ chatId }) => {
              updateCachedData((draft) => {
                const index = draft.findIndex((c) => c.id === chatId);
                if (index !== -1) draft.splice(index, 1);
              });
            })
          );

          subscriptions.push(
            onChatRenamed(({ chatId, name }) => {
              updateCachedData((draft) => {
                const chat = draft.find((c) => c.id === chatId);
                if (chat) chat.name = name;
              });
            })
          );

          subscriptions.push(
            onMessageReceived((message) => {
              updateCachedData((draft) => {
                const chat = draft.find((c) => c.id === message.chatId);
                if (!chat) return;
                chat.lastMessageContent = message.content;
                chat.lastMessageSenderId = message.userId;
                chat.lastMessageAt = message.createdAt;
                chat.lastMessageSenderName = undefined;
              });
            })
          );

          subscriptions.push(
            onReconnected(() => {
              dispatch(
                apiSlice.util.invalidateTags([{ type: "Chat", id: "LIST" }])
              );
            })
          );

          await cacheEntryRemoved;
        } finally {
          subscriptions.forEach((unsubscribe) => unsubscribe());
        }
      },
    }),

    createChat: builder.mutation<ChatDto, ChatForCreationDto>({
      query: (dto) => ({ url: "/api/Chat", method: "post", data: dto }),
      invalidatesTags: [{ type: "Chat", id: "LIST" }],
    }),

    deleteChat: builder.mutation<void, number>({
      query: (chatId) => ({ url: `/api/Chat/${chatId}`, method: "delete" }),
      invalidatesTags: [{ type: "Chat", id: "LIST" }],
    }),

    renameChat: builder.mutation<void, { chatId: number; name: string }>({
      query: ({ chatId, name }) => ({
        url: `/api/Chat/${chatId}`,
        method: "put",
        data: { name },
      }),
      invalidatesTags: (_result, _error, { chatId }) => [
        { type: "Chat", id: chatId },
      ],
    }),

    getChatById: builder.query<ChatDto, number>({
      query: (chatId) => ({ url: `/api/Chat/${chatId}` }),
      providesTags: (_result, _error, chatId) => [{ type: "Chat", id: chatId }],
      async onCacheEntryAdded(
        chatId,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, dispatch }
      ) {
        const subscriptions: Array<() => void> = [];
        try {
          await cacheDataLoaded;

          subscriptions.push(
            onChatRenamed(({ chatId: renamedChatId, name }) => {
              if (renamedChatId !== chatId) return;
              updateCachedData((draft) => {
                draft.name = name;
              });
            })
          );

          subscriptions.push(
            onReconnected(() => {
              dispatch(
                apiSlice.util.invalidateTags([{ type: "Chat", id: chatId }])
              );
            })
          );

          await cacheEntryRemoved;
        } finally {
          subscriptions.forEach((unsubscribe) => unsubscribe());
        }
      },
    }),

    getChatMembers: builder.query<ChatMemberWithRoleDto[], number>({
      query: (chatId) => ({ url: `/api/Chat/${chatId}/users` }),
      providesTags: (_result, _error, chatId) => [
        { type: "ChatMember", id: chatId },
      ],
      async onCacheEntryAdded(
        chatId,
        { cacheDataLoaded, cacheEntryRemoved, dispatch }
      ) {
        const subscriptions: Array<() => void> = [];
        try {
          await cacheDataLoaded;

          subscriptions.push(
            onReconnected(() => {
              dispatch(
                apiSlice.util.invalidateTags([
                  { type: "ChatMember", id: chatId },
                ])
              );
            })
          );

          await cacheEntryRemoved;
        } finally {
          subscriptions.forEach((unsubscribe) => unsubscribe());
        }
      },
    }),

    addChatMember: builder.mutation<void, { chatId: number; userId: number }>({
      query: ({ chatId, userId }) => ({
        url: `/api/Chat/${chatId}/users`,
        method: "post",
        data: { userId },
      }),
      invalidatesTags: (_result, _error, { chatId }) => [
        { type: "ChatMember", id: chatId },
      ],
    }),

    removeChatMember: builder.mutation<void, { chatId: number; userId: number }>({
      query: ({ chatId, userId }) => ({
        url: `/api/Chat/${chatId}/users/${userId}`,
        method: "delete",
      }),
      invalidatesTags: (_result, _error, { chatId }) => [
        { type: "ChatMember", id: chatId },
      ],
    }),

    updateMemberRole: builder.mutation<
      void,
      { chatId: number; userId: number; roleId: number }
    >({
      query: ({ chatId, userId, roleId }) => ({
        url: `/api/Chat/${chatId}/users/${userId}/role`,
        method: "patch",
        data: { roleId },
      }),
      invalidatesTags: (_result, _error, { chatId }) => [
        { type: "ChatMember", id: chatId },
      ],
    }),
  }),
});

export const {
  useGetChatsQuery,
  useCreateChatMutation,
  useDeleteChatMutation,
  useRenameChatMutation,
  useGetChatByIdQuery,
  useGetChatMembersQuery,
  useAddChatMemberMutation,
  useRemoveChatMemberMutation,
  useUpdateMemberRoleMutation,
} = chatApi;
