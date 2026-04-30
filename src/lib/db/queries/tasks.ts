import { db } from "@/lib/db";
import { agentTasks } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";

export type AgentTaskRow = {
  id: string;
  title: string;
  dueDate: string | null;
  status: "pending" | "done";
  createdAt: Date;
};

export async function getPendingTasks(companyId: string): Promise<AgentTaskRow[]> {
  return db
    .select({
      id: agentTasks.id,
      title: agentTasks.title,
      dueDate: agentTasks.dueDate,
      status: agentTasks.status,
      createdAt: agentTasks.createdAt,
    })
    .from(agentTasks)
    .where(and(
      eq(agentTasks.companyId, companyId),
      eq(agentTasks.status, "pending"),
    ))
    .orderBy(asc(agentTasks.createdAt))
    .limit(10) as Promise<AgentTaskRow[]>;
}
