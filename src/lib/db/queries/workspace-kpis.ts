import { db } from "@/lib/db";
import { workspaceKpis } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";

export type AgentType = "rh" | "comercial" | "marketing" | "financeiro" | "administrativo";

export interface KpiGoal {
  metricKey: string;
  metricLabel: string;
  targetValue: string;
  unit: string;
  period: string;
}

export async function getWorkspaceKpis(companyId: string, agentType: AgentType): Promise<KpiGoal[]> {
  const rows = await db
    .select({
      metricKey: workspaceKpis.metricKey,
      metricLabel: workspaceKpis.metricLabel,
      targetValue: workspaceKpis.targetValue,
      unit: workspaceKpis.unit,
      period: workspaceKpis.period,
    })
    .from(workspaceKpis)
    .where(
      and(
        eq(workspaceKpis.companyId, companyId),
        eq(workspaceKpis.agentType, agentType)
      )
    );

  return rows;
}

export async function upsertWorkspaceKpis(
  companyId: string,
  agentType: AgentType,
  goals: KpiGoal[],
  updatedBy: string
): Promise<void> {
  if (goals.length === 0) return;

  await db
    .insert(workspaceKpis)
    .values(
      goals.map((g) => ({
        companyId,
        agentType,
        metricKey: g.metricKey,
        metricLabel: g.metricLabel,
        targetValue: g.targetValue,
        unit: g.unit,
        period: g.period,
        updatedBy,
      }))
    )
    .onConflictDoUpdate({
      target: [workspaceKpis.companyId, workspaceKpis.agentType, workspaceKpis.metricKey],
      set: {
        targetValue: sql`excluded.target_value`,
        unit: sql`excluded.unit`,
        period: sql`excluded.period`,
        updatedAt: sql`NOW()`,
        updatedBy: sql`excluded.updated_by`,
      },
    });
}
