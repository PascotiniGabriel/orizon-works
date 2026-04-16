import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserCompanyInfo, getCompanyAgents } from "@/lib/db/queries/company";
import { SectorOnboarding } from "@/components/onboarding/SectorOnboarding";
import type { AgentType } from "@/actions/sector";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NovoAgentePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const info = await getUserCompanyInfo(user.id);
  if (!info) redirect("/login");

  const agents = await getCompanyAgents(info.companyId);
  const existingTypes = agents.map((a) => a.type as AgentType);

  // Se atingiu o limite do plano, redireciona para configurações
  if (agents.length >= info.maxAgents) redirect("/configuracoes");

  // Se não há mais tipos disponíveis (todos os 5 já criados)
  const ALL_TYPES: AgentType[] = ["rh", "marketing", "comercial", "financeiro", "administrativo"];
  const available = ALL_TYPES.filter((t) => !existingTypes.includes(t));
  if (available.length === 0) redirect("/escritorio");

  return (
    <div style={{ padding: "0", height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "18px 30px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 }}>
        <Link
          href="/escritorio"
          style={{ display: "flex", alignItems: "center", gap: "6px", color: "#555", fontSize: "13px", textDecoration: "none", transition: "color 0.15s" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#888"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#555"; }}
        >
          <ArrowLeft style={{ width: "14px", height: "14px" }} strokeWidth={2} />
          Escritório
        </Link>
        <span style={{ color: "#2A2A2A" }}>/</span>
        <h1 style={{ color: "#EBEBEB", fontSize: "15px", fontWeight: 600, letterSpacing: "-0.02em" }}>
          Novo agente
        </h1>
        <span style={{ marginLeft: "auto", color: "#3A3A3A", fontSize: "12px" }}>
          {agents.length} de {info.maxAgents} agentes usados
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 30px" }}>
        <SectorOnboarding existingTypes={existingTypes} />
      </div>
    </div>
  );
}
