import { NavLink } from "react-router-dom";
import { useIncomingFriendRequests } from "../hooks/useIncomingFriendRequests";
import { MessageSquare, Settings, User, Users } from "lucide-react";

const tabs = [
  { to: "/profile", Icon: User, label: "Profile" },
  { to: "/chats", Icon: MessageSquare, label: "Chats" },
  { to: "/friends", Icon: Users, label: "Friends" },
  { to: "/settings", Icon: Settings, label: "Settings" },
];

export function BottomNav() {
  const incomingRequests = useIncomingFriendRequests();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 bg-surface border-t border-line">
      <div className="max-w-4xl mx-auto flex">
        {tabs.map(({ to, Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 transition ${
                isActive
                  ? "text-accent-strong"
                  : "text-content-muted hover:text-content"
              }`
            }
          >
            <span className="relative">
              <Icon size={22} aria-hidden="true" />
              {to === "/friends" && incomingRequests > 0 && (
                <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-contrast">
                  {incomingRequests > 9 ? "9+" : incomingRequests}
                </span>
              )}
            </span>
            <span className="text-xs mt-1">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
