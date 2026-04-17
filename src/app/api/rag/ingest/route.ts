import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";
import { db } from "@/lib/db";
import { ragDocuments, users } from "@/lib/db/schema";
import { chunkText, cleanText } from "@/lib/rag/chunking";
import { generateEmbeddingsBatch } from "@/lib/rag/embeddings";
import { and, eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // Autenticar usuário
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Verificar companyId do usuário autenticado
  const [dbUser] = await db
    .select({ companyId: users.companyId })
    .from(users)
    .where(eq(users.id, user.id));

  const userCompanyId = dbUser?.companyId;
  if (!userCompanyId) {
    return NextResponse.json({ error: "Empresa não encontrada" }, { status: 403 });
  }

  let documentId: string | null = null;

  try {
    const body = await req.json();
    documentId = body.documentId ?? null;
    const { text, companyId, agentId } = body;

    if (!documentId || !text || !companyId) {
      return NextResponse.json(
        { error: "Parâmetros obrigatórios ausentes" },
        { status: 400 }
      );
    }

    // Verificar que o documento pertence à empresa do usuário autenticado
    const [ragDoc] = await db
      .select({ id: ragDocuments.id })
      .from(ragDocuments)
      .where(and(eq(ragDocuments.id, documentId), eq(ragDocuments.companyId, userCompanyId)))
      .limit(1);

    if (!ragDoc) {
      return NextResponse.json({ error: "Documento não encontrado" }, { status: 403 });
    }

    // 1. Limpar e dividir em chunks
    const cleanedText = cleanText(text);
    const chunks = await chunkText(cleanedText);

    if (chunks.length === 0) {
      await db
        .update(ragDocuments)
        .set({ status: "error", chunkCount: 0 })
        .where(eq(ragDocuments.id, documentId));
      return NextResponse.json(
        { error: "Nenhum conteúdo válido encontrado no documento" },
        { status: 400 }
      );
    }

    // 2. Gerar embeddings em batch
    const embeddings = await generateEmbeddingsBatch(chunks);

    // 3. Montar registros — embedding como string no formato pgvector
    const chunksToInsert = chunks.map((content, index) => ({
      document_id: documentId,
      company_id: companyId,
      agent_id: agentId ?? null,
      content,
      chunk_index: index,
      embedding: `[${embeddings[index].join(",")}]`,
      metadata: { chunk_index: index, total_chunks: chunks.length },
    }));

    // 4. Inserir em batches de 50 via service role (bypassa RLS)
    const batchSize = 50;
    for (let i = 0; i < chunksToInsert.length; i += batchSize) {
      const batch = chunksToInsert.slice(i, i + batchSize);
      const { error } = await adminSupabase.from("rag_chunks").insert(batch);
      if (error) throw new Error(`Erro ao inserir chunks: ${error.message}`);
    }

    // 5. Marcar como pronto
    await db
      .update(ragDocuments)
      .set({ status: "ready", chunkCount: chunks.length })
      .where(eq(ragDocuments.id, documentId));

    return NextResponse.json({
      success: true,
      chunksCreated: chunks.length,
      documentId,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro no RAG ingest:", message);

    // Marcar documento como erro se tiver o ID
    if (documentId) {
      try {
        await db
          .update(ragDocuments)
          .set({ status: "error" })
          .where(eq(ragDocuments.id, documentId));
      } catch {
        // ignora erro secundário
      }
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
