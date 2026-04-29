import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserCompanyInfo } from "@/lib/db/queries/company";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { and, eq, gte } from "drizzle-orm";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ activeAgentIds: [] });

    const info = await getUserCompanyInfo(user.id);
    if (!info) return NextResponse.json({ activeAgentIds: [] });

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const rows = await db
      .selectDistinct({ agentId: sessions.agentId })
      .from(sessions)
      .where(and(eq(sessions.companyId, info.companyId), gte(sessions.updatedAt, fiveMinutesAgo)));

    return NextResponse.json({ activeAgentIds: rows.map((r) => r.agentId) });
  } catch {
    return NextResponse.json({ activeAgentIds: [] });
  }
}
