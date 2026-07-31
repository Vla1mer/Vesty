import { apiSlice } from "./apiSlice";
import { endpoints } from "../api/endpoints";
import {
  BLOCK_API_TAGS,
  FRIEND_API_TAGS,
  TAG_ID,
  USER_API_TAGS,
} from "../api/constants";
import { HTTP_METHOD } from "../utils/http";
import type { BlockedUserDto } from "../types/api";

const BLOCK_LIST = { type: BLOCK_API_TAGS.BLOCK, id: TAG_ID.LIST } as const;

// блокировка рвёт дружбу, поэтому оба списка друзей устаревают
const FRIEND_LISTS = [
  { type: FRIEND_API_TAGS.FRIEND, id: TAG_ID.LIST },
  { type: FRIEND_API_TAGS.FRIEND_REQUEST, id: TAG_ID.LIST },
] as const;

// заблокированные пропадают из поиска, разблокированные возвращаются
const USER_LIST = { type: USER_API_TAGS.USER, id: TAG_ID.LIST } as const;

export const blockApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBlockedUsers: builder.query<BlockedUserDto[], void>({
      query: () => ({ url: endpoints.block.base }),
      providesTags: [BLOCK_LIST],
    }),

    blockUser: builder.mutation<BlockedUserDto, number>({
      query: (userId) => ({
        url: endpoints.block.byUser(userId),
        method: HTTP_METHOD.POST,
      }),
      invalidatesTags: [BLOCK_LIST, USER_LIST, ...FRIEND_LISTS],
    }),

    unblockUser: builder.mutation<void, number>({
      query: (userId) => ({
        url: endpoints.block.byUser(userId),
        method: HTTP_METHOD.DELETE,
      }),
      invalidatesTags: [BLOCK_LIST, USER_LIST],
    }),
  }),
});

export const {
  useGetBlockedUsersQuery,
  useBlockUserMutation,
  useUnblockUserMutation,
} = blockApi;
