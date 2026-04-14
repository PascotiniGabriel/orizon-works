"use client";

import Link from "next/link";
import {
  Users,
  Megaphone,
  TrendingUp,
  DollarSign,
  FolderOpen,
  Bot,
  ArrowRight,
  CheckCircle2,
  Clock,
} from "lucide-react";
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
  administrativo: "Administrativo",
};

const AGENT_TYPE_DESCRIPTIONS: Record<string, string> = {
  rh:             "Recrutamento, avaliação de currículos e entrevistas",
  marketing:      "Conteúdo, campanhas e estratégia de marca",
  comercial:      "Scripts de vendas, propostas e follow-up",
  financeiro:     "Relatórios, análises e controle financeiro",
  administrativo: "Documentos, e-mails e organização interna",
};

const AGENT_COLORS: Record<string, {
  accent: string;
  accentBg: string;
  iconBg: string;
  iconText: string;
  cardBorder: string;
  cardBorderHover: string;
}> = {
  rh: {
    accent:          "#B09EFC",
    accentBg:        "rgba(167,139,250,0.08)",
    iconBg:          "rgba(167,139,250,0.12)",
    iconText:        "#B09EFC",
    cardBorder:      "rgba(255,255,255,0.07)",
    cardBorderHover: "rgba(167,139,250,0.3)",
  },
  marketing: {
    accent:          "#FC879A",
    accentBg:        "rgba(251,113,133,0.08)",
    iconBg:          "rgba(251,113,133,0.12)",
    iconText:        "#FC879A",
    cardBorder:      "rgba(255,255,255,0.07)",
    cardBorderHover: "rgba(251,113,133,0.3)",
  },
  comercial: {
    accent:          "#74B4FB",
    accentBg:        "rgba(96,165,250,0.08)",
    iconBg:          "rgba(96,165,250,0.12)",
    iconText:        "#74B4FB",
    cardBorder:      "rgba(255,255,255,0.07)",
    cardBorderHover: "rgba(96,165,250,0.3)",
  },
  financeiro: {
    accent:          "#4EDBA4",
    accentBg:        "rgba(52,211,153,0.08)",
    iconBg:          "rgba(52,211,153,0.12)",
    iconText:        "#4EDBA4",
    cardBorder:      "rgba(255,255,255,0.07)",
    cardBorderHover: "rgba(52,211,153,0.3)",
  },
  administrativo: {
    accent:          "#E8A020",
    accentBg:        "rgba(232,160,32,0.08)",
    iconBg:          "rgba(232,160,32,0.12)",
    iconText:        "#E8A020",
    cardBorder:      "rgba(255,255,255,0.07)",
    cardBorderHover: "rgba(232,160,32,0.3)",
  },
};

const DEFAULT_COLORS = {
  accent:          "#9090A8",
  accentBg:        "rgba(255,255,255,0.05)",
  iconBg:          "rgba(255,255,255,0.08)",
  iconText:        "#9090A8",
  cardBorder:      "rgba(255,255,255,0.07)",
  cardBorderHover: "rgba(255,255,255,0.2)",
};

interface AgentCardGridProps {
  agents: AgentSummary[];
}

export function AgentCardGrid({ agents }: AgentCardGridProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "12px",
      }}
    >
      {agents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </div>
  );
}

// Keep old name as alias for backward compat
export { AgentCardGrid as AgentCommandList };

function AgentCard({ agent }: { agent: AgentSummary }) {
  const label = agent.customName ?? AGENT_TYPE_LABELS[agent.type] ?? agent.type;
  const typeLabel = AGENT_TYPE_LABELS[agent.type] ?? agent.type;
  const description = AGENT_TYPE_DESCRIPTIONS[agent.type] ?? "Agente especializado";
  const Icon = AGENT_TYPE_ICONS[agent.type] ?? Bot;
  const colors = AGENT_COLORS[agent.type] ?? DEFAULT_COLORS;

  return (
    <Link
      href={`/escritorio/chat/${agent.id}`}
      className="group relative flex flex-col overflow-hidden transition-all duration-200"
      style={{
        background: "#111118",
        border: `1px solid ${colors.cardBorder}`,
        borderRadius: "10px",
        textDecoration: "none",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = colors.cardBorderHover;
        (e.currentTarget as HTMLElement).style.boxShadow = `0 0 24px -4px ${colors.accent}20`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = colors.cardBorder;
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      {/* Top color bar */}
      <div
        style={{
          height: "3px",
          background: `linear-gradient(90deg, ${colors.accent}80, transparent)`,
        }}
      />

      <div style={{ padding: "18px 20px 20px" }}>
        {/* Icon + status row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
          {/* Icon */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: colors.iconBg,
              border: `1px solid ${colors.accent}30`,
              flexShrink: 0,
            }}
          >
            {agent.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={agent.avatarUrl}
                alt={label}
                style={{ width: "100%", height: "100%", borderRadius: "10px", objectFit: "cover" }}
              />
            ) : (
              <Icon style={{ width: "22px", height: "22px", color: colors.iconText }} strokeWidth={1.75} />
            )}
          </div>

          {/* Status badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "4px 8px",
              borderRadius: "20px",
              background: agent.briefingComplete
                ? "rgba(78,219,164,0.08)"
                : "rgba(255,255,255,0.04)",
              fontSize: "10px",
              fontWeight: 600,
              color: agent.briefingComplete ? "#4EDBA4" : "#3C3C52",
              letterSpacing: "0.04em",
            }}
          >
            {agent.briefingComplete ? (
              <CheckCircle2 style={{ width: "11px", height: "11px" }} strokeWidth={2.5} />
            ) : (
              <Clock style={{ width: "11px", height: "11px" }} strokeWidth={2} />
            )}
            {agent.briefingComplete ? "Pronto" : "Configurando"}
          </div>
        </div>

        {/* Names */}
        <div style={{ marginBottom: "10px" }}>
          <p
            style={{
              color: "#F0EDE8",
              fontSize: "17px",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.2,
              marginBottom: "3px",
            }}
          >
            {label}
          </p>
          <p
            style={{
              color: colors.accent,
              fontSize: "10px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            {typeLabel}
          </p>
        </div>

        {/* Description */}
        <p
          style={{
            color: "#4C4C64",
            fontSize: "12px",
            lineHeight: "1.55",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {description}
        </p>
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          padding: "10px 20px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(255,255,255,0.01)",
        }}
      >
        <span
          className="flex items-center gap-1.5 text-[12px] font-medium transition-all duration-150"
          style={{ color: "#3C3C52" }}
        >
          Abrir agente
          <ArrowRight
            className="transition-transform duration-200 group-hover:translate-x-1"
            style={{ width: "13px", height: "13px", color: colors.accent }}
            strokeWidth={2}
          />
        </span>
      </div>
    </Link>
  );
}
