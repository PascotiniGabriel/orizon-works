import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserCompanyInfo } from "@/lib/db/queries/company";
import { getSessionsHistory } from "@/lib/db/queries/sessions";
import { Clock, Bot, ArrowRight } from "lucide-react";

const AGENT_TYPE_LABELS: Record<string, string> = {
  rh:             "RH",
  marketing:      "Marketing",
  comercial:      "Comercial",
  financeiro:     "Financeiro",
  administrativo: "Administrativo",
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

export default async function HistoricoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const info = await getUserCompanyInfo(user.id);
  if (!info) redirect("/login");

  const sessoes = await getSessionsHistory(info.companyId, info.userId, info.role);

  return (
    <div style={{ padding: "40px 48px", maxWidth: "900px" }}>
      {/* Header */}
      <div style={{ marginBottom: "36px" }}>
        <p
          style={{
            color: "#2C2C3A",
            fontSize: "10px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            marginBottom: "10px",
          }}
        >
          Workspace
        </p>
        <h1
          style={{
            color: "#F0EDE8",
            fontSize: "40px",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1,
          }}
        >
          Histórico
        </h1>
        <p style={{ color: "#3C3C52", fontSize: "14px", marginTop: "10px" }}>
          {info.role === "employee"
            ? "Suas conversas dos últimos 30 dias."
            : "Todas as conversas da empresa dos últimos 30 dias."}
        </p>
      </div>

      {sessoes.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px 40px",
            textAlign: "center",
            border: "1px dashed rgba(255,255,255,0.07)",
            borderRadius: "12px",
          }}
        >
          <Clock
            style={{ width: "36px", height: "36px", color: "#2C2C3A", marginBottom: "16px" }}
            strokeWidth={1}
          />
          <p style={{ color: "#8888A4", fontSize: "15px", fontWeight: 500, marginBottom: "6px" }}>
            Nenhuma conversa ainda
          </p>
          <p style={{ color: "#3C3C52", fontSize: "13px" }}>
            As conversas com os agentes aparecerão aqui.
          </p>
          <Link
            href="/escritorio"
            style={{
              display: "inline-block",
              marginTop: "24px",
              padding: "8px 18px",
              background: "#E8A020",
              color: "#1A0E00",
              fontWeight: 600,
              fontSize: "13px",
              borderRadius: "7px",
              textDecoration: "none",
            }}
          >
            Ir ao Escritório
          </Link>
        </div>
      ) : (
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          {sessoes.map((s, i) => {
            const agentLabel = s.agentName ?? AGENT_TYPE_LABELS[s.agentType] ?? s.agentType;
            return (
              <Link
                key={s.id}
                href={`/escritorio/historico/${s.id}`}
                className="group flex items-center hover:bg-white/[0.02] transition-colors"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "14px 20px",
                  textDecoration: "none",
                  borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : undefined,
                }}
              >
                {/* Agent avatar */}
                {s.agentAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.agentAvatarUrl}
                    alt={agentLabel}
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "8px",
                      objectFit: "cover",
                      border: "1px solid rgba(255,255,255,0.08)",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "40px",
                      height: "40px",
                      borderRadius: "8px",
                      background: "rgba(232,160,32,0.07)",
                      border: "1px solid rgba(232,160,32,0.14)",
                      flexShrink: 0,
                    }}
                  >
                    <Bot style={{ width: "18px", height: "18px", color: "#E8A020" }} strokeWidth={1.5} />
                  </div>
                )}

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                    <span
                      style={{
                        color: "#F0EDE8",
                        fontSize: "14px",
                        fontWeight: 500,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {agentLabel}
                    </span>
                    <span
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        color: "#4C4C64",
                        fontSize: "10px",
                        fontWeight: 600,
                        padding: "1px 6px",
                        borderRadius: "3px",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {AGENT_TYPE_LABELS[s.agentType] ?? s.agentType}
                    </span>
                  </div>
                  <div
                    style={{
                      color: "#3C3C52",
                      fontSize: "12px",
                      fontFamily: "var(--font-geist-mono)",
                    }}
                  >
                    {formatDate(s.updatedAt)}
                    <span style={{ margin: "0 6px" }}>·</span>
                    {s.messageCount} msgs
                    <span style={{ margin: "0 6px" }}>·</span>
                    {s.tokensUsed.toLocaleString("pt-BR")} tokens
                    {info.role !== "employee" && s.userName && (
                      <>
                        <span style={{ margin: "0 6px" }}>·</span>
                        {s.userName}
                      </>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <ArrowRight
                  style={{
                    width: "15px",
                    height: "15px",
                    color: "#2C2C3A",
                    flexShrink: 0,
                    transition: "color 0.15s, transform 0.15s",
                  }}
                  strokeWidth={2}
                />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
