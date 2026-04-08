"use server";

import { createClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";
import { db } from "@/lib/db";
import { users, uploads, companyBriefings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const BUCKET = "company-documents";

export interface UploadResult {
  success: boolean;
  message: string;
  fileName?: string;
  extractedText?: string;
}

export async function uploadDocument(formData: FormData): Promise<UploadResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Não autenticado." };
  }

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { success: false, message: "Nenhum arquivo enviado." };
  }

  if (file.type !== "application/pdf") {
    return { success: false, message: "Apenas arquivos PDF são suportados." };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { success: false, message: "Arquivo muito grande. Máximo: 10MB." };
  }

  const [dbUser] = await db
    .select({ companyId: users.companyId })
    .from(users)
    .where(eq(users.id, user.id));

  if (!dbUser?.companyId) {
    return { success: false, message: "Empresa não encontrada." };
  }

  const companyId = dbUser.companyId;
  const fileId = randomUUID();
  const storagePath = `${companyId}/${fileId}-${file.name}`;
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Upload para Supabase Storage
  const { error: storageError } = await adminSupabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (storageError) {
    console.error("Storage error:", storageError);
    return { success: false, message: "Erro ao salvar o arquivo. Tente novamente." };
  }

  // Extrair texto do PDF (pdf-parse v2 usa API de classe)
  let extractedText = "";
  try {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const textResult = await parser.getText();
    extractedText = textResult.text.trim();
    await parser.destroy();
  } catch (err) {
    console.error("PDF parse error:", err);
    // Continua sem o texto — não bloqueia o fluxo
  }

  // Registrar upload na tabela
  await db.insert(uploads).values({
    companyId,
    userId: user.id,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
    storagePath,
    transcription: extractedText || null,
    transcriptionStatus: extractedText ? "completed" : "failed",
  });

  // Adicionar texto extraído ao briefing como contexto adicional
  if (extractedText) {
    const snippet = `--- Documento: ${file.name} ---\n${extractedText}`;

    const [existing] = await db
      .select({ id: companyBriefings.id, additionalContext: companyBriefings.additionalContext })
      .from(companyBriefings)
      .where(eq(companyBriefings.companyId, companyId));

    const merged = existing?.additionalContext
      ? `${existing.additionalContext}\n\n${snippet}`
      : snippet;

    await db
      .insert(companyBriefings)
      .values({ companyId, additionalContext: merged })
      .onConflictDoUpdate({
        target: companyBriefings.companyId,
        set: { additionalContext: merged, updatedAt: new Date() },
      });
  }

  return {
    success: true,
    fileName: file.name,
    extractedText: extractedText || undefined,
    message: extractedText
      ? `"${file.name}" enviado. Conteúdo extraído e adicionado ao contexto dos agentes.`
      : `"${file.name}" enviado, mas não foi possível extrair o texto automaticamente.`,
  };
}
