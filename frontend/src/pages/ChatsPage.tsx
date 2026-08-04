import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetChatsQuery } from "../store/chatApi";
import { useGetUserByIdQuery } from "../store/userApi";
import { useAuth } from "../context/useAuth";
import { Avatar } from "../components/Avatar";
import { ChatListItem } from "../components/ChatListItem";
import { CreateChatModal } from "../components/CreateChatModal";
import { SelectUserModal } from "../components/SelectUserModal";
import { LogOut, Menu, MessageSquarePlus, MessagesSquare, Settings, User, Users } from "lucide-react";
import { SearchBar } from "../components/SearchBar";
import { SearchResults } from "../components/SearchResults";
import { FloatingActionButton } from "../components/FloatingActionButton";
import { ProfileModal } from "../components/ProfileModal";
import { SettingsModal } from "../components/SettingsModal";
import { FriendsModal } from "../components/FriendsModal";
import { useIsMobile } from "../hooks/useIsMobile";
import { useIncomingFriendRequests } from "../hooks/useIncomingFriendRequests";
import { BottomNav } from "../components/BottomNav";
import { FormError } from "../components/FormError";
import { AnimatePresence, motion } from "framer-motion";
import { EmptyState } from "../components/ui/EmptyState";
import { ChatListSkeleton } from "../components/ui/Skeleton";

export function ChatsPage() {
  const navigate = useNavigate();
  const { userName, userId, logout } = useAuth();
  const { data: currentUser } = useGetUserByIdQuery(userId as number, {
    skip: userId === null,
  });
  const { data: chats = [], isLoading, isError } = useGetChatsQuery();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSelectUserOpen, setIsSelectUserOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
    setIsMenuOpen(false);
    if (isMobile) navigate(path);
    else openModal(true);
  }

  const openProfile = () => openOnDesktopOrNavigate(setIsProfileOpen, "/profile");
  const openFriends = () => openOnDesktopOrNavigate(setIsFriendsOpen, "/friends");
  const openSettings = () =>
    openOnDesktopOrNavigate(setIsSettingsOpen, "/settings");
  const openCreateChat = () =>
    openOnDesktopOrNavigate(setIsCreateModalOpen, "/chats/new-group");

  useEffect(() => {
    if (!isMenuOpen) return;
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setIsMenuOpen(false);
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isMenuOpen]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="relative flex-1 min-h-0 flex flex-col bg-surface">
      <header className="flex items-center justify-between gap-2 p-4 border-b border-line">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Menu"
            className="relative hidden md:block text-content-muted hover:text-accent-strong transition"
          >
            <Menu size={22} />
            {incomingRequests > 0 && (
              <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-contrast">
                {incomingRequests > 9 ? "9+" : incomingRequests}
              </span>
            )}
          </button>
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
              onClick: () => setIsSelectUserOpen(true),
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
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <ChatListItem chat={chat} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>

      <div
        className={`fixed inset-0 z-40 ${
          isMenuOpen ? "" : "pointer-events-none"
        }`}
      >
        <div
          className={`absolute inset-0 bg-scrim/70 transition-opacity ${
            isMenuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsMenuOpen(false)}
        />
        <div
          className={`absolute top-0 left-0 bottom-0 w-72 max-w-[80%] bg-surface border-r border-line flex flex-col transition-transform duration-200 ${
            isMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-4 border-b border-line flex items-center gap-3">
            {userId !== null && (
              <Avatar
                userId={userId}
                userName={currentUser?.userName ?? userName ?? undefined}
                name={currentUser?.name}
                surname={currentUser?.surname}
                avatarUpdatedAt={currentUser?.avatarUpdatedAt}
                size="lg"
              />
            )}
            <p className="text-lg font-bold text-content truncate">
              {userName ?? "Account"}
            </p>
          </div>
          <nav className="flex-1 p-2 space-y-1">
            <button
              type="button"
              onClick={openProfile}
              className="w-full flex items-center gap-3 px-3 py-3 rounded text-content hover:bg-surface-muted transition text-left"
            >
              <User size={18} aria-hidden="true" /> Profile
            </button>
            <button
              type="button"
              onClick={openFriends}
              className="w-full flex items-center gap-3 px-3 py-3 rounded text-content hover:bg-surface-muted transition text-left"
            >
              <Users size={18} aria-hidden="true" />
              <span className="flex-1">Friends</span>
              {incomingRequests > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-bold text-accent-contrast">
                  {incomingRequests}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={openSettings}
              className="w-full flex items-center gap-3 px-3 py-3 rounded text-content hover:bg-surface-muted transition text-left"
            >
              <Settings size={18} aria-hidden="true" /> Settings
            </button>
          </nav>
          <div className="p-2 border-t border-line">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-3 rounded text-danger hover:bg-surface-muted transition"
            >
              <LogOut size={18} aria-hidden="true" /> Logout
            </button>
          </div>
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
