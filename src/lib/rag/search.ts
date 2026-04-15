import { adminSupabase } from "@/lib/supabase/admin";
import { generateEmbedding } from "./embeddings";

interface RagChunk {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

interface SearchRagOptions {
  query: string;
  companyId: string;
  agentId?: string;
  maxChunks?: number;
  threshold?: number;
}

/**
 * Busca os chunks mais relevantes para uma query via similaridade coseno.
 * Falha silenciosa — se o RAG falhar, o chat continua funcionando normalmente.
 */
export async function searchRag({
  query,
  companyId,
  agentId,
  maxChunks = 4,
  threshold = 0.45,
}: SearchRagOptions): Promise<RagChunk[]> {
  try {
    const queryEmbedding = await generateEmbedding(query);

    const { data, error } = await adminSupabase.rpc("search_rag_chunks", {
      query_embedding: `[${queryEmbedding.join(",")}]`,
      filter_company_id: companyId,
      filter_agent_id: agentId ?? null,
      match_count: maxChunks,
      match_threshold: threshold,
    });

    if (error) {
      console.error("Erro na busca RAG:", error);
      return [];
    }

    return (data as RagChunk[]) ?? [];
  } catch (error) {
    console.error("Erro na busca RAG:", error);
    return [];
  }
}

/**
 * Formata os chunks para injeção no system prompt do Claude.
 * Retorna string vazia se não houver chunks relevantes.
 */
export function formatRagContext(chunks: RagChunk[]): string {
  if (chunks.length === 0) return "";

  const formattedChunks = chunks
    .map((chunk, i) => `[Documento ${i + 1}]\n${chunk.content}`)
    .join("\n\n---\n\n");

  return `\n\n## Documentos da empresa relevantes para esta consulta:\n\n${formattedChunks}\n\n---\n\nUse as informações acima quando relevante para responder. Se não forem relevantes, ignore-as.`;
}
