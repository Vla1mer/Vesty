import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetChatsQuery } from "../store/chatsApi";
import { useGetUserByIdQuery } from "../store/userApi";
import { useAuth } from "../context/useAuth";
import { Avatar } from "../components/Avatar";
import { ChatListItem } from "../components/ChatListItem";
import { usePresence } from "../hooks/usePresence";
import { CreateChatModal } from "../components/CreateChatModal";
import { SelectUserModal } from "../components/SelectUserModal";
import { MessageSquarePlus, MessagesSquare, User, Users } from "lucide-react";
import { SearchBar } from "../components/SearchBar";
import { SearchResults } from "../components/SearchResults";
import { FloatingActionButton } from "../components/FloatingActionButton";
import { ProfileModal } from "../components/ProfileModal";
import { SettingsModal } from "../components/SettingsModal";
import { FriendsModal } from "../components/FriendsModal";
import { SideRail } from "../components/SideRail";
import { useIsMobile } from "../hooks/useIsMobile";
import { useIncomingFriendRequests } from "../hooks/useIncomingFriendRequests";
import { isDirectChat } from "../types/api";
import { BottomNav } from "../components/BottomNav";
import { FormError } from "../components/FormError";
import { AnimatePresence, motion } from "framer-motion";
import { EmptyState } from "../components/ui/EmptyState";
import { ChatListSkeleton } from "../components/ui/Skeleton";

interface Props {
  isResizing?: boolean;
}

export function ChatsPage({ isResizing = false }: Props) {
  const navigate = useNavigate();
  const { userName, userId, logout } = useAuth();
  const { data: currentUser } = useGetUserByIdQuery(userId as number, {
    skip: userId === null,
  });
  const { data: chats = [], isLoading, isError } = useGetChatsQuery();
  const presence = usePresence(
    useMemo(
      () =>
        chats
          .filter(isDirectChat)
          .map((chat) => chat.partnerUserId)
          .filter((id): id is number => id !== undefined),
      [chats]
    )
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSelectUserOpen, setIsSelectUserOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFriendsOpen, setIsFriendsOpen] = useState(false);
  const incomingRequests = useIncomingFriendRequests();
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useIsMobile();

  function openOnDesktopOrNavigate(
    openModal: (open: boolean) => void,
    path: string
  ) {
    if (isMobile) navigate(path);
    else openModal(true);
  }

  const openProfile = () => openOnDesktopOrNavigate(setIsProfileOpen, "/profile");
  const openFriends = () => openOnDesktopOrNavigate(setIsFriendsOpen, "/friends");
  const openSettings = () =>
    openOnDesktopOrNavigate(setIsSettingsOpen, "/settings");
  const openCreateChat = () =>
    openOnDesktopOrNavigate(setIsCreateModalOpen, "/chats/new-group");
  const openSelectUser = () =>
    openOnDesktopOrNavigate(setIsSelectUserOpen, "/chats/new-direct");

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="relative flex-1 min-h-0 flex bg-surface">
      <SideRail
        avatar={
          userId === null ? (
            <User size={22} aria-hidden="true" />
          ) : (
            <Avatar
              userId={userId}
              userName={currentUser?.userName ?? userName ?? undefined}
              name={currentUser?.name}
              surname={currentUser?.surname}
              avatarUpdatedAt={currentUser?.avatarUpdatedAt}
              size="sm"
            />
          )
        }
        incomingRequests={incomingRequests}
        onProfile={openProfile}
        onFriends={openFriends}
        onSettings={openSettings}
        onLogout={handleLogout}
      />

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="flex items-center justify-between gap-2 p-4 border-b border-line">
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-content truncate">
              <span className="text-brand">Vesty</span>
            </h1>
            {userName && (
              <p className="text-xs text-content-muted truncate">{userName}</p>
            )}
          </div>
        </div>

        <FloatingActionButton
          actions={[
            {
              Icon: MessageSquarePlus,
              label: "New direct message",
              description: "Start a private conversation with someone",
              onClick: openSelectUser,
            },
            {
              Icon: Users,
              label: "New group chat",
              description: "Create a chat for multiple people",
              onClick: openCreateChat,
            },
          ]}
        />
      </header>

      <div className="px-4 pt-4 pb-2">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pb-20 md:pb-4 scrollbar-none">
        {isLoading && <ChatListSkeleton />}

        {isError && (
          <FormError className="mx-4 mb-4" message="Failed to load chats" />
        )}

        {!isLoading && !isError && (
          <>
            {isSearching ? (
              <div className="px-4">
                <SearchResults query={searchQuery} chats={chats} />
              </div>
            ) : chats.length === 0 ? (
              <EmptyState
                Icon={MessagesSquare}
                title="No chats yet"
                description="Use the compose button to start a conversation."
              />
            ) : (
              <div>
                <AnimatePresence initial={false}>
                  {chats.map((chat) => (
                    <motion.div
                      key={chat.id}
                      layout={!isResizing}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <ChatListItem
                        chat={chat}
                        online={
                          isDirectChat(chat) && chat.partnerUserId
                            ? presence.isOnline(chat.partnerUserId)
                            : false
                        }
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>

      </div>

      <AnimatePresence>
        {isCreateModalOpen && (
          <CreateChatModal onClose={() => setIsCreateModalOpen(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSelectUserOpen && (
          <SelectUserModal onClose={() => setIsSelectUserOpen(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isProfileOpen && (
          <ProfileModal onClose={() => setIsProfileOpen(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isFriendsOpen && (
          <FriendsModal onClose={() => setIsFriendsOpen(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsModal onClose={() => setIsSettingsOpen(false)} />
        )}
      </AnimatePresence>

      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
