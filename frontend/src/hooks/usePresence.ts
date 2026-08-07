import { useMemo } from "react";
import { useGetPresenceQuery } from "../store/presenceApi";
import type { UserPresenceDto } from "../types/api";

export function usePresence(userIds: number[]) {
  const wanted = useMemo(
    () => [...new Set(userIds.filter((id) => Number.isFinite(id)))].sort((a, b) => a - b),
    [userIds]
  );

  const { data = [] } = useGetPresenceQuery(wanted, { skip: wanted.length === 0 });

  return useMemo(() => {
    const byUser = new Map<number, UserPresenceDto>(
      data.map((entry) => [entry.userId, entry])
    );
    return {
      isOnline: (userId: number) => byUser.get(userId)?.isOnline ?? false,
      lastSeenAt: (userId: number) => byUser.get(userId)?.lastSeenAt ?? null,
    };
  }, [data]);
}
