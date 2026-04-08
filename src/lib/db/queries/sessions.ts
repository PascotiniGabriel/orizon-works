import { db } from "@/lib/db";
import { sessions, messages, agents, users } from "@/lib/db/schema";
import { eq, and, sql, desc, count } from "drizzle-orm";

export async function getOrCreateSession(
  companyId: string,
  userId: string,
  agentId: string,
  sessionId?: string
): Promise<string> {
  // Retomar sessão existente se fornecida
  if (sessionId) {
    const [existing] = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(
        and(
          eq(sessions.id, sessionId),
          eq(sessions.companyId, companyId),
          eq(sessions.userId, userId),
          eq(sessions.agentId, agentId),
          eq(sessions.isActive, true)
        )
      )
      .limit(1);

    if (existing) return existing.id;
  }

  // Criar nova sessão
  const [created] = await db
    .insert(sessions)
    .values({ companyId, userId, agentId })
    .returning({ id: sessions.id });

  return created.id;
}

export async function saveMessages(
  sessionId: string,
  companyId: string,
  userContent: string,
  assistantContent: string,
  tokensInput: number,
  tokensOutput: number,
  model: string
): Promise<void> {
  const tokensTotal = tokensInput + tokensOutput;

  await db.insert(messages).values([
    {
      sessionId,
      companyId,
      role: "user",
      content: userContent,
      tokensInput: 0,
      tokensOutput: 0,
      tokensTotal: 0,
      model,
    },
    {
      sessionId,
      companyId,
      role: "assistant",
      content: assistantContent,
      tokensInput,
      tokensOutput,
      tokensTotal,
      model,
    },
  ]);

  // Acumular tokens da sessão (não sobrescrever)
  await db
    .update(sessions)
    .set({
      tokensUsed: sql`${sessions.tokensUsed} + ${tokensTotal}`,
      updatedAt: new Date(),
    })
    .where(eq(sessions.id, sessionId));
}

export interface SessionHistoryItem {
  id: string;
  tokensUsed: number;
  createdAt: Date;
  updatedAt: Date;
  agentId: string;
  agentType: string;
  agentName: string | null;
  agentAvatarUrl: string | null;
  messageCount: number;
  userId: string;
  userName: string | null;
}

export async function getSessionsHistory(
  companyId: string,
  userId: string,
  role: string
): Promise<SessionHistoryItem[]> {
  // Admin e sector_manager veem todas as sessões da empresa
  // employee vê apenas as próprias
  const baseQuery = db
    .select({
      id: sessions.id,
      tokensUsed: sessions.tokensUsed,
      createdAt: sessions.createdAt,
      updatedAt: sessions.updatedAt,
      userId: sessions.userId,
      agentId: agents.id,
      agentType: agents.type,
      agentName: agents.customName,
      agentAvatarUrl: agents.avatarUrl,
      userName: users.fullName,
      messageCount: count(messages.id),
    })
    .from(sessions)
    .innerJoin(agents, eq(sessions.agentId, agents.id))
    .leftJoin(users, eq(sessions.userId, users.id))
    .leftJoin(messages, eq(messages.sessionId, sessions.id))
    .groupBy(
      sessions.id,
      sessions.tokensUsed,
      sessions.createdAt,
      sessions.updatedAt,
      sessions.userId,
      agents.id,
      agents.type,
      agents.customName,
      agents.avatarUrl,
      users.fullName
    )
    .orderBy(desc(sessions.updatedAt))
    .limit(100);

  if (role === "employee") {
    return baseQuery.where(
      and(eq(sessions.companyId, companyId), eq(sessions.userId, userId))
    );
  }

  return baseQuery.where(eq(sessions.companyId, companyId));
}

export interface SessionDetail {
  session: {
    id: string;
    tokensUsed: number;
    createdAt: Date;
    agentType: string;
    agentName: string | null;
    agentAvatarUrl: string | null;
    userName: string | null;
  };
  messages: {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    createdAt: Date;
  }[];
}

export async function getSessionDetail(
  sessionId: string,
  companyId: string,
  userId: string,
  role: string
): Promise<SessionDetail | null> {
  const conditions =
    role === "employee"
      ? and(
          eq(sessions.id, sessionId),
          eq(sessions.companyId, companyId),
          eq(sessions.userId, userId)
        )
      : and(eq(sessions.id, sessionId), eq(sessions.companyId, companyId));

  const [sessionRow] = await db
    .select({
      id: sessions.id,
      tokensUsed: sessions.tokensUsed,
      createdAt: sessions.createdAt,
      userId: sessions.userId,
      agentType: agents.type,
      agentName: agents.customName,
      agentAvatarUrl: agents.avatarUrl,
      userName: users.fullName,
    })
    .from(sessions)
    .innerJoin(agents, eq(sessions.agentId, agents.id))
    .leftJoin(users, eq(sessions.userId, users.id))
    .where(conditions!)
    .limit(1);

  if (!sessionRow) return null;

  const msgs = await db
    .select({
      id: messages.id,
      role: messages.role,
      content: messages.content,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(eq(messages.sessionId, sessionId))
    .orderBy(messages.createdAt);

  return {
    session: sessionRow,
    messages: msgs,
  };
}
