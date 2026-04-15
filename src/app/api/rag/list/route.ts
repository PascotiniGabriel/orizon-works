import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { listRagDocuments } from "@/lib/db/queries/rag";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const [dbUser] = await db
      .select({ companyId: users.companyId })
      .from(users)
      .where(eq(users.id, user.id));

    if (!dbUser?.companyId) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get("agentId") ?? undefined;

    const documents = await listRagDocuments(dbUser.companyId, agentId);

    return NextResponse.json({ documents });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
