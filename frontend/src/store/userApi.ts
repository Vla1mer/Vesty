import { apiSlice } from "./apiSlice";
import { endpoints } from "../api/endpoints";
import { USER_API_TAGS, TAG_ID } from "../api/constants";
import { HTTP_METHOD } from "../utils/http";
import type { UserDto, UserForUpdateDto } from "../types/api";

export const userApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllUsers: builder.query<UserDto[], void>({
      query: () => ({ url: endpoints.user.base, params: { pageSize: 50 } }),
      providesTags: (result) =>
        result
          ? [
              ...result.map((user) => ({ type: USER_API_TAGS.USER, id: user.id })),
              { type: USER_API_TAGS.USER, id: TAG_ID.LIST },
            ]
          : [{ type: USER_API_TAGS.USER, id: TAG_ID.LIST }],
    }),

    getUserById: builder.query<UserDto, number>({
      query: (id) => ({ url: endpoints.user.byId(id) }),
      providesTags: (_result, _error, id) => [{ type: USER_API_TAGS.USER, id }],
    }),

    updateUser: builder.mutation<void, { id: number; dto: UserForUpdateDto }>({
      query: ({ id, dto }) => ({ url: endpoints.user.byId(id), method: HTTP_METHOD.PUT, data: dto }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: USER_API_TAGS.USER, id },
        { type: USER_API_TAGS.USER, id: TAG_ID.LIST },
      ],
    }),

    deleteUser: builder.mutation<void, number>({
      query: (id) => ({ url: endpoints.user.byId(id), method: HTTP_METHOD.DELETE }),
      invalidatesTags: [{ type: USER_API_TAGS.USER, id: TAG_ID.LIST }],
    }),
  }),
});

export const {
  useGetAllUsersQuery,
  useGetUserByIdQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = userApi;
