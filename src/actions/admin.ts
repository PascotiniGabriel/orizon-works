"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { companies } from "@/lib/db/schema";
import { getUserCompanyInfo } from "@/lib/db/queries/company";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function requireSuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const info = await getUserCompanyInfo(user.id);
  if (!info || info.role !== "super_admin") return null;
  return info;
}

export async function adminSetCompanyPlan(
  companyId: string,
  plan: string,
  tokenLimit: number,
  maxAgents: number
): Promise<{ success: boolean; error?: string }> {
  const info = await requireSuperAdmin();
  if (!info) return { success: false, error: "Sem permissão" };

  const VALID_PLANS = ["trial", "starter", "growth", "business", "enterprise"];
  if (!VALID_PLANS.includes(plan)) return { success: false, error: "Plano inválido" };
  if (tokenLimit < 0 || maxAgents < 1 || maxAgents > 10) return { success: false, error: "Limites inválidos" };

  await db
    .update(companies)
    .set({
      plan: plan as "trial" | "starter" | "growth" | "business" | "enterprise",
      tokenLimit,
      maxAgents,
      updatedAt: new Date(),
    })
    .where(eq(companies.id, companyId));

  revalidatePath("/admin");
  return { success: true };
}

export async function adminAddTokens(
  companyId: string,
  tokensToAdd: number
): Promise<{ success: boolean; error?: string }> {
  const info = await requireSuperAdmin();
  if (!info) return { success: false, error: "Sem permissão" };

  if (tokensToAdd <= 0 || tokensToAdd > 100_000_000) return { success: false, error: "Quantidade inválida" };

  await db
    .update(companies)
    .set({
      tokenBalance: sql`${companies.tokenBalance} + ${tokensToAdd}`,
      tokenLimit: sql`${companies.tokenLimit} + ${tokensToAdd}`,
      updatedAt: new Date(),
    })
    .where(eq(companies.id, companyId));

  revalidatePath("/admin");
  return { success: true };
}

export async function adminSetSubscriptionStatus(
  companyId: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  const info = await requireSuperAdmin();
  if (!info) return { success: false, error: "Sem permissão" };

  const VALID_STATUSES = ["trialing", "active", "past_due", "canceled", "unpaid"];
  if (!VALID_STATUSES.includes(status)) return { success: false, error: "Status inválido" };

  await db
    .update(companies)
    .set({
      subscriptionStatus: status as "trialing" | "active" | "past_due" | "canceled" | "unpaid",
      updatedAt: new Date(),
    })
    .where(eq(companies.id, companyId));

  revalidatePath("/admin");
  return { success: true };
}
