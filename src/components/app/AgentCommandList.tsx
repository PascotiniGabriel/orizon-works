"use client";

import Link from "next/link";
import { Users, Megaphone, TrendingUp, DollarSign, FolderOpen, Bot, ChevronRight } from "lucide-react";
import type { AgentSummary } from "@/lib/db/queries/company";

const AGENT_ICONS: Record<string, React.ElementType> = {
  rh: Users, marketing: Megaphone, comercial: TrendingUp,
  financeiro: DollarSign, administrativo: FolderOpen,
};
const AGENT_LABELS: Record<string, string> = {
  rh: "RH", marketing: "Marketing", comercial: "Comercial",
  financeiro: "Financeiro", administrativo: "Administrativo",
};
const AGENT_DESCRIPTIONS: Record<string, string> = {
  rh: "Recrutamento, currículos e entrevistas",
  marketing: "Conteúdo, campanhas e estratégia",
  comercial: "Scripts de vendas e follow-up",
  financeiro: "Relatórios e controle financeiro",
  administrativo: "Documentos e organização interna",
};
const AGENT_COLOR: Record<string, { dot: string; badge: string; badgeBg: string }> = {
  rh:             { dot: "#A78BFA", badge: "#A78BFA", badgeBg: "rgba(167,139,250,0.1)" },
  marketing:      { dot: "#FB7185", badge: "#FB7185", badgeBg: "rgba(251,113,133,0.1)" },
  comercial:      { dot: "#60A5FA", badge: "#60A5FA", badgeBg: "rgba(96,165,250,0.1)"  },
  financeiro:     { dot: "#10B981", badge: "#10B981", badgeBg: "rgba(16,185,129,0.1)"  },
  administrativo: { dot: "#FBBF24", badge: "#FBBF24", badgeBg: "rgba(251,191,36,0.1)"  },
};
const DEFAULT_COLOR = { dot: "#555", badge: "#555", badgeBg: "rgba(255,255,255,0.06)" };

interface AgentListProps { agents: AgentSummary[]; }

export function AgentCardGrid({ agents }: AgentListProps) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px", overflow: "hidden" }}>
      {agents.map((agent, i) => {
        const label = agent.customName ?? AGENT_LABELS[agent.type] ?? agent.type;
        const typeLabel = AGENT_LABELS[agent.type] ?? agent.type;
        const description = AGENT_DESCRIPTIONS[agent.type] ?? "Agente especializado";
        const Icon = AGENT_ICONS[agent.type] ?? Bot;
        const clr = AGENT_COLOR[agent.type] ?? DEFAULT_COLOR;

        return (
          <Link
            key={agent.id}
            href={`/escritorio/chat/${agent.id}`}
            className="ow-row"
            style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px 20px", textDecoration: "none", borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : undefined, transition: "background 0.12s" }}
          >
            {/* Icon */}
            <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {agent.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={agent.avatarUrl} alt={label} style={{ width: "100%", height: "100%", borderRadius: "8px", objectFit: "cover" }} />
              ) : (
                <Icon style={{ width: "18px", height: "18px", color: clr.dot }} strokeWidth={1.75} />
              )}
            </div>

            {/* Name + description */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "3px" }}>
                <span style={{ color: "#EBEBEB", fontSize: "15px", fontWeight: 500, letterSpacing: "-0.01em" }}>{label}</span>
                <span style={{ background: clr.badgeBg, color: clr.badge, fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "3px", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>
                  {typeLabel}
                </span>
              </div>
              <p style={{ color: "#555", fontSize: "13px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {description}
              </p>
            </div>

            {/* Status */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "20px", background: agent.briefingComplete ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.03)", flexShrink: 0 }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: agent.briefingComplete ? "#10B981" : "#3A3A3A" }} />
              <span style={{ color: agent.briefingComplete ? "#10B981" : "#555", fontSize: "12px", fontWeight: 600 }}>
                {agent.briefingComplete ? "Pronto" : "Configurando"}
              </span>
            </div>

            <ChevronRight style={{ width: "15px", height: "15px", color: "#3A3A3A", flexShrink: 0 }} strokeWidth={2} />
          </Link>
        );
      })}
    </div>
  );
}

export { AgentCardGrid as AgentCommandList };
