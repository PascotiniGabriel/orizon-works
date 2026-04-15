/** Integração com Voyage AI via HTTP (evita problemas com ESM do SDK no Turbopack) */

const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";
const VOYAGE_MODEL = "voyage-3-lite";

interface VoyageResponse {
  data: Array<{ embedding: number[]; index: number }>;
}

async function callVoyageEmbed(input: string | string[]): Promise<number[][]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) throw new Error("VOYAGE_API_KEY não configurado");

  const res = await fetch(VOYAGE_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input, model: VOYAGE_MODEL }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Voyage AI error ${res.status}: ${err}`);
  }

  const json = (await res.json()) as VoyageResponse;
  // Ordenar por index para garantir a ordem correta
  return json.data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

/** Gera embedding de um único texto (usado na busca durante o chat) */
export async function generateEmbedding(text: string): Promise<number[]> {
  const embeddings = await callVoyageEmbed(text);
  if (!embeddings[0]) throw new Error("Voyage AI não retornou embedding");
  return embeddings[0];
}

/** Gera embeddings em batch — mais eficiente para indexação de documentos */
export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  const batchSize = 64; // Voyage aceita até 128 por request
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const embeddings = await callVoyageEmbed(batch);
    allEmbeddings.push(...embeddings);
  }

  return allEmbeddings;
}
