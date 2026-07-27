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

function versioned(path: string, avatarUpdatedAt: string): string {
  return `${API_URL}${path}?v=${new Date(avatarUpdatedAt).getTime()}`;
}

export function avatarUrl(userId: number, avatarUpdatedAt: string): string {
  return versioned(endpoints.user.avatar(userId), avatarUpdatedAt);
}

interface AvatarViewProps {
  src?: string;
  fallbackText: string;
  fallbackColor: string;
  alt: string;
  size: AvatarSize;
  className: string;
}

function AvatarView({
  src,
  fallbackText,
  fallbackColor,
  alt,
  size,
  className,
}: AvatarViewProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const base = `${SIZES[size]} shrink-0 rounded-full overflow-hidden select-none ${className}`;

  if (src && src !== failedSrc) {
    return (
      <img
        src={src}
        alt={alt}
        onError={() => setFailedSrc(src)}
        className={`${base} object-cover bg-slate-700`}
      />
    );
  }

  return (
    <div
      aria-label={alt}
      className={`${base} ${fallbackColor} flex items-center justify-center font-semibold text-slate-900`}
    >
      {fallbackText}
    </div>
  );
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
  return (
    <AvatarView
      src={avatarUpdatedAt ? avatarUrl(userId, avatarUpdatedAt) : undefined}
      fallbackText={initialsOf(userName, name, surname)}
      fallbackColor={PALETTE[Math.abs(userId) % PALETTE.length]}
      alt={userName ?? "avatar"}
      size={size}
      className={className}
    />
  );
}

interface ChatAvatarProps {
  chatId: number;
  name: string;
  avatarUpdatedAt?: string | null;
  size?: AvatarSize;
  className?: string;
}

export function ChatAvatar({
  chatId,
  name,
  avatarUpdatedAt,
  size = "md",
  className = "",
}: ChatAvatarProps) {
  return (
    <AvatarView
      src={
        avatarUpdatedAt
          ? versioned(endpoints.chat.avatar(chatId), avatarUpdatedAt)
          : undefined
      }
      fallbackText={(name.charAt(0) || "#").toUpperCase()}
      fallbackColor="bg-slate-700 !text-slate-200"
      alt={name}
      size={size}
      className={className}
    />
  );
}
