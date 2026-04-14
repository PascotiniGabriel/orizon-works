"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  History,
  Users,
  Megaphone,
  TrendingUp,
  DollarSign,
  FolderOpen,
  Bot,
  Shield,
  Settings,
  LogOut,
  Zap,
} from "lucide-react";
import { signOut } from "@/actions/auth";
import { NotificationBell } from "@/components/app/NotificationBell";
import type { AgentSummary } from "@/lib/db/queries/company";

const AGENT_TYPE_ICONS: Record<string, React.ElementType> = {
  rh:             Users,
  marketing:      Megaphone,
  comercial:      TrendingUp,
  financeiro:     DollarSign,
  administrativo: FolderOpen,
};

const AGENT_TYPE_LABELS: Record<string, string> = {
  rh:             "RH",
  marketing:      "Marketing",
  comercial:      "Comercial",
  financeiro:     "Financeiro",
  administrativo: "Adm.",
};

const AGENT_COLORS: Record<string, { dot: string; bg: string; text: string; activeBg: string }> = {
  rh:            { dot: "#B09EFC", bg: "rgba(167,139,250,0.12)", text: "#B09EFC", activeBg: "rgba(167,139,250,0.08)" },
  marketing:     { dot: "#FC879A", bg: "rgba(251,113,133,0.12)", text: "#FC879A", activeBg: "rgba(251,113,133,0.08)" },
  comercial:     { dot: "#74B4FB", bg: "rgba(96,165,250,0.12)",  text: "#74B4FB", activeBg: "rgba(96,165,250,0.08)"  },
  financeiro:    { dot: "#4EDBA4", bg: "rgba(52,211,153,0.12)",  text: "#4EDBA4", activeBg: "rgba(52,211,153,0.08)"  },
  administrativo:{ dot: "#E8A020", bg: "rgba(232,160,32,0.12)",  text: "#E8A020", activeBg: "rgba(232,160,32,0.08)"  },
};

interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface AppSidebarProps {
  agents: AgentSummary[];
  role?: string;
  notifications: AppNotification[];
  fullName: string | null;
  tokenBalance: number;
  tokenLimit: number;
}

function formatTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

export function AppSidebar({
  agents,
  role,
  notifications,
  fullName,
  tokenBalance,
  tokenLimit,
}: AppSidebarProps) {
  const pathname = usePathname();

  const percentRemaining = tokenLimit > 0 ? (tokenBalance / tokenLimit) * 100 : 0;
  const tokenColor =
    percentRemaining <= 0 ? "#F87171" : percentRemaining <= 20 ? "#E8A020" : "#4EDBA4";

  const initials = (fullName ?? "U")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <aside
      className="flex h-full shrink-0 flex-col"
      style={{
        width: "256px",
        background: "#000008",
        borderRight: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Brand */}
      <div
        className="flex items-center gap-3 px-5 shrink-0"
        style={{ height: "56px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center text-[15px] font-bold"
          style={{
            border: "1.5px solid #E8A020",
            borderRadius: "6px",
            color: "#E8A020",
            letterSpacing: "-0.06em",
            background: "rgba(232,160,32,0.07)",
          }}
        >
          O
        </div>
        <div className="min-w-0">
          <p
            className="text-[14px] font-semibold leading-tight truncate"
            style={{ color: "#F0EDE8", letterSpacing: "-0.03em" }}
          >
            Orizon<span style={{ color: "#E8A020" }}>Works</span>
          </p>
          <p className="text-[10px] leading-tight mt-0.5" style={{ color: "#2C2C3A" }}>
            Central de Agentes
          </p>
        </div>
      </div>

      {/* Scrollable nav */}
      <nav className="flex flex-1 flex-col overflow-y-auto py-4 px-3 gap-5">

        {/* Agents section */}
        {agents.length > 0 && (
          <div>
            <p
              className="px-2 mb-2 text-[10px] font-semibold uppercase"
              style={{ color: "#2C2C3A", letterSpacing: "0.14em" }}
            >
              Agentes
            </p>
            <div className="space-y-0.5">
              {agents.map((agent) => {
                const href = `/escritorio/chat/${agent.id}`;
                const isActive = pathname.startsWith(`/escritorio/chat/${agent.id}`);
                const label = agent.customName ?? AGENT_TYPE_LABELS[agent.type] ?? agent.type;
                const Icon = AGENT_TYPE_ICONS[agent.type] ?? Bot;
                const colors = AGENT_COLORS[agent.type] ?? {
                  dot: "#9090A8",
                  bg: "rgba(255,255,255,0.08)",
                  text: "#9090A8",
                  activeBg: "rgba(255,255,255,0.06)",
                };

                return (
                  <Link
                    key={agent.id}
                    href={href}
                    className="group flex items-center gap-2.5 rounded-[7px] px-2.5 py-2 transition-all duration-150"
                    style={{
                      background: isActive ? colors.activeBg : "transparent",
                    }}
                  >
                    {/* Hover overlay */}
                    <span
                      className="pointer-events-none absolute inset-0 rounded-[7px] opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                      style={{ background: "rgba(255,255,255,0.03)" }}
                    />

                    {/* Icon box */}
                    <div
                      className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-[5px]"
                      style={{ background: isActive ? colors.bg : "rgba(255,255,255,0.05)" }}
                    >
                      {agent.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={agent.avatarUrl}
                          alt={label}
                          className="h-full w-full rounded-[5px] object-cover"
                        />
                      ) : (
                        <Icon
                          className="h-3.5 w-3.5"
                          style={{ color: isActive ? colors.text : "#4C4C64" }}
                          strokeWidth={2}
                        />
                      )}
                    </div>

                    {/* Name */}
                    <span
                      className="relative z-10 flex-1 truncate text-[13px]"
                      style={{
                        color: isActive ? "#F0EDE8" : "#7070888",
                        fontWeight: isActive ? 500 : 400,
                      }}
                    >
                      {label}
                    </span>

                    {/* Status dot */}
                    <div
                      className="relative z-10 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{
                        background: agent.briefingComplete ? colors.dot : "rgba(255,255,255,0.12)",
                        boxShadow: agent.briefingComplete ? `0 0 4px ${colors.dot}80` : "none",
                      }}
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Workspace section */}
        <div>
          <p
            className="px-2 mb-2 text-[10px] font-semibold uppercase"
            style={{ color: "#2C2C3A", letterSpacing: "0.14em" }}
          >
            Workspace
          </p>
          <div className="space-y-0.5">
            <NavItem
              href="/escritorio"
              icon={LayoutGrid}
              label="Escritório"
              active={pathname === "/escritorio"}
            />
            <NavItem
              href="/escritorio/historico"
              icon={History}
              label="Histórico"
              active={pathname.startsWith("/escritorio/historico")}
            />
            {role === "super_admin" && (
              <NavItem
                href="/admin"
                icon={Shield}
                label="Super Admin"
                active={pathname === "/admin"}
              />
            )}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div
        className="shrink-0 px-3 pb-3 pt-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* Token meter */}
        <div className="px-2 mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Zap
                className="h-3 w-3"
                style={{ color: tokenColor }}
                strokeWidth={2.5}
                fill={tokenColor}
              />
              <span
                className="text-[10px] font-semibold uppercase"
                style={{ color: "#2C2C3A", letterSpacing: "0.12em" }}
              >
                Tokens
              </span>
            </div>
            <span
              className="text-[11px] tabular-nums"
              style={{ color: tokenColor, fontFamily: "var(--font-geist-mono)" }}
            >
              {formatTokens(tokenBalance)}
            </span>
          </div>
          <div
            className="h-[2px] w-full overflow-hidden rounded-full"
            style={{ background: "rgba(255,255,255,0.07)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.max(percentRemaining, 0)}%`,
                background: tokenColor,
                boxShadow: `0 0 4px ${tokenColor}60`,
              }}
            />
          </div>
        </div>

        {/* Settings + Notifications row */}
        <div className="flex items-center gap-0.5 mb-2">
          <NavItem
            href="/configuracoes"
            icon={Settings}
            label="Configurações"
            active={pathname === "/configuracoes"}
          />
          <div className="ml-auto flex items-center">
            <NotificationBell initialNotifications={notifications} />
          </div>
        </div>

        {/* User row */}
        <div
          className="flex items-center gap-2.5 rounded-[7px] px-2.5 py-2"
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
            style={{
              background: "rgba(232,160,32,0.12)",
              color: "#E8A020",
              border: "1px solid rgba(232,160,32,0.2)",
            }}
          >
            {initials}
          </div>
          <span
            className="flex-1 min-w-0 truncate text-[13px]"
            style={{ color: "#6B6B84" }}
          >
            {fullName ?? "Usuário"}
          </span>
          <form action={signOut}>
            <button
              type="submit"
              className="flex items-center justify-center rounded-[5px] p-1.5 transition-all duration-150 hover:bg-white/[0.05]"
              style={{ color: "#3C3C52" }}
              title="Sair"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}

function NavItem({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className="group relative flex items-center gap-2.5 rounded-[7px] px-2.5 py-2 transition-all duration-150 text-[13px]"
      style={{
        background: active ? "rgba(232,160,32,0.07)" : "transparent",
        color: active ? "#F0EDE8" : "#6B6B84",
        fontWeight: active ? 500 : 400,
      }}
    >
      <span
        className="pointer-events-none absolute inset-0 rounded-[7px] opacity-0 transition-opacity duration-150 group-hover:opacity-100"
        style={{ background: "rgba(255,255,255,0.03)" }}
      />
      <Icon
        className="relative z-10 h-4 w-4 shrink-0"
        style={{ color: active ? "#E8A020" : "#3C3C52" }}
        strokeWidth={active ? 2.5 : 1.75}
      />
      <span className="relative z-10 flex-1 truncate group-hover:text-[#C0BDB5]">
        {label}
      </span>
    </Link>
  );
}
