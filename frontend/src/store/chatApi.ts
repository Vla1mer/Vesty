import { apiSlice } from "./apiSlice";
import { endpoints } from "../api/endpoints";
import { CHAT_API_TAGS, TAG_ID } from "../api/constants";
import { HTTP_METHOD } from "../utils/http";
import { getCurrentUserId } from "../api/client";
import { getActiveChat } from "../lib/activeChat";
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
      query: () => ({ url: endpoints.chat.base, params: { pageSize: 50 } }),
      transformResponse: (response: ChatDto[]) =>
        [...response].sort(
          (a, b) =>
            new Date(b.lastMessageAt ?? b.createdAt).getTime() -
            new Date(a.lastMessageAt ?? a.createdAt).getTime()
        ),
      providesTags: (result) =>
        result
          ? [
              ...result.map((chat) => ({ type: CHAT_API_TAGS.CHAT, id: chat.id })),
              { type: CHAT_API_TAGS.CHAT, id: TAG_ID.LIST },
            ]
          : [{ type: CHAT_API_TAGS.CHAT, id: TAG_ID.LIST }],
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
                const index = draft.findIndex((c) => c.id === message.chatId);
                if (index === -1) return;
                const [chat] = draft.splice(index, 1);
                chat.lastMessageContent = message.content;
                chat.lastMessageSenderId = message.userId;
                chat.lastMessageAt = message.createdAt;
                chat.lastMessageSenderName = message.userName ?? undefined;
                if (
                  message.userId !== getCurrentUserId() &&
                  message.chatId !== getActiveChat()
                ) {
                  chat.unreadCount = (chat.unreadCount ?? 0) + 1;
                }
                draft.unshift(chat);
              });
            })
          );

          subscriptions.push(
            onReconnected(() => {
              dispatch(
                apiSlice.util.invalidateTags([{ type: CHAT_API_TAGS.CHAT, id: TAG_ID.LIST }])
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
      query: (dto) => ({ url: endpoints.chat.base, method: HTTP_METHOD.POST, data: dto }),
      invalidatesTags: [{ type: CHAT_API_TAGS.CHAT, id: TAG_ID.LIST }],
    }),

    deleteChat: builder.mutation<void, number>({
      query: (chatId) => ({ url: endpoints.chat.byId(chatId), method: HTTP_METHOD.DELETE }),
      invalidatesTags: [{ type: CHAT_API_TAGS.CHAT, id: TAG_ID.LIST }],
    }),

    renameChat: builder.mutation<void, { chatId: number; name: string }>({
      query: ({ chatId, name }) => ({
        url: endpoints.chat.byId(chatId),
        method: HTTP_METHOD.PUT,
        data: { name },
      }),
      invalidatesTags: (_result, _error, { chatId }) => [
        { type: CHAT_API_TAGS.CHAT, id: chatId },
      ],
    }),

    getChatById: builder.query<ChatDto, number>({
      query: (chatId) => ({ url: endpoints.chat.byId(chatId) }),
      providesTags: (_result, _error, chatId) => [{ type: CHAT_API_TAGS.CHAT, id: chatId }],
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
                apiSlice.util.invalidateTags([{ type: CHAT_API_TAGS.CHAT, id: chatId }])
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
      query: (chatId) => ({ url: endpoints.chat.members(chatId) }),
      providesTags: (_result, _error, chatId) => [
        { type: CHAT_API_TAGS.CHAT_MEMBER, id: chatId },
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
                  { type: CHAT_API_TAGS.CHAT_MEMBER, id: chatId },
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
        url: endpoints.chat.members(chatId),
        method: HTTP_METHOD.POST,
        data: { userId },
      }),
      invalidatesTags: (_result, _error, { chatId }) => [
        { type: CHAT_API_TAGS.CHAT_MEMBER, id: chatId },
      ],
    }),

    removeChatMember: builder.mutation<void, { chatId: number; userId: number }>({
      query: ({ chatId, userId }) => ({
        url: endpoints.chat.member(chatId, userId),
        method: HTTP_METHOD.DELETE,
      }),
      invalidatesTags: (_result, _error, { chatId }) => [
        { type: CHAT_API_TAGS.CHAT_MEMBER, id: chatId },
      ],
    }),

    updateMemberRole: builder.mutation<
      void,
      { chatId: number; userId: number; roleId: number }
    >({
      query: ({ chatId, userId, roleId }) => ({
        url: endpoints.chat.memberRole(chatId, userId),
        method: HTTP_METHOD.PATCH,
        data: { roleId },
      }),
      invalidatesTags: (_result, _error, { chatId }) => [
        { type: CHAT_API_TAGS.CHAT_MEMBER, id: chatId },
      ],
    }),

    uploadChatAvatar: builder.mutation<void, { chatId: number; file: Blob }>({
      query: ({ chatId, file }) => {
        const form = new FormData();
        form.append("file", file, "avatar");
        return {
          url: endpoints.chat.avatar(chatId),
          method: HTTP_METHOD.POST,
          data: form,
        };
      },
      invalidatesTags: (_result, _error, { chatId }) => [
        { type: CHAT_API_TAGS.CHAT, id: chatId },
        { type: CHAT_API_TAGS.CHAT, id: TAG_ID.LIST },
      ],
    }),

    deleteChatAvatar: builder.mutation<void, number>({
      query: (chatId) => ({
        url: endpoints.chat.avatar(chatId),
        method: HTTP_METHOD.DELETE,
      }),
      invalidatesTags: (_result, _error, chatId) => [
        { type: CHAT_API_TAGS.CHAT, id: chatId },
        { type: CHAT_API_TAGS.CHAT, id: TAG_ID.LIST },
      ],
    }),

    markChatRead: builder.mutation<void, number>({
      query: (chatId) => ({ url: endpoints.chat.read(chatId), method: HTTP_METHOD.POST }),
      async onQueryStarted(chatId, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          chatApi.util.updateQueryData("getChats", undefined, (draft) => {
            const chat = draft.find((c) => c.id === chatId);
            if (chat) chat.unreadCount = 0;
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
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
  useMarkChatReadMutation,
  useUploadChatAvatarMutation,
  useDeleteChatAvatarMutation,
} = chatApi;
