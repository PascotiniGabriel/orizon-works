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
} from "lucide-react";
import type { AgentSummary } from "@/lib/db/queries/company";

const AGENT_TYPE_ICONS: Record<string, React.ElementType> = {
  rh: Users,
  marketing: Megaphone,
  comercial: TrendingUp,
  financeiro: DollarSign,
  administrativo: FolderOpen,
};

const AGENT_TYPE_LABELS: Record<string, string> = {
  rh: "RH",
  marketing: "Marketing",
  comercial: "Comercial",
  financeiro: "Financeiro",
  administrativo: "Adm.",
};

const AGENT_COLORS: Record<string, { bg: string; text: string }> = {
  rh:            { bg: "rgba(167,139,250,0.12)", text: "#A78BFA" },
  marketing:     { bg: "rgba(251,113,133,0.12)", text: "#FB7185" },
  comercial:     { bg: "rgba(96,165,250,0.12)",  text: "#60A5FA" },
  financeiro:    { bg: "rgba(52,211,153,0.12)",  text: "#34D399" },
  administrativo:{ bg: "rgba(232,160,32,0.12)",  text: "#E8A020" },
};

interface AppSidebarProps {
  agents: AgentSummary[];
  role?: string;
}

export function AppSidebar({ agents, role }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className="flex h-full w-[220px] shrink-0 flex-col"
      style={{ background: "#09090E", borderRight: "1px solid rgba(255,255,255,0.07)" }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-5 py-[18px]"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center text-sm font-bold"
          style={{
            border: "1.5px solid #E8A020",
            borderRadius: "4px",
            color: "#E8A020",
            letterSpacing: "-0.04em",
            fontSize: "16px",
          }}
        >
          O
        </div>
        <div className="min-w-0">
          <p
            className="text-[13px] font-semibold leading-tight truncate"
            style={{ color: "#F2F0EA", letterSpacing: "-0.025em" }}
          >
            OrizonWorks
          </p>
          <p className="text-[10px] leading-tight" style={{ color: "#2D2D3A" }}>
            Central de Agentes
          </p>
        </div>
      </div>

      {/* Nav principal */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3">
        <SideNavItem
          href="/escritorio"
          icon={LayoutGrid}
          label="Início"
          active={pathname === "/escritorio"}
        />
        <SideNavItem
          href="/escritorio/historico"
          icon={History}
          label="Histórico"
          active={pathname.startsWith("/escritorio/historico")}
        />

        {agents.length > 0 && (
          <>
            <div className="mt-5 mb-2 px-3">
              <p
                className="text-[9px] font-semibold uppercase"
                style={{ color: "#2D2D3A", letterSpacing: "0.14em" }}
              >
                Agentes
              </p>
            </div>

            {agents.map((agent) => {
              const href = `/escritorio/chat/${agent.id}`;
              const isActive = pathname.startsWith(`/escritorio/chat/${agent.id}`);
              const label = agent.customName ?? AGENT_TYPE_LABELS[agent.type] ?? agent.type;
              const Icon = AGENT_TYPE_ICONS[agent.type] ?? Bot;
              const colors = AGENT_COLORS[agent.type] ?? { bg: "rgba(255,255,255,0.06)", text: "#64636E" };

              return (
                <Link
                  key={agent.id}
                  href={href}
                  className="group relative flex items-center gap-2.5 rounded-[6px] py-2 pr-3 text-[13px] transition-all duration-150 hover:bg-white/[0.04]"
                  style={{
                    paddingLeft: isActive ? "10px" : "12px",
                    borderLeft: isActive ? "2px solid #E8A020" : "2px solid transparent",
                    color: isActive ? "#F2F0EA" : "#64636E",
                    fontWeight: isActive ? 500 : 400,
                    background: isActive ? "rgba(232,160,32,0.07)" : undefined,
                  }}
                >
                  {agent.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={agent.avatarUrl}
                      alt={label}
                      className="h-[22px] w-[22px] shrink-0 rounded-[3px] object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[3px]"
                      style={{ background: colors.bg }}
                    >
                      <Icon
                        className="h-3 w-3"
                        style={{ color: colors.text }}
                        strokeWidth={2}
                      />
                    </div>
                  )}
                  <span className="flex-1 truncate group-hover:text-[#C0BFC9]">{label}</span>
                  {isActive && (
                    <div
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: "#E8A020" }}
                    />
                  )}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Footer */}
      <div
        className="space-y-0.5 px-2 py-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        {role === "super_admin" && (
          <SideNavItem
            href="/admin"
            icon={Shield}
            label="Super Admin"
            active={pathname === "/admin"}
          />
        )}
        <SideNavItem
          href="/configuracoes"
          icon={Settings}
          label="Configurações"
          active={pathname === "/configuracoes"}
        />
      </div>
    </aside>
  );
}

function SideNavItem({
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
      className="flex items-center gap-2.5 rounded-[6px] py-[7px] pr-3 text-[13px] transition-all duration-150 hover:bg-white/[0.04] hover:text-[#C0BFC9]"
      style={{
        paddingLeft: active ? "10px" : "12px",
        borderLeft: active ? "2px solid #E8A020" : "2px solid transparent",
        color: active ? "#F2F0EA" : "#64636E",
        fontWeight: active ? 500 : 400,
        background: active ? "rgba(232,160,32,0.07)" : undefined,
      }}
    >
      <Icon
        className="h-[15px] w-[15px] shrink-0"
        style={{ color: active ? "#E8A020" : undefined }}
        strokeWidth={active ? 2.5 : 1.75}
      />
      {label}
    </Link>
  );
}
