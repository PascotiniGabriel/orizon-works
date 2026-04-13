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

const AGENT_TYPE_DESCRIPTIONS: Record<string, string> = {
  rh: "Recrutamento, avaliação de currículos e entrevistas",
  marketing: "Conteúdo, campanhas e estratégia de marca",
  comercial: "Scripts de vendas, propostas e follow-up",
  financeiro: "Relatórios, análises e controle financeiro",
  administrativo: "Documentos, e-mails e organização interna",
};

const AGENT_COLORS: Record<string, { bg: string; text: string; badge: string }> = {
  rh:            { bg: "rgba(167,139,250,0.12)", text: "#A78BFA", badge: "rgba(167,139,250,0.15)" },
  marketing:     { bg: "rgba(251,113,133,0.12)", text: "#FB7185", badge: "rgba(251,113,133,0.15)" },
  comercial:     { bg: "rgba(96,165,250,0.12)",  text: "#60A5FA", badge: "rgba(96,165,250,0.15)"  },
  financeiro:    { bg: "rgba(52,211,153,0.12)",  text: "#34D399", badge: "rgba(52,211,153,0.15)"  },
  administrativo:{ bg: "rgba(232,160,32,0.12)",  text: "#E8A020", badge: "rgba(232,160,32,0.15)"  },
};

interface AgentCommandListProps {
  agents: AgentSummary[];
}

export function AgentCommandList({ agents }: AgentCommandListProps) {
  return (
    <div
      className="overflow-hidden rounded-xl"
      style={{ border: "1px solid rgba(255,255,255,0.07)" }}
    >
      {agents.map((agent, index) => {
        const label = agent.customName ?? AGENT_TYPE_LABELS[agent.type] ?? agent.type;
        const description = AGENT_TYPE_DESCRIPTIONS[agent.type] ?? "Agente especializado";
        const Icon = AGENT_TYPE_ICONS[agent.type] ?? Bot;
        const colors = AGENT_COLORS[agent.type] ?? {
          bg: "rgba(255,255,255,0.06)",
          text: "#64636E",
          badge: "rgba(255,255,255,0.1)",
        };

        return (
          <AgentRow
            key={agent.id}
            agent={agent}
            label={label}
            description={description}
            Icon={Icon}
            colors={colors}
            isFirst={index === 0}
          />
        );
      })}
    </div>
  );
}

function AgentRow({
  agent,
  label,
  description,
  Icon,
  colors,
  isFirst,
}: {
  agent: AgentSummary;
  label: string;
  description: string;
  Icon: React.ElementType;
  colors: { bg: string; text: string; badge: string };
  isFirst: boolean;
}) {
  return (
    <Link
      href={`/escritorio/chat/${agent.id}`}
      className="group relative flex items-center gap-5 px-5 py-4 transition-all duration-150 cursor-pointer"
      style={{
        borderTop: !isFirst ? "1px solid rgba(255,255,255,0.05)" : undefined,
      }}
    >
      {/* Hover indicator via box-shadow (no layout shift) */}
      <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100" style={{ boxShadow: "inset 3px 0 0 0 rgba(232,160,32,0.6)", background: "rgba(232,160,32,0.035)" }} />

      {/* Status dot */}
      <div
        className="relative z-10 h-2 w-2 shrink-0 rounded-full"
        style={{
          background: agent.briefingComplete ? "#34D399" : "#2D2D3A",
          boxShadow: agent.briefingComplete ? "0 0 6px rgba(52,211,153,0.5)" : "none",
        }}
      />

      {/* Icon */}
      <div className="relative z-10 shrink-0">
        {agent.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={agent.avatarUrl}
            alt={label}
            className="h-10 w-10 rounded-[6px] object-cover"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}
          />
        ) : (
          <div
            className="flex h-10 w-10 items-center justify-center rounded-[6px]"
            style={{ background: colors.bg, border: "1px solid rgba(255,255,255,0.05)" }}
          >
            <Icon className="h-5 w-5" style={{ color: colors.text }} strokeWidth={1.75} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 min-w-0">
        <div className="flex items-center gap-2.5 mb-0.5">
          <p
            className="text-[14px] font-medium truncate"
            style={{ color: "#F2F0EA", letterSpacing: "-0.01em" }}
          >
            {label}
          </p>
          <span
            className="shrink-0 rounded-[3px] px-1.5 py-[1px] text-[9px] font-bold uppercase"
            style={{
              background: colors.badge,
              color: colors.text,
              letterSpacing: "0.1em",
            }}
          >
            {AGENT_TYPE_LABELS[agent.type] ?? agent.type}
          </span>
        </div>
        <p className="text-[12px] truncate" style={{ color: "#64636E" }}>
          {description}
        </p>
      </div>

      {/* Status */}
      <div
        className="relative z-10 hidden sm:flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
        style={
          agent.briefingComplete
            ? { background: "rgba(52,211,153,0.08)", color: "#34D399" }
            : { background: "rgba(255,255,255,0.04)", color: "#3D3D50" }
        }
      >
        {agent.briefingComplete ? (
          <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />
        ) : (
          <Clock className="h-3 w-3" strokeWidth={2} />
        )}
        {agent.briefingComplete ? "Pronto" : "Configurando"}
      </div>

      {/* Arrow */}
      <ArrowRight
        className="relative z-10 h-4 w-4 shrink-0 -translate-x-1 opacity-0 transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100"
        style={{ color: "#E8A020" }}
        strokeWidth={2}
      />
    </Link>
  );
}
