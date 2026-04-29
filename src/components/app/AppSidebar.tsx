"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid, History, Users, Megaphone, TrendingUp, DollarSign,
  FolderOpen, Bot, Shield, Settings, LogOut, Zap, FileText,
} from "lucide-react";
import { signOut } from "@/actions/auth";
import { NotificationBell } from "@/components/app/NotificationBell";
import type { AgentSummary } from "@/lib/db/queries/company";

const AGENT_ICONS: Record<string, React.ElementType> = {
  rh: Users, marketing: Megaphone, comercial: TrendingUp,
  financeiro: DollarSign, administrativo: FolderOpen,
};
const AGENT_LABELS: Record<string, string> = {
  rh: "RH", marketing: "Marketing", comercial: "Comercial",
  financeiro: "Financeiro", administrativo: "Administrativo",
};
const AGENT_DOT: Record<string, string> = {
  rh: "#A78BFA", marketing: "#FB7185", comercial: "#60A5FA",
  financeiro: "#10B981", administrativo: "#FBBF24",
};

interface AppNotification {
  id: string; type: string; title: string;
  message: string; isRead: boolean; createdAt: string;
}
interface AppSidebarProps {
  agents: AgentSummary[]; role?: string;
  notifications: AppNotification[]; fullName: string | null;
  tokenBalance: number; tokenLimit: number;
}

function formatTokens(n: number) {
  if (n >= 1_000_000) {
    // floor to 2 decimal places to avoid misleading rounding (e.g. 3,498,905 → "3.49M" not "3.5M")
    const val = Math.floor(n / 10_000) / 100;
    return `${val}M`;
  }
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

export function AppSidebar({ agents, role, notifications, fullName, tokenBalance, tokenLimit }: AppSidebarProps) {
  const pathname = usePathname();
  const pct = tokenLimit > 0 ? Math.min((tokenBalance / tokenLimit) * 100, 100) : 0;
  const barColor = pct <= 0 ? "#EF4444" : pct <= 20 ? "#FBBF24" : "#10B981";
  const initials = (fullName ?? "U").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  return (
    <aside className="flex h-full shrink-0 flex-col" style={{ width: "224px", background: "#0A0A0A", borderRight: "1px solid rgba(255,255,255,0.07)" }}>

      {/* Brand */}
      <div style={{ height: "52px", display: "flex", alignItems: "center", padding: "0 16px", gap: "10px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        <div style={{ width: "24px", height: "24px", background: "#10B981", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ color: "#000", fontSize: "12px", fontWeight: 800 }}>O</span>
        </div>
        <span style={{ color: "#EBEBEB", fontSize: "15px", fontWeight: 600, letterSpacing: "-0.025em" }}>
          Orizon Works
        </span>
      </div>

      {/* User account row */}
      <div style={{ padding: "8px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "9px", padding: "8px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.03)" }}>
          <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#10B981", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "#000", flexShrink: 0 }}>
            {initials}
          </div>
          <span style={{ color: "#888", fontSize: "13px", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {fullName ?? "Usuário"}
          </span>
          <form action={signOut}>
            <button type="submit" title="Sair" style={{ background: "none", border: "none", cursor: "pointer", color: "#3A3A3A", padding: "2px", display: "flex", alignItems: "center", borderRadius: "3px", transition: "color 0.15s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#888"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#3A3A3A"; }}>
              <LogOut style={{ width: "14px", height: "14px" }} strokeWidth={1.75} />
            </button>
          </form>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "8px", display: "flex", flexDirection: "column", gap: "2px" }}>

        {agents.length > 0 && (
          <>
            <SectionLabel>Agentes</SectionLabel>
            {agents.map((agent) => {
              const href = `/escritorio/chat/${agent.id}`;
              const active = pathname.startsWith(`/escritorio/chat/${agent.id}`);
              const label = agent.customName ?? AGENT_LABELS[agent.type] ?? agent.type;
              const Icon = AGENT_ICONS[agent.type] ?? Bot;
              const dot = AGENT_DOT[agent.type] ?? "#666";
              return (
                <NavItem key={agent.id} href={href} active={active} icon={Icon} label={label}
                  dot={agent.briefingComplete ? dot : undefined} dotDim={!agent.briefingComplete} />
              );
            })}
          </>
        )}

        <SectionLabel top>Plataforma</SectionLabel>
        <NavItem href="/escritorio" active={pathname === "/escritorio"} icon={LayoutGrid} label="Escritório" />
        <NavItem href="/escritorio/historico" active={pathname.startsWith("/escritorio/historico")} icon={History} label="Histórico" />

        <SectionLabel top>Gerenciar</SectionLabel>
        <NavItem href="/configuracoes" active={pathname === "/configuracoes"} icon={Settings} label="Configurações" />
        <NavItem href="/configuracoes/briefing" active={pathname === "/configuracoes/briefing"} icon={FileText} label="Briefings" />
        {role === "super_admin" && (
          <NavItem href="/admin" active={pathname === "/admin"} icon={Shield} label="Super Admin" badge="Admin" />
        )}
      </nav>

      {/* Footer */}
      <div style={{ flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.06)", padding: "10px 8px" }}>
        {/* Token meter */}
        <div style={{ padding: "4px 10px 10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "7px" }}>
            <span style={{ color: "#3A3A3A", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>Tokens</span>
            <span style={{ color: barColor, fontSize: "13px", fontFamily: "var(--font-geist-mono)" }}>{formatTokens(tokenBalance)}</span>
          </div>
          <div style={{ height: "2px", background: "rgba(255,255,255,0.07)", borderRadius: "1px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: "1px", transition: "width 0.6s ease" }} />
          </div>
        </div>

        {/* Buy button */}
        <Link
          href="/configuracoes"
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", height: "36px", background: "#10B981", color: "#000", fontWeight: 700, fontSize: "13px", borderRadius: "6px", border: "none", cursor: "pointer", fontFamily: "inherit", marginBottom: "9px", textDecoration: "none", transition: "opacity 0.15s" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.88"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
        >
          <Zap style={{ width: "13px", height: "13px" }} fill="currentColor" />
          Comprar tokens
        </Link>

        {/* Notifications + remaining */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
          <NotificationBell initialNotifications={notifications} />
          <span style={{ color: "#666", fontSize: "11px" }}>{pct.toFixed(0)}% restante</span>
        </div>
      </div>
    </aside>
  );
}

function SectionLabel({ children, top }: { children: React.ReactNode; top?: boolean }) {
  return (
    <div style={{ padding: top ? "16px 10px 5px" : "5px 10px", color: "#3A3A3A", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
      {children}
    </div>
  );
}

function NavItem({ href, icon: Icon, label, active, badge, dot, dotDim }: {
  href: string; icon: React.ElementType; label: string; active: boolean;
  badge?: string; dot?: string; dotDim?: boolean;
}) {
  return (
    <Link href={href} className="ow-nav" style={{ display: "flex", alignItems: "center", gap: "9px", padding: "7px 10px", borderRadius: "6px", background: active ? "rgba(255,255,255,0.06)" : "transparent", textDecoration: "none", transition: "background 0.12s" }}>
      <Icon className="ow-nav-icon" style={{ width: "15px", height: "15px", color: active ? "#10B981" : "#3A3A3A", flexShrink: 0, transition: "color 0.12s" }} strokeWidth={active ? 2.25 : 1.75} />
      <span className="ow-nav-text" style={{ flex: 1, fontSize: "14px", fontWeight: active ? 500 : 400, color: active ? "#EBEBEB" : "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", transition: "color 0.12s" }}>
        {label}
      </span>
      {badge && (
        <span style={{ background: "rgba(16,185,129,0.1)", color: "#10B981", fontSize: "10px", fontWeight: 700, padding: "1px 6px", borderRadius: "3px", textTransform: "uppercase", letterSpacing: "0.04em", flexShrink: 0 }}>
          {badge}
        </span>
      )}
      {dot && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: dotDim ? "rgba(255,255,255,0.12)" : dot, flexShrink: 0 }} />}
    </Link>
  );
}
