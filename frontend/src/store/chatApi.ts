import { apiSlice } from "./apiSlice";
import {
  onChatCreated,
  onChatDeleted,
  onChatRenamed,
  onReconnected,
} from "../lib/signalr";
import type { ChatDto, ChatForCreationDto } from "../types/api";

export const chatApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getChats: builder.query<ChatDto[], void>({
      query: () => ({ url: "/api/Chat" }),
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
  }),
});

export const {
  useGetChatsQuery,
  useCreateChatMutation,
  useDeleteChatMutation,
  useRenameChatMutation,
} = chatApi;
