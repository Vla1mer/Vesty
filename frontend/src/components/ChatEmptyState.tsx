import { MessagesSquare } from "lucide-react";
import { EmptyState } from "./ui/EmptyState";

export function ChatEmptyState() {
  return (
    <EmptyState
      className="h-full"
      Icon={MessagesSquare}
      title="Select a chat"
      description="Pick a conversation from the list, or start a new one."
    />
  );
}
