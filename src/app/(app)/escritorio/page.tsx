import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserCompanyInfo, getCompanyAgents } from "@/lib/db/queries/company";
import { Bot, ArrowRight, Settings, Zap } from "lucide-react";
import { AgentCardGrid } from "@/components/app/AgentCommandList";

export default async function EscritorioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const info = await getUserCompanyInfo(user.id);
  if (!info) redirect("/login");

  const agents = await getCompanyAgents(info.companyId);
  const firstName = info.fullName?.split(" ")[0] ?? "você";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  const readyCount = agents.filter((a) => a.briefingComplete).length;

  const now = new Date();
  const dateLabel = now.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div style={{ padding: "40px 48px", maxWidth: "1200px" }}>
      {/* Page header */}
      <div style={{ marginBottom: "48px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
          <div>
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
              {greeting}
            </p>
            <h1
              style={{
                color: "#F0EDE8",
                fontSize: "64px",
                fontWeight: 800,
                letterSpacing: "-0.04em",
                lineHeight: 1,
              }}
            >
              {firstName}
            </h1>
            {agents.length > 0 && (
              <p style={{ color: "#3C3C52", fontSize: "14px", marginTop: "12px", letterSpacing: "-0.01em" }}>
                {readyCount === agents.length
                  ? `${agents.length} agente${agents.length > 1 ? "s" : ""} pronto${agents.length > 1 ? "s" : ""} para trabalhar`
                  : `${readyCount} de ${agents.length} agentes configurados`}
              </p>
            )}
          </div>
          <div
            style={{
              color: "#2C2C3A",
              fontSize: "11px",
              fontFamily: "var(--font-geist-mono)",
              paddingTop: "4px",
              whiteSpace: "nowrap",
            }}
          >
            {dateLabel}
          </div>
        </div>
      </div>

      {/* Agent cards or empty state */}
      {agents.length > 0 ? (
        <div>
          <p
            style={{
              color: "#2C2C3A",
              fontSize: "10px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              marginBottom: "16px",
            }}
          >
            Seus Agentes
          </p>

          <AgentCardGrid agents={agents} />

          {/* Quick links */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "32px" }}>
            <Link
              href="/configuracoes"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "8px 14px",
                borderRadius: "7px",
                border: "1px solid rgba(255,255,255,0.07)",
                color: "#4C4C64",
                fontSize: "12px",
                fontWeight: 500,
                textDecoration: "none",
                transition: "all 0.15s",
              }}
            >
              <Settings style={{ width: "13px", height: "13px" }} />
              Configurações
            </Link>
            <Link
              href="/escritorio/historico"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "8px 14px",
                borderRadius: "7px",
                border: "1px solid rgba(255,255,255,0.07)",
                color: "#4C4C64",
                fontSize: "12px",
                fontWeight: 500,
                textDecoration: "none",
                transition: "all 0.15s",
              }}
            >
              <ArrowRight style={{ width: "13px", height: "13px" }} />
              Histórico
            </Link>
          </div>
        </div>
      ) : (
        /* Empty state */
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "56px",
              height: "56px",
              background: "rgba(232,160,32,0.07)",
              border: "1px solid rgba(232,160,32,0.18)",
              borderRadius: "10px",
              marginBottom: "20px",
            }}
          >
            <Bot style={{ width: "28px", height: "28px", color: "#E8A020" }} strokeWidth={1.5} />
          </div>
          <p
            style={{
              color: "#F0EDE8",
              fontSize: "20px",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              marginBottom: "8px",
            }}
          >
            Nenhum agente configurado
          </p>
          <p style={{ color: "#3C3C52", fontSize: "14px", lineHeight: "1.6", maxWidth: "280px" }}>
            Configure seu primeiro agente de IA para começar a automatizar seu negócio.
          </p>
          <Link
            href="/onboarding/setor"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "28px",
              padding: "10px 20px",
              background: "#E8A020",
              color: "#1A0E00",
              fontWeight: 700,
              fontSize: "14px",
              letterSpacing: "-0.01em",
              borderRadius: "8px",
              textDecoration: "none",
            }}
          >
            <Zap style={{ width: "15px", height: "15px" }} />
            Criar primeiro agente
          </Link>
        </div>
      )}
    </div>
  );
}
