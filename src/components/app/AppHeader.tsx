"use client";

import { signOut } from "@/actions/auth";
import { NotificationBell } from "@/components/app/NotificationBell";

interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface AppHeaderProps {
  fullName: string | null;
  companyName: string;
  tokenBalance: number;
  tokenLimit: number;
  notifications?: AppNotification[];
}

export function AppHeader({
  fullName,
  companyName,
  tokenBalance,
  tokenLimit,
  notifications = [],
}: AppHeaderProps) {
  const percentUsed = tokenLimit > 0 ? ((tokenLimit - tokenBalance) / tokenLimit) * 100 : 100;
  const percentRemaining = 100 - percentUsed;

  const tokenColor =
    percentRemaining <= 0
      ? "text-red-600"
      : percentRemaining <= 20
      ? "text-amber-600"
      : "text-green-700";

  const barColor =
    percentRemaining <= 0
      ? "bg-red-500"
      : percentRemaining <= 20
      ? "bg-amber-400"
      : "bg-green-500";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-white px-5">
      <span className="text-sm font-medium text-gray-700">{companyName}</span>

      <div className="flex items-center gap-4">
        {/* Token badge */}
        <div className="hidden items-center gap-2 sm:flex">
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full transition-all ${barColor}`}
              style={{ width: `${Math.max(percentRemaining, 0)}%` }}
            />
          </div>
          <span className={`text-xs font-medium tabular-nums ${tokenColor}`}>
            {tokenBalance.toLocaleString("pt-BR")} tokens
          </span>
        </div>

        {/* Notificações */}
        <NotificationBell initialNotifications={notifications} />

        {/* User menu */}
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
            {(fullName ?? "U")[0].toUpperCase()}
          </div>
          <span className="hidden text-sm text-gray-700 sm:inline">
            {fullName ?? "Usuário"}
          </span>
          <form action={signOut}>
            <button
              type="submit"
              className="ml-1 rounded-md px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              Sair
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
