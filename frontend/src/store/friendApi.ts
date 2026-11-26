import { apiSlice } from "./apiSlice";
import { endpoints } from "../api/endpoints";
import { FRIEND_API_TAGS, TAG_ID, USER_API_TAGS } from "../api/constants";
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

const userTag = (userId: number) => ({ type: USER_API_TAGS.USER, id: userId }) as const;

const relationTags = (userId: number) => [
  FRIEND_LIST,
  REQUEST_LIST,
  userTag(userId),
  { type: USER_API_TAGS.USER, id: TAG_ID.LIST } as const,
];

export const friendApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getFriends: builder.query<FriendDto[], void>({
      query: () => ({ url: endpoints.friend.base }),
      providesTags: [FRIEND_LIST],
      async onCacheEntryAdded(
        _arg,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, dispatch }
      ) {
        const unsubscribes: Array<() => void> = [];
        try {
          await cacheDataLoaded;

          unsubscribes.push(
            onFriendshipAccepted((friend) => {
              updateCachedData((draft) => {
                if (!draft.some((f) => f.userId === friend.userId)) draft.push(friend);
              });
              dispatch(apiSlice.util.invalidateTags([userTag(friend.userId)]));
            })
          );

          unsubscribes.push(
            onFriendshipRemoved((userId) => {
              updateCachedData((draft) => {
                const index = draft.findIndex((f) => f.userId === userId);
                if (index !== -1) draft.splice(index, 1);
              });
              dispatch(apiSlice.util.invalidateTags([userTag(userId)]));
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
      invalidatesTags: (_result, _error, userId) => relationTags(userId),
    }),

    acceptFriendRequest: builder.mutation<FriendDto, number>({
      query: (userId) => ({
        url: endpoints.friend.accept(userId),
        method: HTTP_METHOD.POST,
      }),
      invalidatesTags: (_result, _error, userId) => relationTags(userId),
    }),

    removeFriend: builder.mutation<void, number>({
      query: (userId) => ({
        url: endpoints.friend.byUser(userId),
        method: HTTP_METHOD.DELETE,
      }),
      invalidatesTags: (_result, _error, userId) => relationTags(userId),
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
