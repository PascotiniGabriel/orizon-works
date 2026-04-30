"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { companies } from "@/lib/db/schema";
import { getUserCompanyInfo } from "@/lib/db/queries/company";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateHourlyRate(
  hourlyRate: number
): Promise<{ success: boolean; error?: string }> {
  if (hourlyRate < 1 || hourlyRate > 9999) {
    return { success: false, error: "Valor inválido (R$1 – R$9.999)" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Não autenticado" };

  const info = await getUserCompanyInfo(user.id);
  if (!info) return { success: false, error: "Empresa não encontrada" };

  const isAdmin = info.role === "company_admin" || info.role === "super_admin";
  if (!isAdmin) return { success: false, error: "Sem permissão" };

  await db
    .update(companies)
    .set({ hourlyRate: String(hourlyRate), updatedAt: new Date() })
    .where(eq(companies.id, info.companyId));

  revalidatePath("/configuracoes");
  revalidatePath("/analytics");

  return { success: true };
}
