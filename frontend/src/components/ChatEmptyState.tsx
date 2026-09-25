import { MessagesSquare } from "lucide-react";
import { EmptyState } from "./ui/EmptyState";
import { useLanguage } from "../context/useLanguage";

export function ChatEmptyState() {
  const { t } = useLanguage();

  return (
    <EmptyState
      className="h-full"
      Icon={MessagesSquare}
      title={t("chats.pick")}
      description={t("chats.pickHint")}
    />
  );
}
