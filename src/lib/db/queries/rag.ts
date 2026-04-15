import { db } from "@/lib/db";
import { ragDocuments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Verifica rapidamente se a empresa tem documentos RAG prontos.
 * Evita disparar a busca vetorial quando não há documentos.
 */
export async function checkCompanyHasRagDocuments(companyId: string): Promise<boolean> {
  const result = await db
    .select({ id: ragDocuments.id })
    .from(ragDocuments)
    .where(
      and(
        eq(ragDocuments.companyId, companyId),
        eq(ragDocuments.status, "ready")
      )
    )
    .limit(1);

  return result.length > 0;
}

/** Lista documentos RAG de uma empresa, opcionalmente filtrado por agente */
export async function listRagDocuments(companyId: string, agentId?: string) {
  const conditions = agentId
    ? and(eq(ragDocuments.companyId, companyId), eq(ragDocuments.agentId, agentId))
    : eq(ragDocuments.companyId, companyId);

  return db
    .select()
    .from(ragDocuments)
    .where(conditions)
    .orderBy(ragDocuments.createdAt);
}

/** Remove documento e seus chunks (CASCADE na FK elimina os chunks automaticamente) */
export async function deleteRagDocument(documentId: string, companyId: string) {
  return db
    .delete(ragDocuments)
    .where(
      and(
        eq(ragDocuments.id, documentId),
        eq(ragDocuments.companyId, companyId) // segurança: só deleta da empresa certa
      )
    );
}
