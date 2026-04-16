import { db } from "@/lib/db";
import { agents, agentBriefings, users, companies } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export interface AgentSummary {
  id: string;
  type: string;
  customName: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  briefingComplete: boolean;
}

export interface UserCompanyInfo {
  userId: string;
  companyId: string;
  companyName: string;
  fullName: string | null;
  role: string;
  tokenBalance: number;
  tokenLimit: number;
  onboardingCompleted: boolean;
}

export async function getCompanyAgents(companyId: string): Promise<AgentSummary[]> {
  const rows = await db
    .select({
      id: agents.id,
      type: agents.type,
      customName: agents.customName,
      avatarUrl: agents.avatarUrl,
      isActive: agents.isActive,
      briefingComplete: agentBriefings.isComplete,
    })
    .from(agents)
    .leftJoin(agentBriefings, eq(agentBriefings.agentId, agents.id))
    .where(eq(agents.companyId, companyId));

  return rows.map((r) => ({
    ...r,
    briefingComplete: r.briefingComplete ?? false,
  }));
}

export async function getUserCompanyInfo(userId: string): Promise<UserCompanyInfo | null> {
  const [row] = await db
    .select({
      userId: users.id,
      companyId: companies.id,
      companyName: companies.name,
      fullName: users.fullName,
      role: users.role,
      tokenBalance: companies.tokenBalance,
      tokenLimit: companies.tokenLimit,
      onboardingCompleted: companies.onboardingCompleted,
    })
    .from(users)
    .innerJoin(companies, eq(companies.id, users.companyId))
    .where(eq(users.id, userId));

  return row ?? null;
}
