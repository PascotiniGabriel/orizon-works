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
  rh:            { bg: "rgba(167,139,250,0.15)", text: "#B09EFC" },
  marketing:     { bg: "rgba(251,113,133,0.15)", text: "#FC879A" },
  comercial:     { bg: "rgba(96,165,250,0.15)",  text: "#74B4FB" },
  financeiro:    { bg: "rgba(52,211,153,0.15)",  text: "#4EDBA4" },
  administrativo:{ bg: "rgba(232,160,32,0.15)",  text: "#E8A020" },
};

const AGENT_STATUS_COLORS: Record<string, string> = {
  rh:            "#B09EFC",
  marketing:     "#FC879A",
  comercial:     "#74B4FB",
  financeiro:    "#4EDBA4",
  administrativo:"#E8A020",
};

interface AppSidebarProps {
  agents: AgentSummary[];
  role?: string;
}

export function AppSidebar({ agents, role }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className="flex h-full w-[248px] shrink-0 flex-col"
      style={{
        background: "#08080D",
        borderRight: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Logo / Brand */}
      <div
        className="flex items-center gap-3 px-5"
        style={{
          height: "56px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center text-[17px] font-bold"
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
            style={{ color: "#EEECE6", letterSpacing: "-0.03em" }}
          >
            OrizonWorks
          </p>
          <p
            className="text-[11px] leading-tight mt-0.5"
            style={{ color: "#3E3E52" }}
          >
            Central de Agentes
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col overflow-y-auto px-3 py-4">
        {/* Seção principal */}
        <SectionLabel>Navegação</SectionLabel>

        <div className="mt-1.5 space-y-0.5">
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
        </div>

        {/* Agentes */}
        {agents.length > 0 && (
          <div className="mt-6">
            <SectionLabel>Agentes</SectionLabel>
            <div className="mt-1.5 space-y-0.5">
              {agents.map((agent) => {
                const href = `/escritorio/chat/${agent.id}`;
                const isActive = pathname.startsWith(`/escritorio/chat/${agent.id}`);
                const label = agent.customName ?? AGENT_TYPE_LABELS[agent.type] ?? agent.type;
                const Icon = AGENT_TYPE_ICONS[agent.type] ?? Bot;
                const colors = AGENT_COLORS[agent.type] ?? { bg: "rgba(255,255,255,0.08)", text: "#9999AA" };
                const statusColor = AGENT_STATUS_COLORS[agent.type] ?? "#9999AA";

                return (
                  <Link
                    key={agent.id}
                    href={href}
                    className="group relative flex items-center gap-3 rounded-[6px] px-3 py-2.5 text-[13px] transition-all duration-150"
                    style={{
                      borderLeft: isActive ? "2px solid #E8A020" : "2px solid transparent",
                      paddingLeft: isActive ? "10px" : "12px",
                      color: isActive ? "#EEECE6" : "#8888A0",
                      fontWeight: isActive ? 500 : 400,
                      background: isActive ? "rgba(232,160,32,0.08)" : undefined,
                    }}
                  >
                    {/* Hover overlay */}
                    <span
                      className="pointer-events-none absolute inset-0 rounded-[6px] opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                      style={{ background: "rgba(255,255,255,0.03)" }}
                    />

                    {/* Icon */}
                    {agent.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={agent.avatarUrl}
                        alt={label}
                        className="relative z-10 h-[24px] w-[24px] shrink-0 rounded-[4px] object-cover"
                      />
                    ) : (
                      <div
                        className="relative z-10 flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-[4px]"
                        style={{ background: colors.bg }}
                      >
                        <Icon
                          className="h-3.5 w-3.5"
                          style={{ color: colors.text }}
                          strokeWidth={2}
                        />
                      </div>
                    )}

                    <span className="relative z-10 flex-1 truncate group-hover:text-[#C8C6C0]">
                      {label}
                    </span>

                    {/* Status dot */}
                    <div
                      className="relative z-10 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{
                        background: agent.briefingComplete ? statusColor : "rgba(255,255,255,0.15)",
                        boxShadow: agent.briefingComplete ? `0 0 5px ${statusColor}80` : "none",
                      }}
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div
        className="px-3 py-3 space-y-0.5"
        style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-1">
      <div
        className="h-px flex-1"
        style={{ background: "rgba(255,255,255,0.07)" }}
      />
      <span
        className="text-[10px] font-semibold uppercase"
        style={{ color: "#3E3E52", letterSpacing: "0.12em" }}
      >
        {children}
      </span>
      <div
        className="h-px flex-1"
        style={{ background: "rgba(255,255,255,0.07)" }}
      />
    </div>
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
      className="group relative flex items-center gap-3 rounded-[6px] px-3 py-2.5 text-[13px] transition-all duration-150"
      style={{
        borderLeft: active ? "2px solid #E8A020" : "2px solid transparent",
        paddingLeft: active ? "10px" : "12px",
        color: active ? "#EEECE6" : "#8888A0",
        fontWeight: active ? 500 : 400,
        background: active ? "rgba(232,160,32,0.08)" : undefined,
      }}
    >
      <span
        className="pointer-events-none absolute inset-0 rounded-[6px] opacity-0 transition-opacity duration-150 group-hover:opacity-100"
        style={{ background: "rgba(255,255,255,0.03)" }}
      />
      <Icon
        className="relative z-10 h-[16px] w-[16px] shrink-0"
        style={{ color: active ? "#E8A020" : "#5A5A72" }}
        strokeWidth={active ? 2.5 : 1.75}
      />
      <span className="relative z-10 flex-1 group-hover:text-[#C8C6C0]">{label}</span>
    </Link>
  );
}
