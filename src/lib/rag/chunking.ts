import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

/** Divide texto em chunks de ~800 chars com sobreposição de 100 chars */
export async function chunkText(text: string): Promise<string[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 100,
    separators: ["\n\n", "\n", ". ", " ", ""],
  });

  const chunks = await splitter.splitText(text);

  // Descartar chunks muito curtos — não valem embedar
  return chunks.filter((chunk) => chunk.trim().length >= 50);
}

/** Normaliza espaços e quebras de linha excessivas */
export function cleanText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
