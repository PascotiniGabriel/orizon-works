import { db } from "@/lib/db";
import { companies } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export type TokenStatus = "available" | "warning" | "blocked";

export interface TokenBalance {
  balance: number;
  used: number;
  limit: number;
  status: TokenStatus;
  percentUsed: number;
}

function resolveStatus(balance: number, used: number, limit: number): TokenStatus {
  if (balance <= 0) return "blocked";
  const percentUsed = limit > 0 ? (used / limit) * 100 : 100;
  if (percentUsed >= 80) return "warning";
  return "available";
}

export async function getTokenStatus(companyId: string): Promise<TokenBalance | null> {
  const [company] = await db
    .select({
      tokenBalance: companies.tokenBalance,
      tokenUsed: companies.tokenUsed,
      tokenLimit: companies.tokenLimit,
    })
    .from(companies)
    .where(eq(companies.id, companyId));

  if (!company) return null;

  const percentUsed =
    company.tokenLimit > 0 ? (company.tokenUsed / company.tokenLimit) * 100 : 100;

  return {
    balance: company.tokenBalance,
    used: company.tokenUsed,
    limit: company.tokenLimit,
    status: resolveStatus(company.tokenBalance, company.tokenUsed, company.tokenLimit),
    percentUsed,
  };
}

export async function checkTokenBalance(companyId: string, required: number): Promise<boolean> {
  const [company] = await db
    .select({ tokenBalance: companies.tokenBalance })
    .from(companies)
    .where(eq(companies.id, companyId));

  return (company?.tokenBalance ?? 0) >= required;
}

export async function debitTokens(
  companyId: string,
  amount: number
): Promise<{ success: boolean; newBalance: number; newUsed: number; tokenLimit: number; status: TokenStatus }> {
  const [updated] = await db
    .update(companies)
    .set({
      tokenBalance: sql`GREATEST(${companies.tokenBalance} - ${amount}, 0)`,
      tokenUsed: sql`${companies.tokenUsed} + ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(companies.id, companyId))
    .returning({
      tokenBalance: companies.tokenBalance,
      tokenUsed: companies.tokenUsed,
      tokenLimit: companies.tokenLimit,
    });

  if (!updated) {
    return { success: false, newBalance: 0, newUsed: 0, tokenLimit: 0, status: "blocked" };
  }

  return {
    success: true,
    newBalance: updated.tokenBalance,
    newUsed: updated.tokenUsed,
    tokenLimit: updated.tokenLimit,
    status: resolveStatus(updated.tokenBalance, updated.tokenUsed, updated.tokenLimit),
  };
}
