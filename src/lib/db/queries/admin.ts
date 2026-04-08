import { db } from "@/lib/db";
import {
  companies,
  users,
  sessions,
  messages,
  agents,
  notifications,
} from "@/lib/db/schema";
import { eq, desc, sql, count, and, gte } from "drizzle-orm";

// ============================================================
// PAINEL ADMIN DA EMPRESA
// ============================================================

export interface CompanyStats {
  totalSessions: number;
  totalMessages: number;
  totalTokensUsed: number;
  tokenBalance: number;
  tokenLimit: number;
  activeUsers: number;
  agentStats: { agentName: string; agentType: string; sessions: number; tokens: number }[];
}

export async function getCompanyStats(companyId: string): Promise<CompanyStats> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [companyRow] = await db
    .select({ tokenBalance: companies.tokenBalance, tokenLimit: companies.tokenLimit })
    .from(companies)
    .where(eq(companies.id, companyId));

  const [sessionCount] = await db
    .select({ count: count() })
    .from(sessions)
    .where(and(eq(sessions.companyId, companyId), gte(sessions.createdAt, thirtyDaysAgo)));

  const [messageCount] = await db
    .select({ count: count() })
    .from(messages)
    .where(and(eq(messages.companyId, companyId), gte(messages.createdAt, thirtyDaysAgo)));

  const [tokenSum] = await db
    .select({ total: sql<number>`COALESCE(SUM(${sessions.tokensUsed}), 0)` })
    .from(sessions)
    .where(and(eq(sessions.companyId, companyId), gte(sessions.createdAt, thirtyDaysAgo)));

  const [userCount] = await db
    .select({ count: count() })
    .from(users)
    .where(and(eq(users.companyId, companyId), eq(users.isActive, true)));

  const agentRows = await db
    .select({
      agentName: agents.customName,
      agentType: agents.type,
      sessions: count(sessions.id),
      tokens: sql<number>`COALESCE(SUM(${sessions.tokensUsed}), 0)`,
    })
    .from(agents)
    .leftJoin(sessions, and(eq(sessions.agentId, agents.id), gte(sessions.createdAt, thirtyDaysAgo)))
    .where(eq(agents.companyId, companyId))
    .groupBy(agents.id, agents.customName, agents.type);

  return {
    totalSessions: sessionCount?.count ?? 0,
    totalMessages: messageCount?.count ?? 0,
    totalTokensUsed: tokenSum?.total ?? 0,
    tokenBalance: companyRow?.tokenBalance ?? 0,
    tokenLimit: companyRow?.tokenLimit ?? 1,
    activeUsers: userCount?.count ?? 0,
    agentStats: agentRows.map((r) => ({
      agentName: r.agentName ?? r.agentType,
      agentType: r.agentType,
      sessions: r.sessions,
      tokens: r.tokens,
    })),
  };
}

export interface UserActivity {
  id: string;
  fullName: string | null;
  email: string;
  role: string;
  lastSeenAt: Date | null;
  sessionCount: number;
}

export async function getCompanyUsers(companyId: string): Promise<UserActivity[]> {
  const rows = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      role: users.role,
      lastSeenAt: users.lastSeenAt,
      sessionCount: count(sessions.id),
    })
    .from(users)
    .leftJoin(sessions, eq(sessions.userId, users.id))
    .where(and(eq(users.companyId, companyId), eq(users.isActive, true)))
    .groupBy(users.id, users.fullName, users.email, users.role, users.lastSeenAt)
    .orderBy(desc(users.lastSeenAt));

  return rows;
}

// ============================================================
// NOTIFICAÇÕES
// ============================================================

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export async function getUnreadNotifications(
  companyId: string,
  userId: string
): Promise<NotificationItem[]> {
  return db
    .select({
      id: notifications.id,
      type: notifications.type,
      title: notifications.title,
      message: notifications.message,
      isRead: notifications.isRead,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .where(
      and(
        eq(notifications.companyId, companyId),
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      )
    )
    .orderBy(desc(notifications.createdAt))
    .limit(20);
}

export async function markNotificationsRead(
  notificationIds: string[]
): Promise<void> {
  if (notificationIds.length === 0) return;
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(sql`${notifications.id} = ANY(${notificationIds})`);
}

// ============================================================
// SUPER ADMIN
// ============================================================

export interface PlatformStats {
  totalCompanies: number;
  totalActiveCompanies: number;
  totalTrialCompanies: number;
  totalUsers: number;
  mrr: number;
  totalTokensConsumed: number;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const [companyCounts] = await db
    .select({
      total: count(),
      active: sql<number>`COUNT(*) FILTER (WHERE ${companies.subscriptionStatus} = 'active')`,
      trial: sql<number>`COUNT(*) FILTER (WHERE ${companies.subscriptionStatus} = 'trialing')`,
    })
    .from(companies);

  const [userCount] = await db.select({ count: count() }).from(users);

  const [tokenSum] = await db
    .select({ total: sql<number>`COALESCE(SUM(${companies.tokenUsed}), 0)` })
    .from(companies);

  // MRR estimado (R$ 197 starter / R$ 697 growth / R$ 1497 business)
  const [mrrRow] = await db
    .select({
      mrr: sql<number>`
        COALESCE(SUM(
          CASE
            WHEN ${companies.plan} = 'starter' THEN 197
            WHEN ${companies.plan} = 'growth' THEN 697
            WHEN ${companies.plan} = 'business' THEN 1497
            ELSE 0
          END
        ) FILTER (WHERE ${companies.subscriptionStatus} = 'active'), 0)
      `,
    })
    .from(companies);

  return {
    totalCompanies: companyCounts?.total ?? 0,
    totalActiveCompanies: Number(companyCounts?.active ?? 0),
    totalTrialCompanies: Number(companyCounts?.trial ?? 0),
    totalUsers: userCount?.count ?? 0,
    mrr: mrrRow?.mrr ?? 0,
    totalTokensConsumed: tokenSum?.total ?? 0,
  };
}

export interface CompanyListItem {
  id: string;
  name: string;
  plan: string;
  subscriptionStatus: string;
  tokenBalance: number;
  tokenLimit: number;
  createdAt: Date;
  userCount: number;
}

export async function getAllCompanies(): Promise<CompanyListItem[]> {
  const rows = await db
    .select({
      id: companies.id,
      name: companies.name,
      plan: companies.plan,
      subscriptionStatus: companies.subscriptionStatus,
      tokenBalance: companies.tokenBalance,
      tokenLimit: companies.tokenLimit,
      createdAt: companies.createdAt,
      userCount: count(users.id),
    })
    .from(companies)
    .leftJoin(users, eq(users.companyId, companies.id))
    .groupBy(
      companies.id,
      companies.name,
      companies.plan,
      companies.subscriptionStatus,
      companies.tokenBalance,
      companies.tokenLimit,
      companies.createdAt
    )
    .orderBy(desc(companies.createdAt));

  return rows;
}
