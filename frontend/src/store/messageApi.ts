import { apiSlice } from "./apiSlice";
import {
  onMessageReceived,
  onMessageUpdated,
  onMessageDeleted,
  onReconnected,
} from "../lib/signalr";
import type { MessageDto, CreateDirectChatMessageDto } from "../types/api";

export const messageApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMessagesByChat: builder.query<MessageDto[], number>({
      query: (chatId) => ({ url: `/api/Chat/${chatId}/messages` }),
      transformResponse: (response: MessageDto[]) =>
        [...response].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        ),
      providesTags: (_result, _error, chatId) => [
        { type: "Message", id: chatId },
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
            onReconnected(() => {
              dispatch(
                apiSlice.util.invalidateTags([{ type: "Message", id: chatId }])
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
      { chatId: number; content: string }
    >({
      query: ({ chatId, content }) => ({
        url: `/api/Message/${chatId}/messages`,
        method: "post",
        data: { content },
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
        url: `/api/Message/${chatId}/messages/${id}`,
        method: "put",
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
      query: ({ id }) => ({ url: `/api/Message/${id}`, method: "delete" }),
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

    createDirectChatAndSendMessage: builder.mutation<
      MessageDto,
      CreateDirectChatMessageDto
    >({
      query: (dto) => ({ url: "/api/Message/direct", method: "post", data: dto }),
      invalidatesTags: [{ type: "Chat", id: "LIST" }],
    }),
  }),
});

export const {
  useGetMessagesByChatQuery,
  useCreateMessageMutation,
  useUpdateMessageMutation,
  useDeleteMessageMutation,
  useCreateDirectChatAndSendMessageMutation,
} = messageApi;
