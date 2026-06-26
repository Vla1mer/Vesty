import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "../api/axiosBaseQuery";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Chat", "Message", "User", "ChatMember"],
  refetchOnFocus: true,
  refetchOnReconnect: true,
  endpoints: () => ({}),
});
