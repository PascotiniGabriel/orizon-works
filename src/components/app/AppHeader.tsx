"use client";

import { signOut } from "@/actions/auth";
import { NotificationBell } from "@/components/app/NotificationBell";
import { LogOut, Zap, ChevronRight } from "lucide-react";

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
      ? "#F87171"
      : percentRemaining <= 20
      ? "#E8A020"
      : "#4EDBA4";

  const initials = (fullName ?? "U")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  function formatTokens(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
    return String(n);
  }

  return (
    <header
      className="flex shrink-0 items-center justify-between px-6"
      style={{
        height: "56px",
        background: "#08080D",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Breadcrumb / company */}
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="text-[13px] font-medium truncate"
          style={{ color: "#EEECE6", letterSpacing: "-0.01em" }}
        >
          {companyName}
        </span>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" style={{ color: "#3E3E52" }} strokeWidth={2} />
      </div>

      <div className="flex items-center gap-5">
        {/* Token meter */}
        <div className="hidden items-center gap-2.5 sm:flex">
          <Zap
            className="h-3.5 w-3.5 shrink-0"
            style={{ color: tokenColor }}
            strokeWidth={2.5}
            fill={tokenColor}
          />
          <div className="flex flex-col gap-1">
            <div
              className="h-[3px] w-28 overflow-hidden rounded-full"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.max(percentRemaining, 0)}%`,
                  background: tokenColor,
                  boxShadow: `0 0 6px ${tokenColor}60`,
                }}
              />
            </div>
          </div>
          <span
            className="text-[12px] font-medium tabular-nums"
            style={{ color: tokenColor, fontVariantNumeric: "tabular-nums" }}
          >
            {formatTokens(tokenBalance)}
          </span>
        </div>

        {/* Divider */}
        <div
          className="hidden h-5 w-px sm:block"
          style={{ background: "rgba(255,255,255,0.08)" }}
        />

        {/* Notifications */}
        <NotificationBell initialNotifications={notifications} />

        {/* Divider */}
        <div
          className="h-5 w-px"
          style={{ background: "rgba(255,255,255,0.08)" }}
        />

        {/* User */}
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
            style={{
              background: "rgba(232,160,32,0.12)",
              color: "#E8A020",
              border: "1.5px solid rgba(232,160,32,0.25)",
            }}
          >
            {initials}
          </div>
          <span
            className="hidden text-[13px] sm:inline truncate max-w-[120px]"
            style={{ color: "#8888A0" }}
          >
            {fullName ?? "Usuário"}
          </span>
          <form action={signOut}>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-[5px] px-2.5 py-1.5 text-[12px] transition-all duration-150 hover:bg-white/[0.05]"
              style={{ color: "#5A5A72" }}
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
