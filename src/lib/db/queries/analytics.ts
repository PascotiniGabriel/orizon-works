import { db } from "@/lib/db";
import { sessions, messages, agents, users, ragDocuments, agentTasks } from "@/lib/db/schema";
import { eq, and, gte, lt, sql, count } from "drizzle-orm";

function monthRange(year: number, month: number) {
  return {
    start: new Date(year, month - 1, 1),
    end: new Date(year, month, 1),
  };
}

export interface AgentUsageItem {
  agentId: string;
  agentType: string;
  agentName: string | null;
  sessions: number;
  tokens: number;
}

export interface MonthlyAnalytics {
  totalSessions: number;
  totalMessages: number;
  totalTokensUsed: number;
  ragDocumentsCount: number;
  tasksCreated: number;
  agentUsage: AgentUsageItem[];
  prevMonthSessions: number;
}

export async function getMonthlyAnalytics(
  companyId: string,
  year: number,
  month: number
): Promise<MonthlyAnalytics> {
  const { start, end } = monthRange(year, month);
  const prev = monthRange(year, month - 1);

  const [sessRow, msgRow, tokenRow, ragRow, tasksRow, prevSessRow, agentRows] = await Promise.all([
    db.select({ count: count() })
      .from(sessions)
      .where(and(eq(sessions.companyId, companyId), gte(sessions.createdAt, start), lt(sessions.createdAt, end))),

    db.select({ count: count() })
      .from(messages)
      .where(and(eq(messages.companyId, companyId), gte(messages.createdAt, start), lt(messages.createdAt, end))),

    db.select({ total: sql<number>`COALESCE(SUM(${sessions.tokensUsed}), 0)` })
      .from(sessions)
      .where(and(eq(sessions.companyId, companyId), gte(sessions.createdAt, start), lt(sessions.createdAt, end))),

    db.select({ count: count() })
      .from(ragDocuments)
      .where(eq(ragDocuments.companyId, companyId)),

    db.select({ count: count() })
      .from(agentTasks)
      .where(and(eq(agentTasks.companyId, companyId), gte(agentTasks.createdAt, start), lt(agentTasks.createdAt, end))),

    db.select({ count: count() })
      .from(sessions)
      .where(and(eq(sessions.companyId, companyId), gte(sessions.createdAt, prev.start), lt(sessions.createdAt, prev.end))),

    db.select({
      agentId: agents.id,
      agentType: agents.type,
      agentName: agents.customName,
      sessCount: count(sessions.id),
      tokenSum: sql<number>`COALESCE(SUM(${sessions.tokensUsed}), 0)`,
    })
    .from(agents)
    .leftJoin(sessions, and(
      eq(sessions.agentId, agents.id),
      gte(sessions.createdAt, start),
      lt(sessions.createdAt, end)
    ))
    .where(eq(agents.companyId, companyId))
    .groupBy(agents.id, agents.type, agents.customName)
    .orderBy(sql`COUNT(${sessions.id}) DESC`),
  ]);

  return {
    totalSessions: sessRow[0]?.count ?? 0,
    totalMessages: msgRow[0]?.count ?? 0,
    totalTokensUsed: Number(tokenRow[0]?.total ?? 0),
    ragDocumentsCount: ragRow[0]?.count ?? 0,
    tasksCreated: tasksRow[0]?.count ?? 0,
    agentUsage: agentRows.map((r) => ({
      agentId: r.agentId,
      agentType: r.agentType,
      agentName: r.agentName,
      sessions: r.sessCount,
      tokens: Number(r.tokenSum ?? 0),
    })),
    prevMonthSessions: prevSessRow[0]?.count ?? 0,
  };
}

export interface DailyPoint { day: number; sessions: number }

export async function getDailyActivity(
  companyId: string,
  year: number,
  month: number
): Promise<DailyPoint[]> {
  const { start, end } = monthRange(year, month);

  const rows = await db.select({
    day: sql<number>`EXTRACT(DAY FROM ${sessions.createdAt})::int`,
    sessCount: count(),
  })
  .from(sessions)
  .where(and(eq(sessions.companyId, companyId), gte(sessions.createdAt, start), lt(sessions.createdAt, end)))
  .groupBy(sql`EXTRACT(DAY FROM ${sessions.createdAt})`)
  .orderBy(sql`EXTRACT(DAY FROM ${sessions.createdAt})`);

  const daysInMonth = new Date(year, month, 0).getDate();
  const dayMap = new Map(rows.map((r) => [Number(r.day), r.sessCount]));
  return Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    sessions: dayMap.get(i + 1) ?? 0,
  }));
}

export interface MonthHistory {
  year: number;
  month: number;
  sessions: number;
  tokensUsed: number;
}

export async function getSixMonthHistory(companyId: string): Promise<MonthHistory[]> {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const rows = await db.select({
    yr: sql<number>`EXTRACT(YEAR FROM ${sessions.createdAt})::int`,
    mo: sql<number>`EXTRACT(MONTH FROM ${sessions.createdAt})::int`,
    sessCount: count(),
    tokenSum: sql<number>`COALESCE(SUM(${sessions.tokensUsed}), 0)`,
  })
  .from(sessions)
  .where(and(eq(sessions.companyId, companyId), gte(sessions.createdAt, sixMonthsAgo)))
  .groupBy(
    sql`EXTRACT(YEAR FROM ${sessions.createdAt})`,
    sql`EXTRACT(MONTH FROM ${sessions.createdAt})`
  )
  .orderBy(
    sql`EXTRACT(YEAR FROM ${sessions.createdAt})`,
    sql`EXTRACT(MONTH FROM ${sessions.createdAt})`
  );

  const result: MonthHistory[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const found = rows.find((r) => Number(r.yr) === y && Number(r.mo) === m);
    result.push({
      year: y,
      month: m,
      sessions: found?.sessCount ?? 0,
      tokensUsed: Number(found?.tokenSum ?? 0),
    });
  }
  return result;
}

export interface TopUser {
  userId: string;
  fullName: string | null;
  email: string;
  sessions: number;
}

export async function getTopUsers(
  companyId: string,
  year: number,
  month: number
): Promise<TopUser[]> {
  const { start, end } = monthRange(year, month);

  const rows = await db.select({
    userId: users.id,
    fullName: users.fullName,
    email: users.email,
    sessCount: count(sessions.id),
  })
  .from(users)
  .leftJoin(sessions, and(
    eq(sessions.userId, users.id),
    gte(sessions.createdAt, start),
    lt(sessions.createdAt, end)
  ))
  .where(eq(users.companyId, companyId))
  .groupBy(users.id, users.fullName, users.email)
  .orderBy(sql`COUNT(${sessions.id}) DESC`)
  .limit(3);

  return rows.map((r) => ({
    userId: r.userId,
    fullName: r.fullName,
    email: r.email,
    sessions: r.sessCount,
  }));
}
