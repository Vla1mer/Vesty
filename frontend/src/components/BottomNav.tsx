import { NavLink } from "react-router-dom";
import { MessageSquare, Settings, User, Users } from "lucide-react";

const tabs = [
  { to: "/profile", Icon: User, label: "Profile" },
  { to: "/chats", Icon: MessageSquare, label: "Chats" },
  { to: "/friends", Icon: Users, label: "Friends" },
  { to: "/settings", Icon: Settings, label: "Settings" },
];

export function BottomNav() {
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
            <Icon size={22} aria-hidden="true" />
            <span className="text-xs mt-1">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
