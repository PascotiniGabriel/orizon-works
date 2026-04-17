"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getUserCompanyInfo } from "@/lib/db/queries/company";
import { eq, and } from "drizzle-orm";

type AgentType = "rh" | "marketing" | "comercial" | "financeiro" | "administrativo";

export async function updateUserManagedAgent(
  targetUserId: string,
  managedAgentType: string | null
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Não autorizado" };

  const info = await getUserCompanyInfo(user.id);
  if (!info) return { success: false, error: "Empresa não encontrada" };

  if (info.role !== "company_admin" && info.role !== "super_admin") {
    return { success: false, error: "Sem permissão" };
  }

  const [targetUser] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(and(eq(users.id, targetUserId), eq(users.companyId, info.companyId)))
    .limit(1);

  if (!targetUser) return { success: false, error: "Usuário não encontrado" };
  if (targetUser.role !== "sector_manager") {
    return { success: false, error: "Apenas Responsáveis de Setor podem ter setor atribuído" };
  }

  await db
    .update(users)
    .set({ managedAgentType: (managedAgentType as AgentType) ?? null })
    .where(eq(users.id, targetUserId));

  return { success: true };
}
