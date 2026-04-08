"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AgentSummary } from "@/lib/db/queries/company";

const AGENT_TYPE_ICONS: Record<string, string> = {
  rh: "👥",
  marketing: "📣",
  comercial: "💼",
  financeiro: "📊",
  administrativo: "🗂️",
};

const AGENT_TYPE_LABELS: Record<string, string> = {
  rh: "RH",
  marketing: "Marketing",
  comercial: "Comercial",
  financeiro: "Financeiro",
  administrativo: "Administrativo",
};

interface AppSidebarProps {
  agents: AgentSummary[];
  role?: string;
}

export function AppSidebar({ agents, role }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r bg-white">
      {/* Logo */}
      <div className="flex items-center gap-2.5 border-b px-4 py-4">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold text-white"
          style={{ backgroundColor: "#E8A020" }}
        >
          O
        </div>
        <span className="font-bold text-gray-900">OrizonWorks</span>
      </div>

      {/* Navegação */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        <Link
          href="/escritorio"
          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
            pathname === "/escritorio"
              ? "bg-amber-50 font-medium text-amber-700"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <span className="text-base">🏠</span>
          Início
        </Link>

        <Link
          href="/escritorio/historico"
          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
            pathname.startsWith("/escritorio/historico")
              ? "bg-amber-50 font-medium text-amber-700"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <span className="text-base">🕐</span>
          Histórico
        </Link>

        {agents.length > 0 && (
          <>
            <div className="mt-3 mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Agentes
            </div>
            {agents.map((agent) => {
              const href = `/escritorio/chat/${agent.id}`;
              const isActive = pathname === href;
              const label = agent.customName ?? AGENT_TYPE_LABELS[agent.type] ?? agent.type;
              const icon = AGENT_TYPE_ICONS[agent.type] ?? "🤖";

              return (
                <Link
                  key={agent.id}
                  href={href}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-amber-50 font-medium text-amber-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  {agent.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={agent.avatarUrl}
                      alt={label}
                      className="h-5 w-5 rounded"
                    />
                  ) : (
                    <span className="text-base">{icon}</span>
                  )}
                  <span className="truncate">{label}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t p-3 space-y-0.5">
        {role === "super_admin" && (
          <Link
            href="/admin"
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
              pathname === "/admin"
                ? "bg-amber-50 font-medium text-amber-700"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            }`}
          >
            <span className="text-base">🛡️</span>
            Super Admin
          </Link>
        )}
        <Link
          href="/configuracoes"
          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
            pathname === "/configuracoes"
              ? "bg-amber-50 font-medium text-amber-700"
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
          }`}
        >
          <span className="text-base">⚙️</span>
          Configurações
        </Link>
      </div>
    </aside>
  );
}
