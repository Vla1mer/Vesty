import { NavLink } from "react-router-dom";

const tabs = [
  { to: "/profile", icon: "👤", label: "Profile" },
  { to: "/chats", icon: "💬", label: "Chats" },
  { to: "/settings", icon: "⚙️", label: "Settings" },
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 bg-slate-900 border-t border-slate-700">
      <div className="max-w-4xl mx-auto flex">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 transition ${
                isActive
                  ? "text-amber-400"
                  : "text-slate-400 hover:text-slate-100"
              }`
            }
          >
            <span className="text-2xl leading-none">{tab.icon}</span>
            <span className="text-xs mt-1">{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
