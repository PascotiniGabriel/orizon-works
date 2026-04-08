"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users, notifications } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  checkTokenBalance,
  debitTokens,
  type TokenStatus,
} from "@/lib/db/queries/tokens";

export interface DebitResult {
  success: boolean;
  blocked: boolean;
  status: TokenStatus;
  newBalance?: number;
}

export async function checkAndDebit(amount: number): Promise<DebitResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, blocked: false, status: "available" };
  }

  const [dbUser] = await db
    .select({ companyId: users.companyId })
    .from(users)
    .where(eq(users.id, user.id));

  if (!dbUser?.companyId) {
    return { success: false, blocked: false, status: "available" };
  }

  const companyId = dbUser.companyId;

  const hasBalance = await checkTokenBalance(companyId, amount);
  if (!hasBalance) {
    return { success: false, blocked: true, status: "blocked" };
  }

  const result = await debitTokens(companyId, amount);

  if (result.status === "warning") {
    await createWarningNotificationIfNeeded(companyId, user.id, result.newBalance);
  }

  if (result.status === "blocked") {
    await db.insert(notifications).values({
      companyId,
      userId: user.id,
      type: "token_blocked",
      title: "Uso de IA bloqueado — tokens esgotados",
      message:
        "Sua empresa esgotou todos os tokens disponíveis. Adquira um Token Pack para retomar o uso dos agentes.",
    });
  }

  return {
    success: true,
    blocked: false,
    status: result.status,
    newBalance: result.newBalance,
  };
}

async function createWarningNotificationIfNeeded(
  companyId: string,
  userId: string,
  balance: number
) {
  const [existing] = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(
        eq(notifications.companyId, companyId),
        eq(notifications.type, "token_warning"),
        eq(notifications.isRead, false)
      )
    )
    .limit(1);

  if (existing) return;

  await db.insert(notifications).values({
    companyId,
    userId,
    type: "token_warning",
    title: "Atenção: tokens chegando ao limite",
    message: `Sua empresa está com menos de 20% dos tokens disponíveis (${balance.toLocaleString("pt-BR")} restantes). Considere adquirir um Token Pack.`,
  });
}
