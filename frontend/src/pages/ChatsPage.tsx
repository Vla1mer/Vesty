import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetChatsQuery } from "../store/chatApi";
import { useAuth } from "../context/useAuth";
import { ChatListItem } from "../components/ChatListItem";
import { CreateChatModal } from "../components/CreateChatModal";
import { SelectUserModal } from "../components/SelectUserModal";
import { SearchBar } from "../components/SearchBar";
import { SearchResults } from "../components/SearchResults";
import { FloatingActionButton } from "../components/FloatingActionButton";
import { ProfileModal } from "../components/ProfileModal";
import { SettingsModal } from "../components/SettingsModal";
import { BottomNav } from "../components/BottomNav";

export function ChatsPage() {
  const navigate = useNavigate();
  const { userName, logout } = useAuth();
  const { data: chats = [], isLoading, isError } = useGetChatsQuery();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSelectUserOpen, setIsSelectUserOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  function openProfile() {
    setIsMenuOpen(false);
    if (window.matchMedia("(min-width: 768px)").matches) {
      setIsProfileOpen(true);
    } else {
      navigate("/profile");
    }
  }

  function openSettings() {
    setIsMenuOpen(false);
    if (window.matchMedia("(min-width: 768px)").matches) {
      setIsSettingsOpen(true);
    } else {
      navigate("/settings");
    }
  }

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
    <div className="relative flex-1 min-h-0 flex flex-col bg-slate-900">
      <header className="flex items-center justify-between gap-2 p-4 border-b border-slate-700">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Menu"
            className="hidden md:block text-2xl leading-none text-slate-300 hover:text-amber-400 transition"
          >
            ☰
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-100 truncate">
              <span className="text-amber-400">Vesty</span>
            </h1>
            {userName && (
              <p className="text-xs text-slate-400 truncate">{userName}</p>
            )}
          </div>
        </div>

        <FloatingActionButton
          actions={[
            {
              icon: "💬",
              label: "New direct message",
              description: "Start a private conversation with someone",
              onClick: () => setIsSelectUserOpen(true),
            },
            {
              icon: "👥",
              label: "New group chat",
              description: "Create a chat for multiple people",
              onClick: () => setIsCreateModalOpen(true),
            },
          ]}
        />
      </header>

      <div className="px-4 pt-4 pb-2">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pb-20 md:pb-4 scrollbar-none">
        {isLoading && <p className="text-slate-400 px-4">Loading...</p>}

        {isError && (
          <div className="text-sm text-red-400 bg-red-950 border border-red-900 rounded p-3 mx-4 mb-4">
            Failed to load chats
          </div>
        )}

        {!isLoading && !isError && (
          <>
            {isSearching ? (
              <div className="px-4">
                <SearchResults query={searchQuery} chats={chats} />
              </div>
            ) : chats.length === 0 ? (
              <div className="text-center py-12 text-slate-400 px-4">
                <p className="text-lg">No chats yet</p>
                <p className="text-sm mt-2">
                  Tap the 💬 button to start a conversation.
                </p>
              </div>
            ) : (
              <div>
                {chats.map((chat) => (
                  <ChatListItem key={chat.id} chat={chat} />
                ))}
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
          className={`absolute inset-0 bg-black/50 transition-opacity ${
            isMenuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsMenuOpen(false)}
        />
        <div
          className={`absolute top-0 left-0 bottom-0 w-72 max-w-[80%] bg-slate-900 border-r border-slate-700 flex flex-col transition-transform duration-200 ${
            isMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-4 border-b border-slate-700">
            <p className="text-lg font-bold text-slate-100 truncate">
              {userName ?? "Account"}
            </p>
          </div>
          <nav className="flex-1 p-2 space-y-1">
            <button
              type="button"
              onClick={openProfile}
              className="w-full flex items-center gap-3 px-3 py-3 rounded text-slate-200 hover:bg-slate-800 transition text-left"
            >
              <span className="text-xl">👤</span> Profile
            </button>
            <button
              type="button"
              onClick={openSettings}
              className="w-full flex items-center gap-3 px-3 py-3 rounded text-slate-200 hover:bg-slate-800 transition text-left"
            >
              <span className="text-xl">⚙️</span> Settings
            </button>
          </nav>
          <div className="p-2 border-t border-slate-700">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-3 rounded text-red-300 hover:bg-slate-800 transition"
            >
              <span className="text-xl">🚪</span> Logout
            </button>
          </div>
        </div>
      </div>

      {isCreateModalOpen && (
        <CreateChatModal onClose={() => setIsCreateModalOpen(false)} />
      )}

      {isSelectUserOpen && (
        <SelectUserModal onClose={() => setIsSelectUserOpen(false)} />
      )}

      {isProfileOpen && (
        <ProfileModal onClose={() => setIsProfileOpen(false)} />
      )}

      {isSettingsOpen && (
        <SettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}

      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
