import { useGetFriendRequestsQuery } from "../store/friendApi";

export function useIncomingFriendRequests(): number {
  const { data: requests = [] } = useGetFriendRequestsQuery();
  return requests.filter((request) => request.isIncoming).length;
}
