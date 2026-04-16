"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users, agents } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export type AgentType = "rh" | "marketing" | "comercial" | "financeiro" | "administrativo";

export interface CreateAgentResult {
  success: boolean;
  agentId?: string;
  message: string;
}

export async function createAgent(
  type: AgentType,
  customName: string,
  avatarUrl: string
): Promise<CreateAgentResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Não autenticado." };
  }

  const [dbUser] = await db
    .select({ companyId: users.companyId })
    .from(users)
    .where(eq(users.id, user.id));

  if (!dbUser?.companyId) {
    return { success: false, message: "Empresa não encontrada." };
  }

  const companyId = dbUser.companyId;

  // Verificar se já existe agente desse tipo para essa empresa
  const [existing] = await db
    .select({ id: agents.id })
    .from(agents)
    .where(and(eq(agents.companyId, companyId), eq(agents.type, type)));

  if (existing) {
    // Reutilizar agente existente se já criado (idempotente)
    return { success: true, agentId: existing.id, message: "Agente já existe." };
  }

  const [agent] = await db
    .insert(agents)
    .values({
      companyId,
      type,
      customName: customName.trim() || null,
      avatarUrl: avatarUrl || null,
    })
    .returning({ id: agents.id });

  return { success: true, agentId: agent.id, message: "Agente criado com sucesso." };
}
