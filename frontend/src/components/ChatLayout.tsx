import { Outlet, useLocation } from "react-router-dom";
import { ChatsPage } from "../pages/ChatsPage";

export function ChatLayout() {
  const location = useLocation();
  const hasSelection = /^\/chats\/.+/.test(location.pathname);

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className={`${
          hasSelection ? "hidden md:flex" : "flex"
        } w-full md:w-96 md:border-r border-slate-700 flex-col`}
      >
        <ChatsPage />
      </aside>
      <main
        className={`${
          hasSelection ? "flex" : "hidden md:flex"
        } flex-1 flex-col min-w-0`}
      >
        <Outlet />
      </main>
    </div>
  );
}
