import { apiSlice } from "./apiSlice";
import { endpoints } from "../api/endpoints";
import { getCurrentUserId } from "../api/client";
import { CHAT_API_TAGS, MESSAGE_API_TAGS, TAG_ID } from "../api/constants";
import { HTTP_METHOD } from "../utils/http";
import {
  onMessageReactionsUpdated,
  onMessageReceived,
  onMessageUpdated,
  onMessageDeleted,
  onReconnected,
} from "../lib/signalr";
import type { MessageDto, CreateDirectChatMessageDto } from "../types/api";

export const messageApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMessagesByChat: builder.query<MessageDto[], number>({
      query: (chatId) => ({ url: endpoints.chat.messages(chatId) }),
      transformResponse: (response: MessageDto[]) =>
        [...response].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        ),
      providesTags: (_result, _error, chatId) => [
        { type: MESSAGE_API_TAGS.MESSAGE, id: chatId },
      ],
      async onCacheEntryAdded(
        chatId,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, dispatch }
      ) {
        const subscriptions: Array<() => void> = [];
        try {
          await cacheDataLoaded;

          subscriptions.push(
            onMessageReceived((message) => {
              if (message.chatId !== chatId) return;
              updateCachedData((draft) => {
                if (!draft.some((m) => m.id === message.id)) draft.push(message);
              });
            })
          );

          subscriptions.push(
            onMessageUpdated((message) => {
              if (message.chatId !== chatId) return;
              updateCachedData((draft) => {
                const index = draft.findIndex((m) => m.id === message.id);
                if (index !== -1) draft[index] = message;
              });
            })
          );

          subscriptions.push(
            onMessageDeleted(({ chatId: eventChatId, messageId }) => {
              if (eventChatId !== chatId) return;
              updateCachedData((draft) => {
                const index = draft.findIndex((m) => m.id === messageId);
                if (index !== -1) draft.splice(index, 1);
              });
            })
          );

          subscriptions.push(
            onMessageReactionsUpdated((event) => {
              if (event.chatId !== chatId) return;
              updateCachedData((draft) => {
                const message = draft.find((m) => m.id === event.messageId);
                if (message) message.reactions = event.reactions;
              });
            })
          );

          subscriptions.push(
            onReconnected(() => {
              dispatch(
                apiSlice.util.invalidateTags([{ type: MESSAGE_API_TAGS.MESSAGE, id: chatId }])
              );
            })
          );

          await cacheEntryRemoved;
        } finally {
          subscriptions.forEach((unsubscribe) => unsubscribe());
        }
      },
    }),

    createMessage: builder.mutation<
      MessageDto,
      { chatId: number; content: string; replyToMessageId?: number }
    >({
      query: ({ chatId, content, replyToMessageId }) => ({
        url: endpoints.message.forChat(chatId),
        method: HTTP_METHOD.POST,
        data: { content, replyToMessageId },
      }),
      async onQueryStarted({ chatId }, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(
          messageApi.util.updateQueryData("getMessagesByChat", chatId, (draft) => {
            if (!draft.some((m) => m.id === data.id)) draft.push(data);
          })
        );
      },
    }),

    updateMessage: builder.mutation<
      void,
      { chatId: number; id: number; content: string }
    >({
      query: ({ chatId, id, content }) => ({
        url: endpoints.message.inChat(chatId, id),
        method: HTTP_METHOD.PUT,
        data: { content },
      }),
      async onQueryStarted({ chatId, id, content }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          messageApi.util.updateQueryData("getMessagesByChat", chatId, (draft) => {
            const message = draft.find((m) => m.id === id);
            if (message) {
              message.content = content;
              message.isEdited = true;
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),

    deleteMessage: builder.mutation<void, { chatId: number; id: number }>({
      query: ({ id }) => ({ url: endpoints.message.byId(id), method: HTTP_METHOD.DELETE }),
      async onQueryStarted({ chatId, id }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          messageApi.util.updateQueryData("getMessagesByChat", chatId, (draft) => {
            const index = draft.findIndex((m) => m.id === id);
            if (index !== -1) draft.splice(index, 1);
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),

    toggleReaction: builder.mutation<
      void,
      { chatId: number; messageId: number; emoji: string; active: boolean }
    >({
      query: ({ messageId, emoji, active }) =>
        active
          ? {
              url: endpoints.message.reaction(messageId, emoji),
              method: HTTP_METHOD.DELETE,
            }
          : {
              url: endpoints.message.reactions(messageId),
              method: HTTP_METHOD.POST,
              data: { emoji },
            },
      async onQueryStarted(
        { chatId, messageId, emoji, active },
        { dispatch, queryFulfilled }
      ) {
        const currentUserId = getCurrentUserId();
        if (currentUserId === null) return;

        const patch = dispatch(
          messageApi.util.updateQueryData("getMessagesByChat", chatId, (draft) => {
            const message = draft.find((m) => m.id === messageId);
            if (!message) return;

            const reactions = message.reactions ?? [];
            const existing = reactions.find((r) => r.emoji === emoji);

            if (active) {
              if (!existing) return;
              existing.userIds = existing.userIds.filter((id) => id !== currentUserId);
              message.reactions = reactions.filter((r) => r.userIds.length > 0);
              return;
            }

            if (existing) {
              if (!existing.userIds.includes(currentUserId)) {
                existing.userIds.push(currentUserId);
              }
            } else {
              reactions.push({ emoji, userIds: [currentUserId] });
              message.reactions = reactions;
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),

    createDirectChatAndSendMessage: builder.mutation<
      MessageDto,
      CreateDirectChatMessageDto
    >({
      query: (dto) => ({ url: endpoints.message.direct, method: HTTP_METHOD.POST, data: dto }),
      invalidatesTags: [{ type: CHAT_API_TAGS.CHAT, id: TAG_ID.LIST }],
    }),
  }),
});

export const {
  useGetMessagesByChatQuery,
  useCreateMessageMutation,
  useUpdateMessageMutation,
  useDeleteMessageMutation,
  useCreateDirectChatAndSendMessageMutation,
  useToggleReactionMutation,
} = messageApi;
