"use server";

import { createClient } from "@/lib/supabase/server";
import { getUserCompanyInfo } from "@/lib/db/queries/company";
import { getWorkspaceKpis, upsertWorkspaceKpis, type AgentType, type KpiGoal } from "@/lib/db/queries/workspace-kpis";

export async function loadWorkspaceGoals(agentType: string): Promise<{ goals: KpiGoal[] }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { goals: [] };

  const info = await getUserCompanyInfo(user.id);
  if (!info) return { goals: [] };

  const goals = await getWorkspaceKpis(info.companyId, agentType as AgentType);
  return { goals };
}

export async function saveWorkspaceGoals(
  agentType: string,
  goals: KpiGoal[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autenticado" };

  const info = await getUserCompanyInfo(user.id);
  if (!info) return { success: false, error: "Empresa não encontrada" };

  if (!["company_admin", "sector_manager"].includes(info.role)) {
    return { success: false, error: "Sem permissão" };
  }

  try {
    await upsertWorkspaceKpis(info.companyId, agentType as AgentType, goals, user.id);
    return { success: true };
  } catch (e) {
    console.error("saveWorkspaceGoals:", e);
    return { success: false, error: "Erro ao salvar metas" };
  }
}
