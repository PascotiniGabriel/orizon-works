import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserCompanyInfo } from "@/lib/db/queries/company";
import { getSessionsHistory } from "@/lib/db/queries/sessions";
import { Clock, Bot, ChevronRight } from "lucide-react";

const AGENT_TYPE_LABELS: Record<string, string> = {
  rh:             "RH",
  marketing:      "Marketing",
  comercial:      "Comercial",
  financeiro:     "Financeiro",
  administrativo: "Administrativo",
};

const AGENT_DOT: Record<string, string> = {
  rh:             "#A78BFA",
  marketing:      "#FB7185",
  comercial:      "#60A5FA",
  financeiro:     "#10B981",
  administrativo: "#FBBF24",
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
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>

      {/* ── Page header ── */}
      <div
        style={{
          padding: "18px 28px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h1
            style={{
              color: "#EBEBEB",
              fontSize: "15px",
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}
          >
            Histórico
          </h1>
          {sessoes.length > 0 && (
            <span
              style={{
                background: "rgba(255,255,255,0.06)",
                color: "#888",
                fontSize: "11px",
                fontWeight: 600,
                padding: "2px 7px",
                borderRadius: "4px",
              }}
            >
              {sessoes.length}
            </span>
          )}
        </div>
        <p style={{ color: "#3A3A3A", fontSize: "12px" }}>
          {info.role === "employee" ? "Suas conversas · 30 dias" : "Toda a empresa · 30 dias"}
        </p>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
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
              borderRadius: "8px",
            }}
          >
            <Clock
              style={{ width: "32px", height: "32px", color: "#2A2A2A", marginBottom: "16px" }}
              strokeWidth={1.25}
            />
            <p style={{ color: "#888", fontSize: "14px", fontWeight: 500, marginBottom: "6px" }}>
              Nenhuma conversa ainda
            </p>
            <p style={{ color: "#3A3A3A", fontSize: "12px" }}>
              As conversas com os agentes aparecerão aqui.
            </p>
            <Link
              href="/escritorio"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                marginTop: "24px",
                padding: "8px 16px",
                background: "#10B981",
                color: "#000",
                fontWeight: 600,
                fontSize: "12px",
                borderRadius: "6px",
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
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            {sessoes.map((s, i) => {
              const agentLabel = s.agentName ?? AGENT_TYPE_LABELS[s.agentType] ?? s.agentType;
              const dot = AGENT_DOT[s.agentType] ?? "#555";
              return (
                <Link
                  key={s.id}
                  href={`/escritorio/historico/${s.id}`}
                  className="ow-row"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "14px 18px",
                    textDecoration: "none",
                    borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : undefined,
                    transition: "background 0.12s",
                  }}
                >
                  {/* Agent avatar */}
                  {s.agentAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.agentAvatarUrl}
                      alt={agentLabel}
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "7px",
                        objectFit: "cover",
                        border: "1px solid rgba(255,255,255,0.07)",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "7px",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Bot style={{ width: "16px", height: "16px", color: dot }} strokeWidth={1.5} />
                    </div>
                  )}

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                      <span style={{ color: "#EBEBEB", fontSize: "13px", fontWeight: 500, letterSpacing: "-0.01em" }}>
                        {agentLabel}
                      </span>
                      <span
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          color: "#555",
                          fontSize: "9px",
                          fontWeight: 700,
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
                        color: "#3A3A3A",
                        fontSize: "11px",
                        fontFamily: "var(--font-geist-mono)",
                      }}
                    >
                      {formatDate(s.updatedAt)}
                      <span style={{ margin: "0 5px", color: "#2A2A2A" }}>·</span>
                      {s.messageCount} msgs
                      <span style={{ margin: "0 5px", color: "#2A2A2A" }}>·</span>
                      {s.tokensUsed.toLocaleString("pt-BR")} tokens
                      {info.role !== "employee" && s.userName && (
                        <>
                          <span style={{ margin: "0 5px", color: "#2A2A2A" }}>·</span>
                          {s.userName}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight
                    style={{ width: "14px", height: "14px", color: "#2A2A2A", flexShrink: 0 }}
                    strokeWidth={2}
                  />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
