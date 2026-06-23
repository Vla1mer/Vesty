import { apiSlice } from "./apiSlice";
import type { UserDto, UserForUpdateDto } from "../types/api";

export const userApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllUsers: builder.query<UserDto[], void>({
      query: () => ({ url: "/api/User", params: { pageSize: 50 } }),
      providesTags: (result) =>
        result
          ? [
              ...result.map((user) => ({ type: "User" as const, id: user.id })),
              { type: "User" as const, id: "LIST" },
            ]
          : [{ type: "User" as const, id: "LIST" }],
    }),

    getUserById: builder.query<UserDto, number>({
      query: (id) => ({ url: `/api/User/${id}` }),
      providesTags: (_result, _error, id) => [{ type: "User", id }],
    }),

    updateUser: builder.mutation<void, { id: number; dto: UserForUpdateDto }>({
      query: ({ id, dto }) => ({ url: `/api/User/${id}`, method: "put", data: dto }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "User", id },
        { type: "User", id: "LIST" },
      ],
    }),

    deleteUser: builder.mutation<void, number>({
      query: (id) => ({ url: `/api/User/${id}`, method: "delete" }),
      invalidatesTags: [{ type: "User", id: "LIST" }],
    }),
  }),
});

export const {
  useGetAllUsersQuery,
  useGetUserByIdQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = userApi;
