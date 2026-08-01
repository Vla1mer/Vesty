import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "../api/axiosBaseQuery";
import {
  CHAT_API_TAGS,
  MESSAGE_API_TAGS,
  USER_API_TAGS,
  FRIEND_API_TAGS,
  BLOCK_API_TAGS,
} from "../api/constants";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: axiosBaseQuery(),
  tagTypes: [
    CHAT_API_TAGS.CHAT,
    CHAT_API_TAGS.CHAT_MEMBER,
    CHAT_API_TAGS.CHAT_INVITE,
    MESSAGE_API_TAGS.MESSAGE,
    USER_API_TAGS.USER,
    FRIEND_API_TAGS.FRIEND,
    FRIEND_API_TAGS.FRIEND_REQUEST,
    BLOCK_API_TAGS.BLOCK,
  ],
  refetchOnFocus: true,
  refetchOnReconnect: true,
  endpoints: () => ({}),
});
