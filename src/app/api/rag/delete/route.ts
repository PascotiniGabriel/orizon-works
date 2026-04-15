import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users, ragDocuments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export const runtime = "nodejs";

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { documentId } = await req.json();
    if (!documentId) {
      return NextResponse.json({ error: "documentId obrigatório" }, { status: 400 });
    }

    // Verificar role: apenas admin e sector_manager podem deletar
    const [dbUser] = await db
      .select({ companyId: users.companyId, role: users.role })
      .from(users)
      .where(eq(users.id, user.id));

    if (!dbUser?.companyId) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    if (dbUser.role === "employee") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    // Deletar (CASCADE remove os chunks automaticamente)
    await db
      .delete(ragDocuments)
      .where(
        and(
          eq(ragDocuments.id, documentId),
          eq(ragDocuments.companyId, dbUser.companyId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro ao deletar documento RAG:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
