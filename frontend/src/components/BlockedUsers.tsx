import { AnimatePresence, motion } from "framer-motion";
import { ShieldOff } from "lucide-react";
import { useLanguage } from "../context/useLanguage";
import { SectionHeading } from "./ui/SectionHeading";
import {
  useGetBlockedUsersQuery,
  useUnblockUserMutation,
} from "../store/blockApi";
import { Avatar } from "./Avatar";
import { Button } from "./ui/Button";
import { FormError } from "./FormError";
import { Skeleton } from "./ui/Skeleton";

export function BlockedUsers() {
  const { t } = useLanguage();
  const { data: blocked = [], isLoading, isError } = useGetBlockedUsersQuery();
  const [unblockUser, unblockState] = useUnblockUserMutation();

  if (isLoading) {
    return (
      <section className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-12" />
      </section>
    );
  }

  if (isError) return <FormError message={t("blocked.loadFailed")} />;

  return (
    <section>
      <SectionHeading>{t("blocked.title")}</SectionHeading>
      <p className="mb-3 text-xs text-content-subtle">{t("blocked.hint")}</p>

      {blocked.length === 0 ? (
        <p className="rounded-card border border-line bg-surface-muted px-4 py-3 text-sm text-content-muted">
          {t("blocked.empty")}
        </p>
      ) : (
        <ul className="space-y-1">
          <AnimatePresence initial={false}>
            {blocked.map((user) => (
              <motion.li
                key={user.userId}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-3 rounded-card px-2 py-2 transition-colors hover:bg-surface-muted"
              >
                <Avatar
                  userId={user.userId}
                  userName={user.userName}
                  name={user.name ?? undefined}
                  surname={user.surname ?? undefined}
                  avatarUpdatedAt={user.avatarUpdatedAt}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-content">
                    {[user.name, user.surname].filter(Boolean).join(" ") || user.userName}
                  </p>
                  <p className="truncate text-xs text-content-muted">@{user.userName}</p>
                </div>
                <Button
                  size="xs"
                  variant="neutral"
                  disabled={
                    unblockState.isLoading &&
                    unblockState.originalArgs === user.userId
                  }
                  onClick={() => unblockUser(user.userId)}
                >
                  <ShieldOff size={13} /> {t("blocked.unblock")}
                </Button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </section>
  );
}
