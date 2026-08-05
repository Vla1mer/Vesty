import { apiSlice } from "./apiSlice";
import {
  chatListTag,
  chatMessagesTag,
  chatTag,
  inviteTag,
  memberTag,
} from "./chatTags";
import { whileCached } from "./whileCached";
import { endpoints } from "../api/endpoints";
import { HTTP_METHOD } from "../utils/http";
import { getCurrentUserId } from "../api/client";
import { getActiveChat } from "../lib/activeChat";
import {
  onChatCreated,
  onChatDeleted,
  onChatRenamed,
  onChatUpdated,
  onMessageReceived,
  onReconnected,
} from "../lib/signalr";
import type {
  ChatDto,
  ChatForCreationDto,
  ChatMemberWithRoleDto,
  ChatPermissionsDto,
  ChatInviteDto,
  ChatInvitePreviewDto,
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
              ...result.map((chat) => (chatTag(chat.id))),
              chatListTag,
            ]
          : [chatListTag],
      async onCacheEntryAdded(_arg, lifecycle) {
        const { updateCachedData, dispatch } = lifecycle;
        await whileCached(lifecycle, () => [
          onChatCreated((chat) => {
            updateCachedData((draft) => {
              if (!draft.some((c) => c.id === chat.id)) draft.unshift(chat);
            });
          }),

          onChatDeleted(({ chatId }) => {
            updateCachedData((draft) => {
              const index = draft.findIndex((c) => c.id === chatId);
              if (index !== -1) draft.splice(index, 1);
            });
          }),

          onChatRenamed(({ chatId, name }) => {
            updateCachedData((draft) => {
              const chat = draft.find((c) => c.id === chatId);
              if (chat) chat.name = name;
            });
          }),

          onChatUpdated(({ chatId }) => {
            dispatch(
              apiSlice.util.invalidateTags([
                chatTag(chatId),
                memberTag(chatId),
              ])
            );
          }),

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
          }),

          onReconnected(() => {
            dispatch(
              apiSlice.util.invalidateTags([
                chatListTag,
              ])
            );
          }),
        ]);
      },
    }),

    createChat: builder.mutation<ChatDto, ChatForCreationDto>({
      query: (dto) => ({ url: endpoints.chat.base, method: HTTP_METHOD.POST, data: dto }),
      invalidatesTags: [chatListTag],
    }),

    deleteChat: builder.mutation<void, number>({
      query: (chatId) => ({ url: endpoints.chat.byId(chatId), method: HTTP_METHOD.DELETE }),
      invalidatesTags: [chatListTag],
    }),

    clearChatForMe: builder.mutation<void, number>({
      query: (chatId) => ({
        url: endpoints.chat.clearForMe(chatId),
        method: HTTP_METHOD.DELETE,
      }),
      invalidatesTags: (_result, _error, chatId) => [
        chatListTag,
        chatTag(chatId),
        chatMessagesTag(chatId),
      ],
    }),

    findDirectChat: builder.query<number, number>({
      query: (otherUserId) => ({ url: endpoints.chat.direct(otherUserId) }),
    }),

    renameChat: builder.mutation<
      void,
      { chatId: number; name: string; description?: string | null }
    >({
      query: ({ chatId, name, description }) => ({
        url: endpoints.chat.byId(chatId),
        method: HTTP_METHOD.PUT,
        data: { name, description },
      }),
      invalidatesTags: (_result, _error, { chatId }) => [chatTag(chatId), chatListTag],
    }),

    updateChatPermissions: builder.mutation<
      void,
      { chatId: number } & ChatPermissionsDto
    >({
      query: ({ chatId, ...permissions }) => ({
        url: endpoints.chat.permissions(chatId),
        method: HTTP_METHOD.PUT,
        data: permissions,
      }),
      invalidatesTags: (_result, _error, { chatId }) => [chatTag(chatId)],
    }),

    getChatInvite: builder.query<ChatInviteDto | null, number>({
      query: (chatId) => ({ url: endpoints.chat.invite(chatId) }),
      transformResponse: (response: ChatInviteDto | "" | null) => response || null,
      providesTags: (_result, _error, chatId) => [inviteTag(chatId)],
    }),

    createChatInvite: builder.mutation<
      ChatInviteDto,
      { chatId: number; expiresInDays: number | null }
    >({
      query: ({ chatId, expiresInDays }) => ({
        url: endpoints.chat.invite(chatId),
        method: HTTP_METHOD.POST,
        data: { expiresInDays },
      }),
      invalidatesTags: (_result, _error, { chatId }) => [inviteTag(chatId)],
    }),

    revokeChatInvite: builder.mutation<void, number>({
      query: (chatId) => ({
        url: endpoints.chat.invite(chatId),
        method: HTTP_METHOD.DELETE,
      }),
      invalidatesTags: (_result, _error, chatId) => [inviteTag(chatId)],
    }),

    previewChatInvite: builder.query<ChatInvitePreviewDto, string>({
      query: (code) => ({ url: endpoints.chat.inviteByCode(code) }),
    }),

    joinChatByInvite: builder.mutation<ChatDto, string>({
      query: (code) => ({
        url: endpoints.chat.joinByCode(code),
        method: HTTP_METHOD.POST,
      }),
      invalidatesTags: [chatListTag],
    }),

    getChatById: builder.query<ChatDto, number>({
      query: (chatId) => ({ url: endpoints.chat.byId(chatId) }),
      providesTags: (_result, _error, chatId) => [chatTag(chatId)],
      async onCacheEntryAdded(chatId, lifecycle) {
        const { updateCachedData, dispatch } = lifecycle;
        await whileCached(lifecycle, () => [
          onChatRenamed(({ chatId: renamedChatId, name }) => {
            if (renamedChatId !== chatId) return;
            updateCachedData((draft) => {
              draft.name = name;
            });
          }),

          onChatUpdated(({ chatId: updatedChatId }) => {
            if (updatedChatId !== chatId) return;
            dispatch(
              apiSlice.util.invalidateTags([
                chatTag(chatId),
                memberTag(chatId),
              ])
            );
          }),

          onReconnected(() => {
            dispatch(
              apiSlice.util.invalidateTags([
                chatTag(chatId),
              ])
            );
          }),
        ]);
      },
    }),

    getChatMembers: builder.query<ChatMemberWithRoleDto[], number>({
      query: (chatId) => ({ url: endpoints.chat.members(chatId) }),
      providesTags: (_result, _error, chatId) => [memberTag(chatId)],
      async onCacheEntryAdded(chatId, lifecycle) {
        const { dispatch } = lifecycle;
        await whileCached(lifecycle, () => [
          onReconnected(() => {
            dispatch(
              apiSlice.util.invalidateTags([
                memberTag(chatId),
              ])
            );
          }),
        ]);
      },
    }),

    addChatMember: builder.mutation<void, { chatId: number; userId: number }>({
      query: ({ chatId, userId }) => ({
        url: endpoints.chat.members(chatId),
        method: HTTP_METHOD.POST,
        data: { userId },
      }),
      invalidatesTags: (_result, _error, { chatId }) => [memberTag(chatId)],
    }),

    removeChatMember: builder.mutation<void, { chatId: number; userId: number }>({
      query: ({ chatId, userId }) => ({
        url: endpoints.chat.member(chatId, userId),
        method: HTTP_METHOD.DELETE,
      }),
      invalidatesTags: (_result, _error, { chatId }) => [memberTag(chatId)],
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
      invalidatesTags: (_result, _error, { chatId }) => [memberTag(chatId)],
    }),

    transferChatOwnership: builder.mutation<
      void,
      { chatId: number; userId: number }
    >({
      query: ({ chatId, userId }) => ({
        url: endpoints.chat.memberOwner(chatId, userId),
        method: HTTP_METHOD.POST,
      }),
      invalidatesTags: (_result, _error, { chatId }) => [memberTag(chatId)],
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
      invalidatesTags: (_result, _error, { chatId }) => [chatTag(chatId), chatListTag],
    }),

    deleteChatAvatar: builder.mutation<void, number>({
      query: (chatId) => ({
        url: endpoints.chat.avatar(chatId),
        method: HTTP_METHOD.DELETE,
      }),
      invalidatesTags: (_result, _error, chatId) => [chatTag(chatId), chatListTag],
    }),

    markChatRead: builder.mutation<void, number>({
      query: (chatId) => ({ url: endpoints.chat.read(chatId), method: HTTP_METHOD.POST }),
      async onQueryStarted(chatId, { dispatch, queryFulfilled }) {
        const patches = [
          dispatch(
            chatApi.util.updateQueryData("getChats", undefined, (draft) => {
              const chat = draft.find((c) => c.id === chatId);
              if (chat) chat.unreadCount = 0;
            })
          ),
          dispatch(
            chatApi.util.updateQueryData("getChatById", chatId, (draft) => {
              draft.unreadCount = 0;
            })
          ),
        ];
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((patch) => patch.undo());
        }
      },
    }),
  }),
});

export const {
  useGetChatsQuery,
  useCreateChatMutation,
  useDeleteChatMutation,
  useClearChatForMeMutation,
  useLazyFindDirectChatQuery,
  useRenameChatMutation,
  useUpdateChatPermissionsMutation,
  useGetChatInviteQuery,
  useCreateChatInviteMutation,
  useRevokeChatInviteMutation,
  usePreviewChatInviteQuery,
  useJoinChatByInviteMutation,
  useGetChatByIdQuery,
  useGetChatMembersQuery,
  useAddChatMemberMutation,
  useRemoveChatMemberMutation,
  useUpdateMemberRoleMutation,
  useTransferChatOwnershipMutation,
  useMarkChatReadMutation,
  useUploadChatAvatarMutation,
  useDeleteChatAvatarMutation,
} = chatApi;
