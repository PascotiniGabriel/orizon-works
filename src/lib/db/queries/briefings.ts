import { db } from "@/lib/db";
import { dailyBriefings } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export type DailyBriefingCard = {
  id: string;
  focoDoDia: string;
  dicaRapida: string;
  perguntaDoDia: string;
};

export async function getTodayBriefing(agentId: string): Promise<DailyBriefingCard | null> {
  const today = new Date().toISOString().slice(0, 10);
  const [row] = await db
    .select({
      id: dailyBriefings.id,
      focoDoDia: dailyBriefings.focoDoDia,
      dicaRapida: dailyBriefings.dicaRapida,
      perguntaDoDia: dailyBriefings.perguntaDoDia,
    })
    .from(dailyBriefings)
    .where(and(
      eq(dailyBriefings.agentId, agentId),
      eq(dailyBriefings.date, today),
    ))
    .limit(1);
  return row ?? null;
}
