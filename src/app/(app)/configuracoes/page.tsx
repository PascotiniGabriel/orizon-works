import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserCompanyInfo } from "@/lib/db/queries/company";
import { getCompanyStats, getCompanyUsers } from "@/lib/db/queries/admin";
import { InviteUserModal } from "@/components/app/InviteUserModal";
import { TokenPackButton } from "@/components/app/TokenPackButton";
import {
  Users,
  Megaphone,
  TrendingUp,
  DollarSign,
  FolderOpen,
  Bot,
  CheckCircle2,
  XCircle,
  Zap,
} from "lucide-react";

const PLAN_LABELS: Record<string, string> = {
  trial: "Trial",
  starter: "Starter",
  growth: "Growth",
  business: "Business",
  enterprise: "Enterprise",
};

const ROLE_LABELS: Record<string, string> = {
  company_admin: "Admin",
  sector_manager: "Resp. de Setor",
  employee: "Funcionário",
  super_admin: "Super Admin",
};

const ROLE_BADGE: Record<string, { bg: string; color: string; border: string }> = {
  company_admin: { bg: "rgba(167,139,250,0.12)", color: "#B09EFC", border: "rgba(167,139,250,0.25)" },
  sector_manager:{ bg: "rgba(96,165,250,0.12)",  color: "#74B4FB", border: "rgba(96,165,250,0.25)"  },
  employee:      { bg: "rgba(255,255,255,0.06)", color: "#8888A0", border: "rgba(255,255,255,0.1)"  },
  super_admin:   { bg: "rgba(239,68,68,0.12)",   color: "#F87171", border: "rgba(239,68,68,0.25)"   },
};

const AGENT_ICONS: Record<string, React.ElementType> = {
  rh: Users,
  marketing: Megaphone,
  comercial: TrendingUp,
  financeiro: DollarSign,
  administrativo: FolderOpen,
};

const AGENT_LABELS: Record<string, string> = {
  rh: "RH",
  marketing: "Marketing",
  comercial: "Comercial",
  financeiro: "Financeiro",
  administrativo: "Administrativo",
};

const AGENT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  rh:            { bg: "rgba(167,139,250,0.12)", text: "#B09EFC", border: "rgba(167,139,250,0.2)" },
  marketing:     { bg: "rgba(251,113,133,0.12)", text: "#FC879A", border: "rgba(251,113,133,0.2)" },
  comercial:     { bg: "rgba(96,165,250,0.12)",  text: "#74B4FB", border: "rgba(96,165,250,0.2)"  },
  financeiro:    { bg: "rgba(52,211,153,0.12)",  text: "#4EDBA4", border: "rgba(52,211,153,0.2)"  },
  administrativo:{ bg: "rgba(232,160,32,0.12)",  text: "#E8A020", border: "rgba(232,160,32,0.2)"  },
};

function formatNumber(n: number) {
  return n.toLocaleString("pt-BR");
}

function formatDate(date: Date | null) {
  if (!date) return "Nunca";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

const CARD_STYLE = {
  background: "#111118",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "10px",
} as const;

const DIVIDER = { borderTop: "1px solid rgba(255,255,255,0.06)" } as const;

interface ConfiguracoesPageProps {
  searchParams: Promise<{ token_pack?: string }>;
}

export default async function ConfiguracoesPage({ searchParams }: ConfiguracoesPageProps) {
  const { token_pack } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const info = await getUserCompanyInfo(user.id);
  if (!info) redirect("/login");

  const isAdmin = info.role === "company_admin" || info.role === "super_admin";

  const [stats, companyUsers] = isAdmin
    ? await Promise.all([
        getCompanyStats(info.companyId),
        getCompanyUsers(info.companyId),
      ])
    : [null, []];

  const tokensUsed = info.tokenLimit - info.tokenBalance;
  const tokenPercent = info.tokenLimit > 0
    ? Math.round((tokensUsed / info.tokenLimit) * 100)
    : 0;
  const percentRemaining = 100 - tokenPercent;

  const barColor =
    tokenPercent > 80 ? "#F87171" : tokenPercent > 60 ? "#E8A020" : "#4EDBA4";

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Page header */}
      <div className="pt-2">
        <p
          className="text-[11px] font-semibold uppercase mb-3"
          style={{ color: "#3E3E52", letterSpacing: "0.16em" }}
        >
          Painel
        </p>
        <h1
          className="font-bold leading-none"
          style={{ color: "#EEECE6", fontSize: "40px", letterSpacing: "-0.04em" }}
        >
          Configurações
        </h1>
        <p className="mt-2 text-[14px]" style={{ color: "#5A5A72" }}>
          {info.companyName}
        </p>
      </div>

      {/* === Token consumption === */}
      <section style={CARD_STYLE} className="overflow-hidden">
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div>
            <h2
              className="text-[15px] font-semibold"
              style={{ color: "#EEECE6", letterSpacing: "-0.01em" }}
            >
              Consumo de Tokens
            </h2>
            <p className="text-[12px] mt-0.5" style={{ color: "#4A4A60" }}>
              Período atual
            </p>
          </div>
          <Zap className="h-4 w-4" style={{ color: barColor }} strokeWidth={2.5} fill={barColor} />
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-medium" style={{ color: "#EEECE6" }}>
                {formatNumber(tokensUsed)} usados
              </span>
              <span className="text-[12px]" style={{ color: "#4A4A60" }}>
                limite: {formatNumber(info.tokenLimit)}
              </span>
            </div>
            <div
              className="h-2 w-full overflow-hidden rounded-full"
              style={{ background: "rgba(255,255,255,0.07)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(tokenPercent, 100)}%`,
                  background: barColor,
                  boxShadow: `0 0 8px ${barColor}50`,
                }}
              />
            </div>
            <p className="mt-2 text-[12px]" style={{ color: "#4A4A60" }}>
              {formatNumber(info.tokenBalance)} tokens disponíveis ({percentRemaining}% restante)
            </p>
          </div>

          {/* Checkout feedback */}
          {token_pack === "success" && (
            <div
              className="flex items-center gap-3 rounded-[8px] px-4 py-3"
              style={{
                background: "rgba(78,219,164,0.08)",
                border: "1px solid rgba(78,219,164,0.2)",
              }}
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "#4EDBA4" }} strokeWidth={2} />
              <div>
                <p className="text-[13px] font-semibold" style={{ color: "#4EDBA4" }}>
                  Token Pack adquirido com sucesso!
                </p>
                <p className="text-[12px] mt-0.5" style={{ color: "#3A8A6A" }}>
                  2.000.000 tokens foram adicionados ao seu saldo.
                </p>
              </div>
            </div>
          )}
          {token_pack === "canceled" && (
            <div
              className="flex items-center gap-3 rounded-[8px] px-4 py-3"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <XCircle className="h-4 w-4 shrink-0" style={{ color: "#5A5A72" }} strokeWidth={2} />
              <p className="text-[13px]" style={{ color: "#5A5A72" }}>
                Compra cancelada. Nenhum valor foi cobrado.
              </p>
            </div>
          )}

          {/* Token pack offer */}
          <div
            className="flex items-center justify-between rounded-[8px] px-4 py-3"
            style={{
              background: "rgba(232,160,32,0.07)",
              border: "1px solid rgba(232,160,32,0.18)",
            }}
          >
            <div>
              <p className="text-[13px] font-semibold" style={{ color: "#E8A020" }}>
                {info.tokenBalance < info.tokenLimit * 0.2
                  ? "Saldo abaixo de 20% — recarregue agora"
                  : "Precisa de mais tokens?"}
              </p>
              <p className="text-[12px] mt-0.5" style={{ color: "#9A7020" }}>
                +2.000.000 tokens adicionados imediatamente ao seu saldo.
              </p>
            </div>
            <TokenPackButton />
          </div>
        </div>
      </section>

      {isAdmin && stats && (
        <>
          {/* === Monthly stats === */}
          <section>
            <p
              className="text-[11px] font-semibold uppercase mb-4"
              style={{ color: "#3E3E52", letterSpacing: "0.14em" }}
            >
              Resumo do Mês
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Sessões", value: formatNumber(stats.totalSessions) },
                { label: "Mensagens", value: formatNumber(stats.totalMessages) },
                { label: "Tokens consumidos", value: formatNumber(stats.totalTokensUsed) },
                { label: "Usuários ativos", value: formatNumber(stats.activeUsers) },
              ].map((card) => (
                <div
                  key={card.label}
                  className="p-5"
                  style={CARD_STYLE}
                >
                  <p className="text-[11px] mb-2" style={{ color: "#4A4A60" }}>
                    {card.label}
                  </p>
                  <p
                    className="font-bold"
                    style={{ color: "#EEECE6", fontSize: "28px", letterSpacing: "-0.04em", lineHeight: 1 }}
                  >
                    {card.value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* === Por agente === */}
          {stats.agentStats.length > 0 && (
            <section style={CARD_STYLE} className="overflow-hidden">
              <div
                className="px-6 py-4"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
              >
                <h2
                  className="text-[15px] font-semibold"
                  style={{ color: "#EEECE6", letterSpacing: "-0.01em" }}
                >
                  Uso por Agente
                </h2>
              </div>
              <div>
                {stats.agentStats.map((a, i) => {
                  const Icon = AGENT_ICONS[a.agentType] ?? Bot;
                  const agentStyle = AGENT_COLORS[a.agentType] ?? {
                    bg: "rgba(255,255,255,0.07)",
                    text: "#8888A0",
                    border: "rgba(255,255,255,0.1)",
                  };
                  return (
                    <div
                      key={a.agentType}
                      className="flex items-center gap-4 px-6 py-4"
                      style={i > 0 ? DIVIDER : undefined}
                    >
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px]"
                        style={{
                          background: agentStyle.bg,
                          border: `1px solid ${agentStyle.border}`,
                        }}
                      >
                        <Icon className="h-5 w-5" style={{ color: agentStyle.text }} strokeWidth={1.75} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-[14px] font-medium truncate"
                          style={{ color: "#EEECE6", letterSpacing: "-0.01em" }}
                        >
                          {a.agentName}
                        </p>
                        <p className="text-[12px] mt-0.5" style={{ color: "#4A4A60" }}>
                          {AGENT_LABELS[a.agentType] ?? a.agentType}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[13px] font-semibold" style={{ color: "#EEECE6" }}>
                          {a.sessions} sessões
                        </p>
                        <p className="text-[12px] mt-0.5" style={{ color: "#4A4A60" }}>
                          {formatNumber(a.tokens)} tokens
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* === Users === */}
          <section style={CARD_STYLE} className="overflow-hidden">
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div>
                <h2
                  className="text-[15px] font-semibold"
                  style={{ color: "#EEECE6", letterSpacing: "-0.01em" }}
                >
                  Usuários
                </h2>
                <p className="text-[12px] mt-0.5" style={{ color: "#4A4A60" }}>
                  {companyUsers.length} cadastrado(s)
                </p>
              </div>
              <InviteUserModal />
            </div>

            {companyUsers.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div
                  className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[8px]"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                >
                  <Users className="h-6 w-6" style={{ color: "#4A4A60" }} strokeWidth={1.5} />
                </div>
                <p className="text-[14px] font-medium" style={{ color: "#8888A0" }}>
                  Nenhum usuário cadastrado ainda.
                </p>
                <p className="text-[12px] mt-1" style={{ color: "#4A4A60" }}>
                  Convide funcionários usando o botão acima.
                </p>
              </div>
            ) : (
              <div>
                {companyUsers.map((u, i) => {
                  const badge = ROLE_BADGE[u.role] ?? ROLE_BADGE.employee;
                  const nameInitial = (u.fullName ?? u.email)[0].toUpperCase();
                  return (
                    <div
                      key={u.id}
                      className="flex items-center gap-4 px-6 py-4"
                      style={i > 0 ? DIVIDER : undefined}
                    >
                      {/* Avatar */}
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[14px] font-bold"
                        style={{
                          background: "rgba(255,255,255,0.07)",
                          color: "#8888A0",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        {nameInitial}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p
                          className="truncate text-[14px] font-medium"
                          style={{ color: "#EEECE6", letterSpacing: "-0.01em" }}
                        >
                          {u.fullName ?? u.email}
                        </p>
                        <p className="text-[12px] mt-0.5" style={{ color: "#4A4A60" }}>
                          {u.email}
                        </p>
                      </div>

                      {/* Role + last access */}
                      <div className="shrink-0 text-right space-y-1.5">
                        <span
                          className="inline-flex items-center rounded-[4px] px-2 py-[3px] text-[10px] font-bold uppercase"
                          style={{
                            background: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                            letterSpacing: "0.07em",
                          }}
                        >
                          {ROLE_LABELS[u.role] ?? u.role}
                        </span>
                        <p className="text-[11px]" style={{ color: "#3A3A50" }}>
                          {formatDate(u.lastSeenAt)}
                        </p>
                      </div>

                      {/* Sessions */}
                      <span
                        className="shrink-0 text-[12px] tabular-nums"
                        style={{ color: "#3A3A50" }}
                      >
                        {u.sessionCount}
                        <span className="ml-1" style={{ color: "#2A2A38" }}>sess.</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      {/* Bottom spacing */}
      <div className="h-4" />
    </div>
  );
}
