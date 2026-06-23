import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetChatsQuery } from "../store/chatApi";
import { useAuth } from "../context/useAuth";
import { ChatListItem } from "../components/ChatListItem";
import { CreateChatModal } from "../components/CreateChatModal";
import { SelectUserModal } from "../components/SelectUserModal";
import { SearchBar } from "../components/SearchBar";
import { SearchResults } from "../components/SearchResults";
import { FloatingActionButton } from "../components/FloatingActionButton";
import { BottomNav } from "../components/BottomNav";

export function ChatsPage() {
  const navigate = useNavigate();
  const { userName, logout } = useAuth();
  const { data: chats = [], isLoading, isError } = useGetChatsQuery();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSelectUserOpen, setIsSelectUserOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">
            <span className="text-amber-400">ChatApp</span> Messenger
          </h1>
          {userName && (
            <p className="text-sm text-slate-400 mt-1">Signed in as {userName}</p>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 text-slate-100 transition"
        >
          Logout
        </button>
      </header>

      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      {isLoading && <p className="text-slate-400">Loading...</p>}

      {isError && (
        <div className="text-sm text-red-400 bg-red-950 border border-red-900 rounded p-3 mb-4">
          Failed to load chats
        </div>
      )}

      {!isLoading && !isError && (
        <div className="pb-32">
          {isSearching ? (
            <SearchResults query={searchQuery} chats={chats} />
          ) : chats.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-lg">No chats yet</p>
              <p className="text-sm mt-2">
                Tap the 💬 button to start a conversation.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {chats.map((chat) => (
                <ChatListItem key={chat.id} chat={chat} />
              ))}
            </div>
          )}
        </div>
      )}

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

      {isCreateModalOpen && (
        <CreateChatModal onClose={() => setIsCreateModalOpen(false)} />
      )}

      {isSelectUserOpen && (
        <SelectUserModal onClose={() => setIsSelectUserOpen(false)} />
      )}

      <BottomNav />
    </div>
  );
}
