import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserCompanyInfo } from "@/lib/db/queries/company";
import {
  getMonthlyAnalytics,
  getDailyActivity,
  getSixMonthHistory,
  getTopUsers,
  type DailyPoint,
  type AgentUsageItem,
  type MonthHistory,
} from "@/lib/db/queries/analytics";
import { tokensToCredits, formatCredits } from "@/lib/utils/credits";
import { AnalyticsExportButton } from "./AnalyticsExportButton";
import {
  ChevronLeft, ChevronRight, BarChart2, Clock, Zap, FileText,
  Users, Megaphone, TrendingUp, DollarSign, FolderOpen, Bot,
} from "lucide-react";

const MONTHS_FULL = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const MONTHS_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const AGENT_ICONS: Record<string, React.ElementType> = {
  rh: Users, marketing: Megaphone, comercial: TrendingUp,
  financeiro: DollarSign, administrativo: FolderOpen,
};
const AGENT_LABELS: Record<string, string> = {
  rh: "RH", marketing: "Marketing", comercial: "Comercial",
  financeiro: "Financeiro", administrativo: "Administrativo",
};
const AGENT_COLORS: Record<string, string> = {
  rh: "#A78BFA", marketing: "#FB7185", comercial: "#60A5FA",
  financeiro: "#10B981", administrativo: "#FBBF24",
};

const HOURLY_RATE = 35;
const MINS_PER_SESSION = 15;

const CARD: React.CSSProperties = {
  background: "#161616",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: "8px",
};

function fmtBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

// ─── SVG Sparkline ───────────────────────────────────────────────────────────

function Sparkline({ data }: { data: DailyPoint[] }) {
  const W = 400; const H = 56; const PAD = 4;
  const max = Math.max(...data.map((d) => d.sessions), 1);
  const hasAny = data.some((d) => d.sessions > 0);

  if (!hasAny) {
    return (
      <div style={{ height: "56px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#3A3A3A", fontSize: "13px" }}>Sem atividade neste período</span>
      </div>
    );
  }

  const xStep = data.length > 1 ? (W - PAD * 2) / (data.length - 1) : 0;
  const pts = data.map((d, i) => ({
    x: PAD + i * xStep,
    y: PAD + (1 - d.sessions / max) * (H - PAD * 2),
  }));

  const lineD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaD = `${lineD} L${pts[pts.length - 1].x.toFixed(1)},${H} L${pts[0].x.toFixed(1)},${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: "56px", display: "block" }}>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#sg)" />
      <path d={lineD} fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Agent bar ───────────────────────────────────────────────────────────────

function AgentBar({ item, maxSessions, divider }: { item: AgentUsageItem; maxSessions: number; divider: boolean }) {
  const Icon = AGENT_ICONS[item.agentType] ?? Bot;
  const color = AGENT_COLORS[item.agentType] ?? "#888";
  const pct = maxSessions > 0 ? Math.max((item.sessions / maxSessions) * 100, item.sessions > 0 ? 2 : 0) : 0;

  return (
    <div style={{ padding: "12px 20px", borderTop: divider ? "1px solid rgba(255,255,255,0.04)" : undefined }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "7px" }}>
        <Icon style={{ width: "13px", height: "13px", color, flexShrink: 0 }} strokeWidth={1.75} />
        <span style={{ flex: 1, color: "#EBEBEB", fontSize: "14px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {item.agentName ?? AGENT_LABELS[item.agentType] ?? item.agentType}
          <span style={{ color: "#555", fontSize: "12px", marginLeft: "6px" }}>· {AGENT_LABELS[item.agentType]}</span>
        </span>
        <div style={{ display: "flex", gap: "14px", flexShrink: 0 }}>
          <span style={{ color: "#888", fontSize: "12px", fontFamily: "var(--font-geist-mono)" }}>{item.sessions} sess.</span>
          <span style={{ color: "#555", fontSize: "12px", fontFamily: "var(--font-geist-mono)" }}>{formatCredits(tokensToCredits(item.tokens))} créd.</span>
        </div>
      </div>
      <div style={{ height: "3px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "2px", opacity: 0.75 }} />
      </div>
    </div>
  );
}

// ─── Stat card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, subColor, icon }: {
  label: string; value: string; sub?: string; subColor?: string; icon?: React.ReactNode;
}) {
  return (
    <div style={{ ...CARD, padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <p style={{ color: "#555", fontSize: "12px", margin: 0 }}>{label}</p>
        {icon}
      </div>
      <p style={{ color: "#EBEBEB", fontSize: "28px", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1, margin: "0 0 5px" }}>
        {value}
      </p>
      {sub && <p style={{ color: subColor ?? "#555", fontSize: "12px", margin: 0 }}>{sub}</p>}
    </div>
  );
}

// ─── History table row ────────────────────────────────────────────────────────

function HistoryRow({ row, isCurrent, isLast }: { row: MonthHistory; isCurrent: boolean; isLast: boolean }) {
  const hrs = (row.sessions * MINS_PER_SESSION) / 60;
  return (
    <tr style={{ borderBottom: isLast ? undefined : "1px solid rgba(255,255,255,0.04)", background: isCurrent ? "rgba(16,185,129,0.04)" : undefined }}>
      <td style={{ padding: "12px 20px", color: isCurrent ? "#10B981" : "#EBEBEB", fontSize: "14px", fontWeight: isCurrent ? 600 : 400, whiteSpace: "nowrap" }}>
        {MONTHS_SHORT[row.month - 1]}/{row.year}
        {isCurrent && <span style={{ fontSize: "9px", marginLeft: "6px", color: "#10B981", fontWeight: 700, letterSpacing: "0.06em" }}>ATUAL</span>}
      </td>
      <td style={{ padding: "12px 20px", color: "#888", fontSize: "13px", fontFamily: "var(--font-geist-mono)" }}>{row.sessions.toLocaleString("pt-BR")}</td>
      <td style={{ padding: "12px 20px", color: "#888", fontSize: "13px", fontFamily: "var(--font-geist-mono)" }}>{formatCredits(tokensToCredits(row.tokensUsed))}</td>
      <td style={{ padding: "12px 20px", color: "#888", fontSize: "13px", fontFamily: "var(--font-geist-mono)" }}>{hrs.toFixed(0)}h</td>
      <td style={{ padding: "12px 20px", color: "#888", fontSize: "13px", fontFamily: "var(--font-geist-mono)" }}>{fmtBRL(hrs * HOURLY_RATE)}</td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface Props { searchParams: Promise<{ year?: string; month?: string }> }

export default async function AnalyticsPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const info = await getUserCompanyInfo(user.id);
  if (!info) redirect("/login");

  const isAdmin = info.role === "company_admin" || info.role === "super_admin";
  if (!isAdmin) redirect("/escritorio");

  const params = await searchParams;
  const now = new Date();
  const year = parseInt(params.year ?? String(now.getFullYear()), 10);
  const month = parseInt(params.month ?? String(now.getMonth() + 1), 10);

  const [analytics, dailyData, sixMonthHistory, topUsers] = await Promise.all([
    getMonthlyAnalytics(info.companyId, year, month),
    getDailyActivity(info.companyId, year, month),
    getSixMonthHistory(info.companyId),
    getTopUsers(info.companyId, year, month),
  ]);

  const hoursSaved = (analytics.totalSessions * MINS_PER_SESSION) / 60;
  const valueEstimated = hoursSaved * HOURLY_RATE;

  const sessionDiff = analytics.prevMonthSessions > 0
    ? ((analytics.totalSessions - analytics.prevMonthSessions) / analytics.prevMonthSessions) * 100
    : null;

  const prevLink = month === 1 ? `/analytics?year=${year - 1}&month=12` : `/analytics?year=${year}&month=${month - 1}`;
  const nextLink = month === 12 ? `/analytics?year=${year + 1}&month=1` : `/analytics?year=${year}&month=${month + 1}`;
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  const maxAgentSessions = Math.max(...analytics.agentUsage.map((a) => a.sessions), 1);
  const activeUsers = topUsers.filter((u) => u.sessions > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: "52px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <h1 style={{ color: "#EBEBEB", fontSize: "17px", fontWeight: 600, letterSpacing: "-0.025em", margin: 0 }}>Analytics</h1>
          <span style={{ color: "#555", fontSize: "13px" }}>{info.companyName}</span>

          {/* Month nav */}
          <div style={{ display: "flex", alignItems: "center", gap: "2px", background: "rgba(255,255,255,0.04)", borderRadius: "6px", padding: "2px 4px" }}>
            <Link href={prevLink} style={{ display: "flex", alignItems: "center", padding: "4px 6px", borderRadius: "4px", color: "#555", textDecoration: "none" }}>
              <ChevronLeft style={{ width: "14px", height: "14px" }} strokeWidth={2} />
            </Link>
            <span style={{ color: "#EBEBEB", fontSize: "13px", fontWeight: 500, minWidth: "130px", textAlign: "center" }}>
              {MONTHS_FULL[month - 1]} {year}
            </span>
            <Link
              href={nextLink}
              style={{ display: "flex", alignItems: "center", padding: "4px 6px", borderRadius: "4px", color: isCurrentMonth ? "#2A2A2A" : "#555", textDecoration: "none", pointerEvents: isCurrentMonth ? "none" : "auto" }}
            >
              <ChevronRight style={{ width: "14px", height: "14px" }} strokeWidth={2} />
            </Link>
          </div>
        </div>

        <AnalyticsExportButton companyName={info.companyName} year={year} month={month} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
        <div style={{ maxWidth: "920px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* ── Seção 1: Stat cards ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            <StatCard
              label="Interações"
              value={analytics.totalSessions.toLocaleString("pt-BR")}
              sub={
                sessionDiff !== null
                  ? `${sessionDiff >= 0 ? "+" : ""}${sessionDiff.toFixed(0)}% vs mês anterior`
                  : analytics.prevMonthSessions === 0 && analytics.totalSessions > 0
                  ? "primeiro mês"
                  : "—"
              }
              subColor={sessionDiff !== null ? (sessionDiff >= 0 ? "#10B981" : "#F87171") : "#555"}
              icon={<BarChart2 style={{ width: "15px", height: "15px", color: "#10B981" }} strokeWidth={1.75} />}
            />
            <StatCard
              label="Horas economizadas"
              value={hoursSaved >= 1 ? `${hoursSaved.toFixed(0)}h` : `${Math.round(hoursSaved * 60)}min`}
              sub="equivalentes de trabalho manual"
              icon={<Clock style={{ width: "15px", height: "15px", color: "#60A5FA" }} strokeWidth={1.75} />}
            />
            <StatCard
              label="Valor estimado"
              value={fmtBRL(valueEstimated)}
              sub="baseado em R$35/h · estimado"
              icon={<Zap style={{ width: "15px", height: "15px", color: "#FBBF24" }} strokeWidth={1.75} />}
            />
            <StatCard
              label="Documentos indexados"
              value={analytics.ragDocumentsCount.toLocaleString("pt-BR")}
              sub={`${analytics.tasksCreated} tarefa${analytics.tasksCreated !== 1 ? "s" : ""} criada${analytics.tasksCreated !== 1 ? "s" : ""} no mês`}
              icon={<FileText style={{ width: "15px", height: "15px", color: "#A78BFA" }} strokeWidth={1.75} />}
            />
          </div>

          {/* ── Seção 2+3: Uso por agente + sparkline/ranking ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "16px" }}>

            {/* Uso por agente */}
            <section style={CARD}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <p style={{ color: "#EBEBEB", fontSize: "15px", fontWeight: 600, letterSpacing: "-0.01em", margin: 0 }}>
                  Uso por Agente
                </p>
                <p style={{ color: "#555", fontSize: "12px", marginTop: "2px" }}>{MONTHS_FULL[month - 1]} {year}</p>
              </div>
              {analytics.agentUsage.length === 0 ? (
                <p style={{ color: "#444", fontSize: "13px", padding: "24px 20px", textAlign: "center", margin: 0 }}>
                  Sem dados neste período
                </p>
              ) : (
                <div style={{ paddingBottom: "8px" }}>
                  {analytics.agentUsage.map((item, i) => (
                    <AgentBar key={item.agentId} item={item} maxSessions={maxAgentSessions} divider={i > 0} />
                  ))}
                </div>
              )}
            </section>

            {/* Coluna direita */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

              {/* Sparkline diário */}
              <section style={CARD}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <p style={{ color: "#EBEBEB", fontSize: "15px", fontWeight: 600, letterSpacing: "-0.01em", margin: 0 }}>
                    Atividade Diária
                  </p>
                  <p style={{ color: "#555", fontSize: "12px", marginTop: "2px" }}>sessões por dia</p>
                </div>
                <div style={{ padding: "16px 20px 10px" }}>
                  <Sparkline data={dailyData} />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "5px" }}>
                    <span style={{ color: "#3A3A3A", fontSize: "11px" }}>1</span>
                    <span style={{ color: "#3A3A3A", fontSize: "11px" }}>{dailyData.length}</span>
                  </div>
                </div>
              </section>

              {/* Top usuários */}
              <section style={CARD}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <p style={{ color: "#EBEBEB", fontSize: "15px", fontWeight: 600, letterSpacing: "-0.01em", margin: 0 }}>
                    Mais Ativos
                  </p>
                  <p style={{ color: "#555", fontSize: "12px", marginTop: "2px" }}>{MONTHS_FULL[month - 1]}</p>
                </div>
                {activeUsers.length === 0 ? (
                  <p style={{ color: "#444", fontSize: "13px", padding: "20px", textAlign: "center", margin: 0 }}>Sem atividade</p>
                ) : (
                  <div>
                    {activeUsers.map((u, i) => (
                      <div key={u.userId} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 20px", borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : undefined }}>
                        <span style={{ color: "#3A3A3A", fontSize: "11px", fontWeight: 700, fontFamily: "var(--font-geist-mono)", width: "16px", flexShrink: 0 }}>
                          #{i + 1}
                        </span>
                        <p style={{ flex: 1, color: "#EBEBEB", fontSize: "14px", fontWeight: 500, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {u.fullName ?? u.email.split("@")[0]}
                        </p>
                        <span style={{ color: "#555", fontSize: "12px", fontFamily: "var(--font-geist-mono)", flexShrink: 0 }}>
                          {u.sessions} sess.
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>

          {/* ── Seção 4: Histórico 6 meses ── */}
          <section style={CARD}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <p style={{ color: "#EBEBEB", fontSize: "15px", fontWeight: 600, letterSpacing: "-0.01em", margin: 0 }}>
                Histórico Mensal
              </p>
              <p style={{ color: "#555", fontSize: "12px", marginTop: "2px" }}>últimos 6 meses</p>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {["Mês", "Sessões", "Créditos", "Horas salvas", "Valor estimado"].map((col) => (
                      <th key={col} style={{ padding: "10px 20px", textAlign: "left", color: "#444", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sixMonthHistory.map((row, i) => (
                    <HistoryRow
                      key={`${row.year}-${row.month}`}
                      row={row}
                      isCurrent={row.year === year && row.month === month}
                      isLast={i === sixMonthHistory.length - 1}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
