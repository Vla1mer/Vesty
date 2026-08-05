import { apiSlice } from "./apiSlice";
import { chatListTag, inviteTag } from "./chatTags";
import { endpoints } from "../api/endpoints";
import { HTTP_METHOD } from "../utils/http";
import type { ChatDto, ChatInviteDto, ChatInvitePreviewDto } from "../types/api";

export const chatInvitesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
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
  }),
});

export const {
  useGetChatInviteQuery,
  useCreateChatInviteMutation,
  useRevokeChatInviteMutation,
  usePreviewChatInviteQuery,
  useJoinChatByInviteMutation,
} = chatInvitesApi;
