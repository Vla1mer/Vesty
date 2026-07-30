export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block animate-pulse rounded bg-surface-muted ${className}`}
    />
  );
}

export function ChatListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading chats">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="mx-2 flex items-center gap-3 px-3 py-1.5">
          <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MessageListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading messages" className="space-y-3 py-2">
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className={`flex gap-2 ${i % 2 ? "justify-end md:justify-start" : "justify-start"}`}
        >
          <Skeleton className="hidden h-7 w-7 shrink-0 rounded-full md:block" />
          <Skeleton
            className={`h-10 rounded-bubble ${i % 3 === 0 ? "w-52" : i % 3 === 1 ? "w-36" : "w-64"}`}
          />
        </div>
      ))}
    </div>
  );
}
