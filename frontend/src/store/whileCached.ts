type Unsubscribe = () => void;

interface CacheLifecycle {
  cacheDataLoaded: Promise<unknown>;
  cacheEntryRemoved: Promise<void>;
}

export async function whileCached(
  { cacheDataLoaded, cacheEntryRemoved }: CacheLifecycle,
  subscribe: () => Unsubscribe[]
): Promise<void> {
  let subscriptions: Unsubscribe[] = [];
  try {
    await cacheDataLoaded;
    subscriptions = subscribe();
    await cacheEntryRemoved;
  } finally {
    subscriptions.forEach((unsubscribe) => unsubscribe());
  }
}
