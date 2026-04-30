"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUserCompanyInfo } from "@/lib/db/queries/company";
import { db } from "@/lib/db";
import { agentTasks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function createAgentTask(agentId: string, title: string, dueDate: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const info = await getUserCompanyInfo(user.id);
  if (!info) return { error: "Company not found" };

  await db.insert(agentTasks).values({
    agentId,
    companyId: info.companyId,
    userId: info.userId,
    title: title.trim(),
    dueDate: dueDate || null,
    status: "pending",
  });

  revalidatePath("/escritorio");
  return { ok: true };
}

export async function markTaskDone(taskId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const info = await getUserCompanyInfo(user.id);
  if (!info) return { error: "Company not found" };

  await db
    .update(agentTasks)
    .set({ status: "done" })
    .where(and(eq(agentTasks.id, taskId), eq(agentTasks.companyId, info.companyId)));

  revalidatePath("/escritorio");
  return { ok: true };
}
