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
  employee:      { bg: "rgba(255,255,255,0.06)", color: "#888",    border: "rgba(255,255,255,0.1)"  },
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
  administrativo:{ bg: "rgba(16,185,129,0.12)",  text: "#10B981", border: "rgba(16,185,129,0.2)"  },
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

const CARD: React.CSSProperties = {
  background: "#161616",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: "8px",
};

const DIVIDER: React.CSSProperties = { borderTop: "1px solid rgba(255,255,255,0.06)" };

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
    tokenPercent > 80 ? "#F87171" : tokenPercent > 60 ? "#FBBF24" : "#10B981";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* Page header bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: "52px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <h1 style={{ color: "#EBEBEB", fontSize: "17px", fontWeight: 600, letterSpacing: "-0.025em", margin: 0 }}>
            Configurações
          </h1>
          <span style={{ color: "#555", fontSize: "13px" }}>{info.companyName}</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
        <div style={{ maxWidth: "860px", display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* === Token consumption === */}
          <section style={CARD}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div>
                <p style={{ color: "#EBEBEB", fontSize: "15px", fontWeight: 600, letterSpacing: "-0.01em", margin: 0 }}>
                  Consumo de Tokens
                </p>
                <p style={{ color: "#555", fontSize: "13px", marginTop: "2px" }}>Período atual</p>
              </div>
              <Zap style={{ width: "16px", height: "16px", color: barColor }} strokeWidth={2.5} fill={barColor} />
            </div>

            <div style={{ padding: "20px" }}>
              {/* Bar */}
              <div style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ color: "#EBEBEB", fontSize: "14px", fontWeight: 500 }}>
                    {formatNumber(tokensUsed)} usados
                  </span>
                  <span style={{ color: "#555", fontSize: "13px" }}>
                    limite: {formatNumber(info.tokenLimit)}
                  </span>
                </div>
                <div style={{ height: "3px", background: "rgba(255,255,255,0.07)", borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(tokenPercent, 100)}%`, background: barColor, borderRadius: "2px", boxShadow: `0 0 8px ${barColor}50` }} />
                </div>
                <p style={{ color: "#555", fontSize: "13px", marginTop: "8px" }}>
                  {formatNumber(info.tokenBalance)} tokens disponíveis ({percentRemaining}% restante)
                </p>
              </div>

              {/* Checkout feedback */}
              {token_pack === "success" && (
                <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "6px", padding: "12px 16px", marginBottom: "12px" }}>
                  <CheckCircle2 style={{ width: "16px", height: "16px", color: "#10B981", flexShrink: 0 }} strokeWidth={2} />
                  <div>
                    <p style={{ color: "#10B981", fontSize: "14px", fontWeight: 600, margin: 0 }}>
                      Token Pack adquirido com sucesso!
                    </p>
                    <p style={{ color: "#4EDBA4", fontSize: "13px", marginTop: "2px" }}>
                      2.000.000 tokens foram adicionados ao seu saldo.
                    </p>
                  </div>
                </div>
              )}
              {token_pack === "canceled" && (
                <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", padding: "12px 16px", marginBottom: "12px" }}>
                  <XCircle style={{ width: "16px", height: "16px", color: "#555", flexShrink: 0 }} strokeWidth={2} />
                  <p style={{ color: "#888", fontSize: "13px", margin: 0 }}>
                    Compra cancelada. Nenhum valor foi cobrado.
                  </p>
                </div>
              )}

              {/* Token pack offer */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: "6px", padding: "14px 16px" }}>
                <div>
                  <p style={{ color: "#10B981", fontSize: "14px", fontWeight: 600, margin: 0 }}>
                    {info.tokenBalance < info.tokenLimit * 0.2
                      ? "Saldo abaixo de 20% — recarregue agora"
                      : "Precisa de mais tokens?"}
                  </p>
                  <p style={{ color: "#3A8A6A", fontSize: "13px", marginTop: "2px" }}>
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
                <p style={{ color: "#444", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "12px" }}>
                  Resumo do Mês
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px" }}>
                  {[
                    { label: "Sessões",           value: formatNumber(stats.totalSessions)   },
                    { label: "Mensagens",          value: formatNumber(stats.totalMessages)   },
                    { label: "Tokens consumidos",  value: formatNumber(stats.totalTokensUsed) },
                    { label: "Usuários ativos",    value: formatNumber(stats.activeUsers)     },
                  ].map((card) => (
                    <div key={card.label} style={{ ...CARD, padding: "16px 18px" }}>
                      <p style={{ color: "#555", fontSize: "12px", marginBottom: "8px" }}>{card.label}</p>
                      <p style={{ color: "#EBEBEB", fontSize: "26px", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1, margin: 0 }}>
                        {card.value}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* === Por agente === */}
              {stats.agentStats.length > 0 && (
                <section style={CARD}>
                  <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <p style={{ color: "#EBEBEB", fontSize: "15px", fontWeight: 600, letterSpacing: "-0.01em", margin: 0 }}>
                      Uso por Agente
                    </p>
                  </div>
                  <div>
                    {stats.agentStats.map((a, i) => {
                      const Icon = AGENT_ICONS[a.agentType] ?? Bot;
                      const agentStyle = AGENT_COLORS[a.agentType] ?? { bg: "rgba(255,255,255,0.07)", text: "#888", border: "rgba(255,255,255,0.1)" };
                      return (
                        <div key={a.agentType} className="ow-row" style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 20px", ...(i > 0 ? DIVIDER : {}) }}>
                          <div style={{ width: "38px", height: "38px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", background: agentStyle.bg, border: `1px solid ${agentStyle.border}` }}>
                            <Icon style={{ width: "17px", height: "17px", color: agentStyle.text }} strokeWidth={1.75} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ color: "#EBEBEB", fontSize: "15px", fontWeight: 500, letterSpacing: "-0.01em", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {a.agentName}
                            </p>
                            <p style={{ color: "#555", fontSize: "13px", marginTop: "1px" }}>
                              {AGENT_LABELS[a.agentType] ?? a.agentType}
                            </p>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <p style={{ color: "#EBEBEB", fontSize: "14px", fontWeight: 500, margin: 0 }}>{a.sessions} sessões</p>
                            <p style={{ color: "#555", fontSize: "13px", marginTop: "1px", fontFamily: "var(--font-geist-mono)" }}>
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
              <section style={CARD}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div>
                    <p style={{ color: "#EBEBEB", fontSize: "15px", fontWeight: 600, letterSpacing: "-0.01em", margin: 0 }}>
                      Usuários
                    </p>
                    <p style={{ color: "#555", fontSize: "13px", marginTop: "2px" }}>
                      {companyUsers.length} cadastrado(s)
                    </p>
                  </div>
                  <InviteUserModal />
                </div>

                {companyUsers.length === 0 ? (
                  <div style={{ padding: "48px 20px", textAlign: "center" }}>
                    <div style={{ width: "44px", height: "44px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                      <Users style={{ width: "20px", height: "20px", color: "#444" }} strokeWidth={1.5} />
                    </div>
                    <p style={{ color: "#888", fontSize: "15px", fontWeight: 500, margin: 0 }}>Nenhum usuário cadastrado ainda.</p>
                    <p style={{ color: "#555", fontSize: "13px", marginTop: "4px" }}>Convide funcionários usando o botão acima.</p>
                  </div>
                ) : (
                  <div>
                    {companyUsers.map((u, i) => {
                      const badge = ROLE_BADGE[u.role] ?? ROLE_BADGE.employee;
                      const nameInitial = (u.fullName ?? u.email)[0].toUpperCase();
                      return (
                        <div key={u.id} className="ow-row" style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 20px", ...(i > 0 ? DIVIDER : {}) }}>
                          {/* Avatar */}
                          <div style={{ width: "36px", height: "36px", flexShrink: 0, borderRadius: "50%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700, color: "#888" }}>
                            {nameInitial}
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ color: "#EBEBEB", fontSize: "15px", fontWeight: 500, letterSpacing: "-0.01em", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {u.fullName ?? u.email}
                            </p>
                            <p style={{ color: "#555", fontSize: "13px", marginTop: "1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {u.email}
                            </p>
                          </div>

                          {/* Role + last access */}
                          <div style={{ flexShrink: 0, textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", borderRadius: "4px", padding: "2px 7px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                              {ROLE_LABELS[u.role] ?? u.role}
                            </span>
                            <p style={{ color: "#444", fontSize: "12px", margin: 0, fontFamily: "var(--font-geist-mono)" }}>
                              {formatDate(u.lastSeenAt)}
                            </p>
                          </div>

                          {/* Sessions */}
                          <span style={{ flexShrink: 0, fontSize: "13px", color: "#444", fontFamily: "var(--font-geist-mono)" }}>
                            {u.sessionCount} sess.
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}

          <div style={{ height: "16px" }} />
        </div>
      </div>
    </div>
  );
}
