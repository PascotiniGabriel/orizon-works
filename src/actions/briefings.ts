"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { companyBriefings, agentBriefings, agents, users } from "@/lib/db/schema";
import { getUserCompanyInfo } from "@/lib/db/queries/company";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface CompanyBriefingInput {
  companyName: string;
  segment: string;
  mission: string;
  values: string;
  communicationTone: string;
  targetAudience: string;
  mainProducts: string;
  additionalContext: string;
}

export interface AgentBriefingInput {
  sectorContext: string;
  specificInstructions: string;
  restrictedTopics: string;
  preferredExamples: string;
  customName: string;
}

export async function updateCompanyBriefing(
  input: CompanyBriefingInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autenticado." };

  const info = await getUserCompanyInfo(user.id);
  if (!info) return { success: false, error: "Empresa não encontrada." };

  if (info.role !== "company_admin" && info.role !== "super_admin") {
    return { success: false, error: "Sem permissão para editar briefing da empresa." };
  }

  await db
    .update(companyBriefings)
    .set({
      companyName: input.companyName.trim() || null,
      segment: input.segment.trim() || null,
      mission: input.mission.trim() || null,
      values: input.values.trim() || null,
      communicationTone: input.communicationTone.trim() || null,
      targetAudience: input.targetAudience.trim() || null,
      mainProducts: input.mainProducts.trim() || null,
      additionalContext: input.additionalContext.trim() || null,
      compiledPrompt: null,
      updatedAt: new Date(),
    })
    .where(eq(companyBriefings.companyId, info.companyId));

  revalidatePath("/configuracoes/briefing");
  return { success: true };
}

export async function updateAgentBriefing(
  agentId: string,
  input: AgentBriefingInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autenticado." };

  const info = await getUserCompanyInfo(user.id);
  if (!info) return { success: false, error: "Empresa não encontrada." };

  const canEdit =
    info.role === "company_admin" ||
    info.role === "super_admin" ||
    (info.role === "sector_manager" && info.managedAgentType !== null);

  if (!canEdit) return { success: false, error: "Sem permissão." };

  const [dbUser] = await db
    .select({ managedAgentType: users.managedAgentType })
    .from(users)
    .where(eq(users.id, user.id));

  const [agent] = await db
    .select({ id: agents.id, type: agents.type, companyId: agents.companyId })
    .from(agents)
    .where(and(eq(agents.id, agentId), eq(agents.companyId, info.companyId)));

  if (!agent) return { success: false, error: "Agente não encontrado." };

  if (info.role === "sector_manager" && dbUser?.managedAgentType !== agent.type) {
    return { success: false, error: "Você só pode editar o setor que gerencia." };
  }

  await db
    .update(agents)
    .set({
      customName: input.customName.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(agents.id, agentId));

  const [existing] = await db
    .select({ id: agentBriefings.id })
    .from(agentBriefings)
    .where(eq(agentBriefings.agentId, agentId));

  if (existing) {
    await db
      .update(agentBriefings)
      .set({
        sectorContext: input.sectorContext.trim() || null,
        specificInstructions: input.specificInstructions.trim() || null,
        restrictedTopics: input.restrictedTopics.trim() || null,
        preferredExamples: input.preferredExamples.trim() || null,
        compiledPrompt: null,
        updatedAt: new Date(),
      })
      .where(eq(agentBriefings.agentId, agentId));
  } else {
    await db.insert(agentBriefings).values({
      agentId,
      companyId: info.companyId,
      sectorContext: input.sectorContext.trim() || null,
      specificInstructions: input.specificInstructions.trim() || null,
      restrictedTopics: input.restrictedTopics.trim() || null,
      preferredExamples: input.preferredExamples.trim() || null,
      compiledPrompt: null,
      isComplete: true,
    });
  }

  revalidatePath("/configuracoes/briefing");
  return { success: true };
}
