import { db } from "@/lib/db";
import { notifications, users, companies } from "@/lib/db/schema";
import { and, eq, gte, desc } from "drizzle-orm";
import { sendTokenWarningEmail, sendTokenBlockedEmail } from "@/lib/email";

const WARNING_THRESHOLD = 0.20; // 20% restante
const ALERT_COOLDOWN_HOURS = 12;

async function alertSentRecently(companyId: string, type: "token_warning" | "token_blocked"): Promise<boolean> {
  const since = new Date(Date.now() - ALERT_COOLDOWN_HOURS * 60 * 60 * 1000);
  const [row] = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(
        eq(notifications.companyId, companyId),
        eq(notifications.type, type),
        gte(notifications.createdAt, since)
      )
    )
    .limit(1);
  return !!row;
}

async function getAdminInfo(companyId: string): Promise<{ email: string; userId: string; companyName: string } | null> {
  const [row] = await db
    .select({
      email: users.email,
      userId: users.id,
      companyName: companies.name,
    })
    .from(users)
    .innerJoin(companies, eq(companies.id, users.companyId))
    .where(
      and(
        eq(users.companyId, companyId),
        eq(users.role, "company_admin"),
        eq(users.isActive, true)
      )
    )
    .orderBy(desc(users.createdAt))
    .limit(1);
  return row ?? null;
}

export async function maybeFireTokenAlerts(
  companyId: string,
  newBalance: number,
  tokenLimit: number
): Promise<void> {
  try {
    const percentRemaining = tokenLimit > 0 ? newBalance / tokenLimit : 0;

    if (newBalance <= 0) {
      const alreadySent = await alertSentRecently(companyId, "token_blocked");
      if (alreadySent) return;

      const admin = await getAdminInfo(companyId);
      if (!admin) return;

      await db.insert(notifications).values({
        companyId,
        userId: admin.userId,
        type: "token_blocked",
        title: "Tokens esgotados",
        message: "Seus tokens acabaram. Os agentes estão bloqueados. Adquira um Token Pack para continuar.",
      });

      await sendTokenBlockedEmail({ toEmail: admin.email, companyName: admin.companyName });

    } else if (percentRemaining <= WARNING_THRESHOLD) {
      const alreadySent = await alertSentRecently(companyId, "token_warning");
      if (alreadySent) return;

      const admin = await getAdminInfo(companyId);
      if (!admin) return;

      const pct = Math.round(percentRemaining * 100);

      await db.insert(notifications).values({
        companyId,
        userId: admin.userId,
        type: "token_warning",
        title: `Tokens abaixo de ${pct}%`,
        message: `Restam ${newBalance.toLocaleString("pt-BR")} tokens (${pct}% do limite). Recarregue para evitar interrupções.`,
      });

      await sendTokenWarningEmail({
        toEmail: admin.email,
        companyName: admin.companyName,
        tokenBalance: newBalance,
        tokenLimit,
        percentRemaining: pct,
      });
    }
  } catch {
    // Falha silenciosa — não interrompe o chat
  }
}
