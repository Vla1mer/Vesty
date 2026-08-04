import { Outlet, useLocation } from "react-router-dom";
import { ChatsPage } from "../pages/ChatsPage";
import { useRailLabels } from "../hooks/useRailLabels";

export function ChatLayout() {
  const location = useLocation();
  const hasSelection = /^\/chats\/.+/.test(location.pathname);
  const showRailLabels = useRailLabels();

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className={`${hasSelection ? "hidden md:flex" : "flex"} ${
          showRailLabels ? "md:w-[456px]" : "md:w-[448px]"
        } h-screen w-full md:border-r border-line flex-col overflow-hidden`}
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
