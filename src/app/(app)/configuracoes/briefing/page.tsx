import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserCompanyInfo, getCompanyAgents } from "@/lib/db/queries/company";
import { db } from "@/lib/db";
import { companyBriefings, agentBriefings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { BriefingEditor } from "./BriefingEditor";
import { ArrowLeft } from "lucide-react";

const AGENT_LABELS: Record<string, string> = {
  rh: "RH", marketing: "Marketing", comercial: "Comercial",
  financeiro: "Financeiro", administrativo: "Administrativo",
};

export default async function BriefingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const info = await getUserCompanyInfo(user.id);
  if (!info) redirect("/login");

  const canEditCompany = info.role === "company_admin" || info.role === "super_admin";

  const [companyBriefingRow] = await db
    .select({
      companyName: companyBriefings.companyName,
      segment: companyBriefings.segment,
      mission: companyBriefings.mission,
      values: companyBriefings.values,
      communicationTone: companyBriefings.communicationTone,
      targetAudience: companyBriefings.targetAudience,
      mainProducts: companyBriefings.mainProducts,
      additionalContext: companyBriefings.additionalContext,
    })
    .from(companyBriefings)
    .where(eq(companyBriefings.companyId, info.companyId));

  const companyAgents = await getCompanyAgents(info.companyId);

  const agentBriefingRows = await Promise.all(
    companyAgents.map(async (agent) => {
      const [ab] = await db
        .select({
          sectorContext: agentBriefings.sectorContext,
          specificInstructions: agentBriefings.specificInstructions,
          restrictedTopics: agentBriefings.restrictedTopics,
          preferredExamples: agentBriefings.preferredExamples,
          isComplete: agentBriefings.isComplete,
        })
        .from(agentBriefings)
        .where(eq(agentBriefings.agentId, agent.id));

      return {
        agentId: agent.id,
        agentType: agent.type,
        agentLabel: AGENT_LABELS[agent.type] ?? agent.type,
        customName: agent.customName,
        sectorContext: ab?.sectorContext ?? null,
        specificInstructions: ab?.specificInstructions ?? null,
        restrictedTopics: ab?.restrictedTopics ?? null,
        preferredExamples: ab?.preferredExamples ?? null,
        isComplete: ab?.isComplete ?? false,
      };
    })
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "0 24px", height: "52px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        <Link
          href="/configuracoes"
          style={{ display: "flex", alignItems: "center", gap: "6px", color: "#555", fontSize: "13px", textDecoration: "none" }}
        >
          <ArrowLeft style={{ width: "14px", height: "14px" }} strokeWidth={2} />
          Configurações
        </Link>
        <span style={{ color: "#2A2A2A" }}>/</span>
        <h1 style={{ color: "#EBEBEB", fontSize: "15px", fontWeight: 600, letterSpacing: "-0.02em", margin: 0 }}>
          Editar Briefings
        </h1>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <p style={{ color: "#555", fontSize: "14px", marginBottom: "28px", lineHeight: 1.6 }}>
            O briefing define o contexto e personalidade dos seus agentes. Edite os campos abaixo e salve para atualizar imediatamente o comportamento de todos os agentes.
          </p>

          <BriefingEditor
            companyBriefing={companyBriefingRow ?? null}
            agentBriefings={agentBriefingRows}
            canEditCompany={canEditCompany}
          />
        </div>
      </div>
    </div>
  );
}
