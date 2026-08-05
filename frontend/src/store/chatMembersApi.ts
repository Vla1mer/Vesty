import { apiSlice } from "./apiSlice";
import { memberTag } from "./chatTags";
import { whileCached } from "./whileCached";
import { endpoints } from "../api/endpoints";
import { HTTP_METHOD } from "../utils/http";
import { onReconnected } from "../lib/signalr";
import type { ChatMemberWithRoleDto } from "../types/api";

export const chatMembersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
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
  }),
});

export const {
  useGetChatMembersQuery,
  useAddChatMemberMutation,
  useRemoveChatMemberMutation,
  useUpdateMemberRoleMutation,
  useTransferChatOwnershipMutation,
} = chatMembersApi;
