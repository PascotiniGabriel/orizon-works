import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserCompanyInfo, getCompanyAgents } from "@/lib/db/queries/company";
import { getTodayActivity, getMonthActivity, getAgentStats } from "@/lib/db/queries/admin";
import { getSessionsHistory } from "@/lib/db/queries/sessions";
import { Bot, Zap, Plus, ChevronRight, AlertTriangle } from "lucide-react";
import { AgentCardGrid } from "@/components/app/AgentCommandList";
import { tokensToCredits, formatCredits } from "@/lib/utils/credits";

const AGENT_LABELS: Record<string, string> = {
  rh: "RH", marketing: "Marketing", comercial: "Comercial",
  financeiro: "Financeiro", administrativo: "Administrativo",
};
const AGENT_DESC: Record<string, string> = {
  rh:            "Recrutamento, currículos e entrevistas",
  marketing:     "Campanhas, copy e estratégia de conteúdo",
  comercial:     "Propostas, leads e argumentos de venda",
  financeiro:    "DRE, fluxo de caixa e análises financeiras",
  administrativo:"Processos internos e documentação",
};
const AGENT_DOT: Record<string, string> = {
  rh: "#A78BFA", marketing: "#FB7185", comercial: "#60A5FA",
  financeiro: "#10B981", administrativo: "#FBBF24",
};

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 2) return "agora mesmo";
  if (m < 60) return `há ${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  return `há ${d}d`;
}

export default async function EscritorioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const info = await getUserCompanyInfo(user.id);
  if (!info) redirect("/login");

  const allAgents = await getCompanyAgents(info.companyId);

  const agents =
    info.role === "sector_manager" && info.managedAgentType
      ? allAgents.filter((a) => a.type === info.managedAgentType)
      : info.role === "sector_manager"
      ? []
      : allAgents;

  const canAddAgent =
    info.role !== "sector_manager" &&
    info.role !== "employee" &&
    allAgents.length < info.maxAgents &&
    allAgents.length < 5;

  const readyCount = agents.filter((a) => a.briefingComplete).length;
  const firstName = info.fullName?.split(" ")[0] ?? "você";

  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });

  const [todayActivity, monthActivity, agentStats, recentSessions] = await Promise.all([
    getTodayActivity(info.companyId),
    getMonthActivity(info.companyId),
    getAgentStats(info.companyId),
    getSessionsHistory(info.companyId, info.userId, info.role),
  ]);

  const agentStatsMap = new Map(agentStats.map((s) => [s.agentId, s]));
  const recentFive = recentSessions.slice(0, 5);

  const creditsRemaining = tokensToCredits(info.tokenBalance);
  const creditLimit = tokensToCredits(info.tokenLimit);
  const creditPct = creditLimit > 0 ? Math.round((creditsRemaining / creditLimit) * 100) : 0;
  const hoursThisMonth = Math.round((monthActivity.messages * 10) / 60);

  return (
    <div style={{ padding: "0", height: "100%", display: "flex", flexDirection: "column" }}>

      {/* Page header */}
      <div style={{ padding: "18px 30px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <h1 style={{ color: "#EBEBEB", fontSize: "17px", fontWeight: 600, letterSpacing: "-0.02em" }}>Escritório</h1>
          {agents.length > 0 && (
            <span style={{ background: "rgba(255,255,255,0.06)", color: "#888", fontSize: "12px", fontWeight: 600, padding: "2px 8px", borderRadius: "4px" }}>
              {agents.length}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {canAddAgent && (
            <Link href="/escritorio/agentes/novo" style={{ display: "inline-flex", alignItems: "center", gap: "6px", height: "32px", padding: "0 14px", background: "#10B981", color: "#000", fontWeight: 700, fontSize: "12px", borderRadius: "6px", textDecoration: "none" }}>
              <Plus style={{ width: "13px", height: "13px" }} strokeWidth={2.5} />
              Novo agente
            </Link>
          )}
          <span style={{ color: "#3A3A3A", fontSize: "13px", fontFamily: "var(--font-geist-mono)" }}>{dateStr}</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 30px" }}>
        {agents.length > 0 ? (
          <>
            {/* === 4 Stat Cards === */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "32px" }}>

              {/* Card 1 — Agentes */}
              <div style={{ padding: "18px", background: "#161616", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px" }}>
                <p style={{ color: "#3A3A3A", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>Agentes</p>
                <p style={{ color: "#10B981", fontSize: "26px", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1, marginBottom: "5px", fontFamily: "var(--font-geist-mono)" }}>{agents.length}</p>
                <p style={{ color: "#555", fontSize: "13px" }}>
                  {readyCount === agents.length
                    ? "Todos prontos ✓"
                    : `${readyCount} de ${agents.length} configurados`}
                </p>
              </div>

              {/* Card 2 — Créditos Restantes */}
              <div style={{ padding: "18px", background: "#161616", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px" }}>
                <p style={{ color: "#3A3A3A", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>Créditos Restantes</p>
                <p style={{ color: "#60A5FA", fontSize: "26px", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1, marginBottom: "5px", fontFamily: "var(--font-geist-mono)" }}>{formatCredits(creditsRemaining)}</p>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ flex: 1, height: "2px", background: "rgba(255,255,255,0.07)", borderRadius: "1px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${creditPct}%`, background: creditPct <= 15 ? "#EF4444" : creditPct <= 30 ? "#F59E0B" : "#60A5FA", borderRadius: "1px" }} />
                  </div>
                  <span style={{ color: "#3A3A3A", fontSize: "11px", fontFamily: "var(--font-geist-mono)", flexShrink: 0 }}>{creditPct}%</span>
                </div>
              </div>

              {/* Card 3 — Atividade Hoje */}
              <div style={{ padding: "18px", background: "#161616", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px" }}>
                <p style={{ color: "#3A3A3A", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>Atividade Hoje</p>
                <p style={{ color: "#A78BFA", fontSize: "26px", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1, marginBottom: "5px", fontFamily: "var(--font-geist-mono)" }}>{todayActivity.messages}</p>
                <p style={{ color: "#555", fontSize: "13px" }}>
                  {todayActivity.messages === 0
                    ? "Nenhuma interação ainda"
                    : `${todayActivity.sessions} ${todayActivity.sessions === 1 ? "sessão ativa" : "sessões"}`}
                </p>
              </div>

              {/* Card 4 — Este Mês */}
              <div style={{ padding: "18px", background: "#161616", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px" }}>
                <p style={{ color: "#3A3A3A", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>Este Mês</p>
                <p style={{ color: "#FBBF24", fontSize: "26px", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1, marginBottom: "5px", fontFamily: "var(--font-geist-mono)" }}>{monthActivity.messages}</p>
                <p style={{ color: "#555", fontSize: "13px" }}>
                  {hoursThisMonth > 0
                    ? `≈ ${hoursThisMonth}h economizadas`
                    : `${monthActivity.sessions} sessões no mês`}
                </p>
              </div>
            </div>

            {/* === Agentes === */}
            <p style={{ color: "#3A3A3A", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px" }}>
              Seus agentes
            </p>

            <div style={{ border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px", overflow: "hidden", marginBottom: "28px" }}>
              {agents.map((agent, i) => {
                const stats = agentStatsMap.get(agent.id);
                const dot = AGENT_DOT[agent.type] ?? "#555";
                const label = agent.customName ?? AGENT_LABELS[agent.type] ?? agent.type;
                const desc = AGENT_DESC[agent.type] ?? "";
                const href = `/escritorio/chat/${agent.id}`;
                return (
                  <div
                    key={agent.id}
                    className="ow-row"
                    style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px 20px", borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : undefined }}
                  >
                    {/* Dot */}
                    <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: `${dot}12`, border: `1px solid ${dot}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Bot style={{ width: "16px", height: "16px", color: dot }} strokeWidth={1.75} />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                        <span style={{ color: "#EBEBEB", fontSize: "15px", fontWeight: 500, letterSpacing: "-0.01em" }}>{label}</span>
                        <span style={{ background: "rgba(255,255,255,0.05)", color: "#444", fontSize: "10px", fontWeight: 700, padding: "1px 5px", borderRadius: "3px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          {AGENT_LABELS[agent.type] ?? agent.type}
                        </span>
                      </div>
                      <p style={{ color: "#555", fontSize: "13px", marginBottom: "3px" }}>{desc}</p>
                      {agent.briefingComplete && stats ? (
                        <p style={{ color: "#3A3A3A", fontSize: "12px", fontFamily: "var(--font-geist-mono)" }}>
                          {stats.sessions30d} {stats.sessions30d === 1 ? "sessão" : "sessões"} este mês
                          {stats.lastActivity && (
                            <span style={{ marginLeft: "8px" }}>· última atividade {timeAgo(stats.lastActivity)}</span>
                          )}
                        </p>
                      ) : !agent.briefingComplete ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                          <AlertTriangle style={{ width: "11px", height: "11px", color: "#FBBF24", flexShrink: 0 }} strokeWidth={2} />
                          <span style={{ color: "#FBBF24", fontSize: "12px" }}>Complete o briefing para ativar este agente</span>
                          <Link href="/configuracoes/briefing" style={{ color: "#10B981", fontSize: "12px", textDecoration: "none", fontWeight: 500 }}>
                            Configurar →
                          </Link>
                        </div>
                      ) : null}
                    </div>

                    {/* CTA */}
                    <Link
                      href={href}
                      style={{ display: "flex", alignItems: "center", gap: "6px", height: "32px", padding: "0 14px", borderRadius: "6px", background: agent.briefingComplete ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.04)", border: agent.briefingComplete ? "1px solid rgba(16,185,129,0.15)" : "1px solid rgba(255,255,255,0.07)", color: agent.briefingComplete ? "#10B981" : "#555", fontSize: "13px", fontWeight: 500, textDecoration: "none", flexShrink: 0 }}
                    >
                      {agent.briefingComplete ? "Acessar" : "Configurando"}
                      <ChevronRight style={{ width: "13px", height: "13px" }} strokeWidth={2} />
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* === Atividade Recente === */}
            {recentFive.length > 0 && (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                  <p style={{ color: "#3A3A3A", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                    Atividade Recente
                  </p>
                  <Link href="/escritorio/historico" style={{ color: "#555", fontSize: "12px", textDecoration: "none" }}>
                    Ver histórico →
                  </Link>
                </div>
                <div style={{ border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px", overflow: "hidden" }}>
                  {recentFive.map((s, i) => {
                    const agentLabel = s.agentName ?? AGENT_LABELS[s.agentType] ?? s.agentType;
                    const dot = AGENT_DOT[s.agentType] ?? "#555";
                    return (
                      <Link
                        key={s.id}
                        href={`/escritorio/historico/${s.id}`}
                        className="ow-row"
                        style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 20px", textDecoration: "none", borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : undefined }}
                      >
                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: dot, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ color: "#888", fontSize: "14px" }}>
                            {agentLabel}
                            {info.role !== "employee" && s.userName && (
                              <span style={{ color: "#555" }}> · {s.userName}</span>
                            )}
                          </span>
                        </div>
                        <span style={{ color: "#3A3A3A", fontSize: "12px", fontFamily: "var(--font-geist-mono)", flexShrink: 0 }}>
                          {timeAgo(s.updatedAt)}
                        </span>
                        <span style={{ color: "#3A3A3A", fontSize: "12px", flexShrink: 0 }}>
                          {s.messageCount} msgs
                        </span>
                        <ChevronRight style={{ width: "13px", height: "13px", color: "#2A2A2A", flexShrink: 0 }} strokeWidth={2} />
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </>
        ) : (
          /* B1 — Empty state */
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "72px 40px", textAlign: "center", border: "1px dashed rgba(255,255,255,0.07)", borderRadius: "10px", marginTop: "20px", maxWidth: "520px", margin: "20px auto 0" }}>
            <div style={{ width: "52px", height: "52px", borderRadius: "10px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
              <Bot style={{ width: "24px", height: "24px", color: "#10B981" }} strokeWidth={1.5} />
            </div>

            {info.role === "sector_manager" && !info.managedAgentType ? (
              <>
                <p style={{ color: "#EBEBEB", fontSize: "18px", fontWeight: 600, letterSpacing: "-0.02em", marginBottom: "10px" }}>
                  Setor não atribuído
                </p>
                <p style={{ color: "#555", fontSize: "15px", lineHeight: "1.6", maxWidth: "300px" }}>
                  Aguarde o administrador da empresa atribuir seu setor em Configurações.
                </p>
              </>
            ) : (
              <>
                <p style={{ color: "#EBEBEB", fontSize: "20px", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: "10px" }}>
                  Seu escritório está pronto
                </p>
                <p style={{ color: "#555", fontSize: "15px", lineHeight: "1.6", maxWidth: "340px", marginBottom: "28px" }}>
                  Crie seu primeiro agente e comece a delegar tarefas que consomem horas da sua equipe toda semana.
                </p>
                <Link href="/onboarding/setor" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "11px 24px", background: "#10B981", color: "#000", fontWeight: 700, fontSize: "15px", borderRadius: "7px", textDecoration: "none" }}>
                  <Zap style={{ width: "15px", height: "15px" }} />
                  Criar primeiro agente
                </Link>
                <p style={{ color: "#3A3A3A", fontSize: "13px", marginTop: "24px", maxWidth: "300px", lineHeight: "1.5" }}>
                  Empresas que configuram o briefing completo têm resultados 3× melhores nas primeiras semanas.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
