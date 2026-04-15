import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bot, Users, Megaphone, TrendingUp, DollarSign, FolderOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserCompanyInfo } from "@/lib/db/queries/company";
import { getSessionDetail } from "@/lib/db/queries/sessions";

const AGENT_TYPE_LABELS: Record<string, string> = {
  rh: "RH",
  marketing: "Marketing",
  comercial: "Comercial",
  financeiro: "Financeiro",
  administrativo: "Administrativo",
};

const AGENT_ICONS: Record<string, React.ElementType> = {
  rh: Users,
  marketing: Megaphone,
  comercial: TrendingUp,
  financeiro: DollarSign,
  administrativo: FolderOpen,
};

const AGENT_COLORS: Record<string, { bg: string; icon: string }> = {
  rh:            { bg: "rgba(167,139,250,0.1)", icon: "#B09EFC" },
  marketing:     { bg: "rgba(251,113,133,0.1)", icon: "#FC879A" },
  comercial:     { bg: "rgba(96,165,250,0.1)",  icon: "#74B4FB" },
  financeiro:    { bg: "rgba(16,185,129,0.1)",  icon: "#10B981" },
  administrativo:{ bg: "rgba(251,191,36,0.1)",  icon: "#FBBF24" },
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const info = await getUserCompanyInfo(user.id);
  if (!info) redirect("/login");

  const detail = await getSessionDetail(sessionId, info.companyId, info.userId, info.role);
  if (!detail) notFound();

  const { session, messages } = detail;
  const agentLabel = session.agentName ?? AGENT_TYPE_LABELS[session.agentType] ?? session.agentType;
  const AgentIcon = AGENT_ICONS[session.agentType] ?? Bot;
  const agentColor = AGENT_COLORS[session.agentType] ?? { bg: "rgba(255,255,255,0.06)", icon: "#666" };
  const visibleMessages = messages.filter((m) => m.role !== "system");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* Page header bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "0 20px", height: "52px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        <Link
          href="/escritorio/historico"
          style={{ display: "flex", alignItems: "center", gap: "6px", color: "#555", fontSize: "13px", textDecoration: "none", flexShrink: 0 }}
        >
          <ArrowLeft style={{ width: "14px", height: "14px" }} strokeWidth={2} />
          Histórico
        </Link>

        <span style={{ color: "rgba(255,255,255,0.1)", fontSize: "16px" }}>·</span>

        {/* Agent icon */}
        <div style={{ width: "26px", height: "26px", borderRadius: "6px", background: agentColor.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <AgentIcon style={{ width: "13px", height: "13px", color: agentColor.icon }} strokeWidth={1.75} />
        </div>

        <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: "10px" }}>
          <h1 style={{ color: "#EBEBEB", fontSize: "15px", fontWeight: 600, letterSpacing: "-0.02em", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {agentLabel}
          </h1>
          <span style={{ color: "#444", fontSize: "12px", fontFamily: "var(--font-geist-mono)", whiteSpace: "nowrap" }}>
            {formatDate(session.createdAt)}
          </span>
          {info.role !== "employee" && session.userName && (
            <span style={{ color: "#555", fontSize: "12px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              · {session.userName}
            </span>
          )}
        </div>

        <span style={{ color: "#444", fontSize: "12px", fontFamily: "var(--font-geist-mono)", flexShrink: 0 }}>
          {session.tokensUsed.toLocaleString("pt-BR")} tokens
        </span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: "16px" }}>
          {visibleMessages.length === 0 ? (
            <p style={{ textAlign: "center", color: "#444", fontSize: "14px", padding: "48px 0" }}>
              Nenhuma mensagem nesta sessão.
            </p>
          ) : (
            visibleMessages.map((msg) => (
              <div
                key={msg.id}
                style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", gap: "10px", alignItems: "flex-start" }}
              >
                {msg.role === "assistant" && (
                  <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: agentColor.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
                    <AgentIcon style={{ width: "13px", height: "13px", color: agentColor.icon }} strokeWidth={1.75} />
                  </div>
                )}
                <div
                  style={{
                    maxWidth: "72%",
                    padding: "10px 14px",
                    borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                    fontSize: "15px",
                    lineHeight: "1.65",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    background: msg.role === "user" ? "#10B981" : "rgba(255,255,255,0.04)",
                    color: msg.role === "user" ? "#000" : "#EBEBEB",
                    border: msg.role === "user" ? "none" : "1px solid rgba(255,255,255,0.06)",
                    fontWeight: msg.role === "user" ? 500 : 400,
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Read-only footer */}
      <div style={{ flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.06)", padding: "10px 20px", textAlign: "center" }}>
        <p style={{ color: "#444", fontSize: "12px", margin: 0 }}>
          Sessão encerrada — visualização somente leitura
        </p>
      </div>
    </div>
  );
}
