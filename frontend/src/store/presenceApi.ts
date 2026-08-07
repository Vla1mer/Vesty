import { apiSlice } from "./apiSlice";
import { whileCached } from "./whileCached";
import { endpoints } from "../api/endpoints";
import { onPresenceChanged, onReconnected } from "../lib/signalr";
import type { UserPresenceDto } from "../types/api";

export const presenceApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPresence: builder.query<UserPresenceDto[], number[]>({
      query: (userIds) => ({ url: endpoints.user.presence(userIds) }),
      serializeQueryArgs: ({ queryArgs, endpointName }) =>
        `${endpointName}(${[...queryArgs].sort((a, b) => a - b).join(",")})`,
      async onCacheEntryAdded(userIds, lifecycle) {
        const { updateCachedData, dispatch } = lifecycle;
        await whileCached(lifecycle, () => [
          onPresenceChanged((presence) => {
            if (!userIds.includes(presence.userId)) return;
            updateCachedData((draft) => {
              const known = draft.find((p) => p.userId === presence.userId);
              if (known) {
                known.isOnline = presence.isOnline;
                known.lastSeenAt = presence.lastSeenAt;
              }
            });
          }),

          onReconnected(() => {
            dispatch(presenceApi.util.invalidateTags([]));
            dispatch(
              presenceApi.endpoints.getPresence.initiate(userIds, {
                forceRefetch: true,
              })
            );
          }),
        ]);
      },
    }),
  }),
});

export const { useGetPresenceQuery } = presenceApi;
