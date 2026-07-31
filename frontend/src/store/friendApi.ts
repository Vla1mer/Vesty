import { apiSlice } from "./apiSlice";
import { endpoints } from "../api/endpoints";
import { FRIEND_API_TAGS, TAG_ID } from "../api/constants";
import { HTTP_METHOD } from "../utils/http";
import {
  onFriendRequestReceived,
  onFriendshipAccepted,
  onFriendshipRemoved,
} from "../lib/signalr";
import type { FriendDto } from "../types/api";

const FRIEND_LIST = { type: FRIEND_API_TAGS.FRIEND, id: TAG_ID.LIST } as const;
const REQUEST_LIST = {
  type: FRIEND_API_TAGS.FRIEND_REQUEST,
  id: TAG_ID.LIST,
} as const;

export const friendApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getFriends: builder.query<FriendDto[], void>({
      query: () => ({ url: endpoints.friend.base }),
      providesTags: [FRIEND_LIST],
      async onCacheEntryAdded(_arg, { updateCachedData, cacheDataLoaded, cacheEntryRemoved }) {
        const unsubscribes: Array<() => void> = [];
        try {
          await cacheDataLoaded;

          unsubscribes.push(
            onFriendshipAccepted((friend) => {
              updateCachedData((draft) => {
                if (!draft.some((f) => f.userId === friend.userId)) draft.push(friend);
              });
            })
          );

          unsubscribes.push(
            onFriendshipRemoved((userId) => {
              updateCachedData((draft) => {
                const index = draft.findIndex((f) => f.userId === userId);
                if (index !== -1) draft.splice(index, 1);
              });
            })
          );
        } finally {
          await cacheEntryRemoved;
          unsubscribes.forEach((unsubscribe) => unsubscribe());
        }
      },
    }),

    getFriendRequests: builder.query<FriendDto[], void>({
      query: () => ({ url: endpoints.friend.requests }),
      providesTags: [REQUEST_LIST],
      async onCacheEntryAdded(_arg, { updateCachedData, cacheDataLoaded, cacheEntryRemoved }) {
        const unsubscribes: Array<() => void> = [];
        try {
          await cacheDataLoaded;

          unsubscribes.push(
            onFriendRequestReceived((request) => {
              updateCachedData((draft) => {
                if (!draft.some((f) => f.userId === request.userId)) draft.unshift(request);
              });
            })
          );

          unsubscribes.push(
            onFriendshipAccepted((friend) => {
              updateCachedData((draft) => {
                const index = draft.findIndex((f) => f.userId === friend.userId);
                if (index !== -1) draft.splice(index, 1);
              });
            })
          );

          unsubscribes.push(
            onFriendshipRemoved((userId) => {
              updateCachedData((draft) => {
                const index = draft.findIndex((f) => f.userId === userId);
                if (index !== -1) draft.splice(index, 1);
              });
            })
          );
        } finally {
          await cacheEntryRemoved;
          unsubscribes.forEach((unsubscribe) => unsubscribe());
        }
      },
    }),

    sendFriendRequest: builder.mutation<FriendDto, number>({
      query: (userId) => ({
        url: endpoints.friend.byUser(userId),
        method: HTTP_METHOD.POST,
      }),
      invalidatesTags: [FRIEND_LIST, REQUEST_LIST],
    }),

    acceptFriendRequest: builder.mutation<FriendDto, number>({
      query: (userId) => ({
        url: endpoints.friend.accept(userId),
        method: HTTP_METHOD.POST,
      }),
      invalidatesTags: [FRIEND_LIST, REQUEST_LIST],
    }),

    removeFriend: builder.mutation<void, number>({
      query: (userId) => ({
        url: endpoints.friend.byUser(userId),
        method: HTTP_METHOD.DELETE,
      }),
      invalidatesTags: [FRIEND_LIST, REQUEST_LIST],
    }),
  }),
});

export const {
  useGetFriendsQuery,
  useGetFriendRequestsQuery,
  useSendFriendRequestMutation,
  useAcceptFriendRequestMutation,
  useRemoveFriendMutation,
} = friendApi;
