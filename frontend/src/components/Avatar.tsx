import { useState } from "react";
import { API_URL } from "../api/client";
import { endpoints } from "../api/endpoints";

const PALETTE = [
  "bg-amber-500",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-teal-500",
  "bg-orange-500",
  "bg-indigo-500",
];

const SIZES = {
  sm: "w-7 h-7 text-[11px]",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-lg",
  xl: "w-24 h-24 text-3xl",
} as const;

export type AvatarSize = keyof typeof SIZES;

export function avatarUrl(userId: number, avatarUpdatedAt: string): string {
  const version = new Date(avatarUpdatedAt).getTime();
  return `${API_URL}${endpoints.user.avatar(userId)}?v=${version}`;
}

function initialsOf(userName?: string, name?: string, surname?: string): string {
  if (name || surname) {
    return `${name?.[0] ?? ""}${surname?.[0] ?? ""}`.toUpperCase();
  }
  return (userName?.[0] ?? "?").toUpperCase();
}

interface AvatarProps {
  userId: number;
  userName?: string;
  name?: string;
  surname?: string;
  avatarUpdatedAt?: string | null;
  size?: AvatarSize;
  className?: string;
}

export function Avatar({
  userId,
  userName,
  name,
  surname,
  avatarUpdatedAt,
  size = "md",
  className = "",
}: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(avatarUpdatedAt) && !failed;
  const base = `${SIZES[size]} shrink-0 rounded-full overflow-hidden select-none ${className}`;

  if (showImage) {
    return (
      <img
        src={avatarUrl(userId, avatarUpdatedAt as string)}
        alt={userName ?? "avatar"}
        onError={() => setFailed(true)}
        className={`${base} object-cover bg-slate-700`}
      />
    );
  }

  const color = PALETTE[Math.abs(userId) % PALETTE.length];
  return (
    <div
      aria-label={userName ?? "avatar"}
      className={`${base} ${color} flex items-center justify-center font-semibold text-slate-900`}
    >
      {initialsOf(userName, name, surname)}
    </div>
  );
}
