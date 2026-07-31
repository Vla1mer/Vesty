import { useGetFriendRequestsQuery } from "../store/friendApi";

/**
 * Держит запрос заявок подписанным, пока смонтирована навигация:
 * без активного кеша обработчики SignalR не работают.
 */
export function useIncomingFriendRequests(): number {
  const { data: requests = [] } = useGetFriendRequestsQuery();
  return requests.filter((request) => request.isIncoming).length;
}
