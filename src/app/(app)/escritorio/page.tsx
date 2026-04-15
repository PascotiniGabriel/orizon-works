import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserCompanyInfo, getCompanyAgents } from "@/lib/db/queries/company";
import { Bot, Zap, History, Settings } from "lucide-react";
import { AgentCardGrid } from "@/components/app/AgentCommandList";

export default async function EscritorioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const info = await getUserCompanyInfo(user.id);
  if (!info) redirect("/login");

  const agents = await getCompanyAgents(info.companyId);
  const readyCount = agents.filter((a) => a.briefingComplete).length;
  const firstName = info.fullName?.split(" ")[0] ?? "você";

  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });

  return (
    <div style={{ padding: "0", height: "100%", display: "flex", flexDirection: "column" }}>

      {/* Page header */}
      <div style={{ padding: "18px 30px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <h1 style={{ color: "#EBEBEB", fontSize: "17px", fontWeight: 600, letterSpacing: "-0.02em" }}>
            Escritório
          </h1>
          {agents.length > 0 && (
            <span style={{ background: "rgba(255,255,255,0.06)", color: "#888", fontSize: "12px", fontWeight: 600, padding: "2px 8px", borderRadius: "4px" }}>
              {agents.length}
            </span>
          )}
        </div>
        <span style={{ color: "#3A3A3A", fontSize: "13px", fontFamily: "var(--font-geist-mono)" }}>{dateStr}</span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 30px" }}>
        {agents.length > 0 ? (
          <>
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "32px" }}>
              <StatCard label="Total de agentes"   value={String(agents.length)} sub={readyCount === agents.length ? "Todos prontos" : `${readyCount} configurados`} color="#10B981" />
              <StatCard label="Tokens restantes"   value={formatK(info.tokenBalance)} sub={`de ${formatK(info.tokenLimit)} disponíveis`} color="#60A5FA" />
              <StatCard label="Empresa"            value={info.companyName ?? "—"} sub={`Olá, ${firstName}`} color="#FBBF24" />
            </div>

            {/* Section label */}
            <p style={{ color: "#3A3A3A", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "12px" }}>
              Seus agentes
            </p>

            <AgentCardGrid agents={agents} />

            {/* Quick links */}
            <div style={{ display: "flex", gap: "10px", marginTop: "22px" }}>
              <QuickLink href="/escritorio/historico" icon={History} label="Histórico" />
              <QuickLink href="/configuracoes" icon={Settings} label="Configurações" />
            </div>
          </>
        ) : (
          /* Empty state */
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 40px", textAlign: "center", border: "1px dashed rgba(255,255,255,0.07)", borderRadius: "8px", marginTop: "20px" }}>
            <div style={{ width: "52px", height: "52px", borderRadius: "10px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
              <Bot style={{ width: "24px", height: "24px", color: "#10B981" }} strokeWidth={1.5} />
            </div>
            <p style={{ color: "#EBEBEB", fontSize: "18px", fontWeight: 600, letterSpacing: "-0.02em", marginBottom: "10px" }}>
              Nenhum agente configurado
            </p>
            <p style={{ color: "#555", fontSize: "15px", lineHeight: "1.6", maxWidth: "280px" }}>
              Configure seu primeiro agente de IA para começar a automatizar seu negócio.
            </p>
            <Link href="/onboarding/setor" style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginTop: "26px", padding: "11px 22px", background: "#10B981", color: "#000", fontWeight: 700, fontSize: "15px", borderRadius: "7px", textDecoration: "none" }}>
              <Zap style={{ width: "15px", height: "15px" }} />
              Criar primeiro agente
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function formatK(n: number) {
  if (n >= 1_000_000) {
    const val = Math.floor(n / 10_000) / 100;
    return `${val}M`;
  }
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div style={{ padding: "18px", background: "#161616", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px" }}>
      <p style={{ color: "#3A3A3A", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>{label}</p>
      <p style={{ color, fontSize: "26px", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1, marginBottom: "5px", fontFamily: "var(--font-geist-mono)" }}>{value}</p>
      <p style={{ color: "#555", fontSize: "13px" }}>{sub}</p>
    </div>
  );
}

function QuickLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <Link href={href} style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "8px 14px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.07)", color: "#555", fontSize: "14px", fontWeight: 500, textDecoration: "none" }}>
      <Icon style={{ width: "14px", height: "14px" }} strokeWidth={1.75} />
      {label}
    </Link>
  );
}
