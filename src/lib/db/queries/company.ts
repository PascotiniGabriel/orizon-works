import { db } from "@/lib/db";
import { agents, agentBriefings, users, companies, invites } from "@/lib/db/schema";
import { and, eq, or } from "drizzle-orm";

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
  managedAgentType: string | null;
  tokenBalance: number;
  tokenLimit: number;
  onboardingCompleted: boolean;
  maxAgents: number;
  hourlyRate: string;
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

export interface InviteSummary {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: Date;
  expiresAt: Date;
}

export async function getCompanyInvites(companyId: string): Promise<InviteSummary[]> {
  const rows = await db
    .select({
      id: invites.id,
      email: invites.email,
      role: invites.role,
      status: invites.status,
      createdAt: invites.createdAt,
      expiresAt: invites.expiresAt,
    })
    .from(invites)
    .where(
      and(
        eq(invites.companyId, companyId),
        or(eq(invites.status, "pending"), eq(invites.status, "expired"))
      )
    )
    .orderBy(invites.createdAt);

  return rows as InviteSummary[];
}

export async function getUserCompanyInfo(userId: string): Promise<UserCompanyInfo | null> {
  const [row] = await db
    .select({
      userId: users.id,
      companyId: companies.id,
      companyName: companies.name,
      fullName: users.fullName,
      role: users.role,
      managedAgentType: users.managedAgentType,
      tokenBalance: companies.tokenBalance,
      tokenLimit: companies.tokenLimit,
      onboardingCompleted: companies.onboardingCompleted,
      maxAgents: companies.maxAgents,
      hourlyRate: companies.hourlyRate,
    })
    .from(users)
    .innerJoin(companies, eq(companies.id, users.companyId))
    .where(eq(users.id, userId));

  return row ?? null;
}
