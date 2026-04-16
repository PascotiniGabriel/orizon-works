/**
 * Rate limiting baseado no banco de dados.
 * Não requer dependências externas (ex: Redis) — usa as tabelas existentes.
 */

import { db } from "@/lib/db";
import { uploads, messages, sessions } from "@/lib/db/schema";
import { eq, gt, and, count } from "drizzle-orm";

/** Máximo de mensagens de chat por usuário por minuto */
const CHAT_MAX_PER_MINUTE = 20;

/** Máximo de uploads por usuário por hora */
const UPLOAD_MAX_PER_HOUR = 15;

/**
 * Verifica se o usuário pode enviar mais mensagens de chat.
 * Retorna true se estiver dentro do limite, false se excedeu.
 */
export async function checkChatRateLimit(userId: string): Promise<boolean> {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

  const [result] = await db
    .select({ total: count() })
    .from(messages)
    .innerJoin(sessions, eq(messages.sessionId, sessions.id))
    .where(
      and(
        eq(sessions.userId, userId),
        eq(messages.role, "user"),
        gt(messages.createdAt, oneMinuteAgo)
      )
    );

  return (result?.total ?? 0) < CHAT_MAX_PER_MINUTE;
}

/**
 * Verifica se o usuário pode fazer mais uploads.
 * Retorna true se estiver dentro do limite, false se excedeu.
 */
export async function checkUploadRateLimit(userId: string): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const [result] = await db
    .select({ total: count() })
    .from(uploads)
    .where(
      and(
        eq(uploads.userId, userId),
        gt(uploads.createdAt, oneHourAgo)
      )
    );

  return (result?.total ?? 0) < UPLOAD_MAX_PER_HOUR;
}
