"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
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
  administrativo: "Administrativo",
};

const AGENT_TYPE_COLORS: Record<string, string> = {
  rh: "bg-violet-50 text-violet-600 border-violet-100",
  marketing: "bg-pink-50 text-pink-600 border-pink-100",
  comercial: "bg-blue-50 text-blue-600 border-blue-100",
  financeiro: "bg-emerald-50 text-emerald-600 border-emerald-100",
  administrativo: "bg-amber-50 text-amber-600 border-amber-100",
};

interface AppSidebarProps {
  agents: AgentSummary[];
  role?: string;
}

export function AppSidebar({ agents, role }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-gray-100 bg-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm"
          style={{ background: "linear-gradient(135deg, #E8A020, #f5c55a)" }}
        >
          O
        </div>
        <span className="font-bold text-gray-900 tracking-tight">OrizonWorks</span>
      </div>

      {/* Navegação principal */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-3">
        <NavItem
          href="/escritorio"
          icon={Home}
          label="Início"
          active={pathname === "/escritorio"}
        />
        <NavItem
          href="/escritorio/historico"
          icon={History}
          label="Histórico"
          active={pathname.startsWith("/escritorio/historico")}
        />

        {agents.length > 0 && (
          <>
            <div className="mt-4 mb-1.5 px-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                Agentes
              </p>
            </div>
            {agents.map((agent) => {
              const href = `/escritorio/chat/${agent.id}`;
              const isActive = pathname.startsWith(`/escritorio/chat/${agent.id}`);
              const label = agent.customName ?? AGENT_TYPE_LABELS[agent.type] ?? agent.type;
              const Icon = AGENT_TYPE_ICONS[agent.type] ?? Bot;
              const colorClass = AGENT_TYPE_COLORS[agent.type] ?? "bg-gray-50 text-gray-500 border-gray-100";

              return (
                <Link
                  key={agent.id}
                  href={href}
                  className={`group flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm transition-all duration-150 ${
                    isActive
                      ? "bg-amber-50 text-amber-800 font-medium"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  {agent.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={agent.avatarUrl}
                      alt={label}
                      className="h-6 w-6 rounded-lg border border-gray-100 object-cover"
                    />
                  ) : (
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${colorClass}`}>
                      <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                    </div>
                  )}
                  <span className="truncate">{label}</span>
                  {isActive && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-500" />
                  )}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-100 px-3 py-3 space-y-0.5">
        {role === "super_admin" && (
          <NavItem
            href="/admin"
            icon={Shield}
            label="Super Admin"
            active={pathname === "/admin"}
            muted
          />
        )}
        <NavItem
          href="/configuracoes"
          icon={Settings}
          label="Configurações"
          active={pathname === "/configuracoes"}
          muted
        />
      </div>
    </aside>
  );
}

function NavItem({
  href,
  icon: Icon,
  label,
  active,
  muted,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
  muted?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm transition-all duration-150 ${
        active
          ? "bg-amber-50 font-medium text-amber-800"
          : muted
          ? "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <div
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
          active ? "bg-amber-100 text-amber-700" : "text-gray-400"
        }`}
      >
        <Icon className="h-4 w-4" strokeWidth={active ? 2.5 : 2} />
      </div>
      <span>{label}</span>
    </Link>
  );
}
