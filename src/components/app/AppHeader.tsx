"use client";

import { signOut } from "@/actions/auth";
import { NotificationBell } from "@/components/app/NotificationBell";
import { LogOut, Zap } from "lucide-react";

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
  const percentRemaining = tokenLimit > 0 ? (tokenBalance / tokenLimit) * 100 : 0;

  const tokenColor =
    percentRemaining <= 0
      ? "#EF4444"
      : percentRemaining <= 20
      ? "#E8A020"
      : "#34D399";

  const initials = (fullName ?? "U")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <header
      className="flex h-12 shrink-0 items-center justify-between px-5"
      style={{
        background: "#09090E",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Company name */}
      <span
        className="text-[13px] font-medium truncate"
        style={{ color: "#F2F0EA", letterSpacing: "-0.01em" }}
      >
        {companyName}
      </span>

      <div className="flex items-center gap-4">
        {/* Token indicator */}
        <div className="hidden items-center gap-2 sm:flex">
          <Zap className="h-3 w-3" style={{ color: tokenColor }} strokeWidth={2.5} />
          <div
            className="h-1 w-20 overflow-hidden rounded-full"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.max(percentRemaining, 0)}%`,
                background: tokenColor,
              }}
            />
          </div>
          <span
            className="text-[11px] tabular-nums"
            style={{ color: tokenColor, fontVariantNumeric: "tabular-nums" }}
          >
            {tokenBalance >= 1_000_000
              ? `${(tokenBalance / 1_000_000).toFixed(1)}M`
              : tokenBalance >= 1_000
              ? `${(tokenBalance / 1_000).toFixed(0)}k`
              : tokenBalance}
          </span>
        </div>

        {/* Notification bell */}
        <NotificationBell initialNotifications={notifications} />

        {/* User */}
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
            style={{
              background: "rgba(232,160,32,0.15)",
              color: "#E8A020",
              border: "1px solid rgba(232,160,32,0.2)",
            }}
          >
            {initials}
          </div>
          <span
            className="hidden text-[13px] sm:inline truncate max-w-[120px]"
            style={{ color: "#8A8994" }}
          >
            {fullName ?? "Usuário"}
          </span>
          <form action={signOut}>
            <button
              type="submit"
              className="flex items-center gap-1 rounded-[5px] px-2 py-1 text-[11px] transition-all duration-150 hover:bg-white/[0.06]"
              style={{ color: "#3D3D50" }}
            >
              <LogOut className="h-3 w-3" strokeWidth={2} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
