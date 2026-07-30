import { MessagesSquare } from "lucide-react";
export function ChatEmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-content-subtle p-6 text-center">
      <MessagesSquare size={56} aria-hidden="true" className="mb-4 text-content-subtle" />
      <p className="text-lg">Select a chat to start messaging</p>
    </div>
  );
}
