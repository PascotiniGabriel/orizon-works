import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users, uploads, ragDocuments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { checkUploadRateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

// RAG só é ativado quando VOYAGE_API_KEY está configurado
const VOYAGE_ENABLED = Boolean(process.env.VOYAGE_API_KEY);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-excel": "xls",
  "text/csv": "csv",
  "audio/mpeg": "mp3",
  "audio/mp4": "mp4",
  "audio/wav": "wav",
  "audio/webm": "webm",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

/**
 * POST /api/upload
 *
 * Faz upload de arquivo para Supabase Storage e registra na tabela uploads.
 * Para PDFs: extrai texto imediatamente.
 * Para áudios/vídeos: registra como pending para transcrição Whisper.
 * Para planilhas: extrai dados básicos.
 *
 * Body: FormData com campo "file" e opcionalmente "sessionId", "agentType"
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [dbUser] = await db
    .select({ companyId: users.companyId })
    .from(users)
    .where(eq(users.id, user.id));

  if (!dbUser?.companyId) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const companyId = dbUser.companyId;

  // ── Rate limiting ────────────────────────────────────────────────────────
  const withinUploadLimit = await checkUploadRateLimit(user.id);
  if (!withinUploadLimit) {
    return NextResponse.json(
      { error: "Limite de uploads atingido. Você pode enviar até 15 arquivos por hora." },
      { status: 429 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const sessionId = formData.get("sessionId") as string | null;

  if (!file) {
    return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "Arquivo muito grande. Limite: 10 MB." },
      { status: 413 }
    );
  }

  const mimeType = file.type;
  if (!ALLOWED_MIME[mimeType]) {
    return NextResponse.json(
      { error: "Tipo de arquivo não suportado." },
      { status: 415 }
    );
  }

  const fileExt = ALLOWED_MIME[mimeType];
  const agentId = formData.get("agentId") as string | null;
  const storagePath = `${companyId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  // Upload para Supabase Storage
  const arrayBuffer = await file.arrayBuffer();
  const { error: storageError } = await supabase.storage
    .from("company-documents")
    .upload(storagePath, arrayBuffer, { contentType: mimeType, upsert: false });

  if (storageError) {
    return NextResponse.json(
      { error: "Erro ao salvar arquivo.", detail: storageError.message },
      { status: 500 }
    );
  }

  // Determinar categoria
  const isAudio = mimeType.startsWith("audio/") || mimeType.startsWith("video/");
  const isPDF = mimeType === "application/pdf";
  const isSpreadsheet = ["xlsx", "xls", "csv"].includes(fileExt);

  let extractedText: string | null = null;
  let transcriptionStatus = "not_applicable";

  // Extrair texto de PDFs
  if (isPDF) {
    try {
      const { PDFParse } = await import("pdf-parse");
      const buffer = new Uint8Array(arrayBuffer);
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      extractedText = result.text?.slice(0, 50000) ?? null;
      await parser.destroy();
    } catch {
      extractedText = null;
    }
  }

  // Marcar áudios como pending para transcrição
  if (isAudio) {
    transcriptionStatus = "pending";
  }

  // Extrair dados básicos de planilhas CSV
  if (isSpreadsheet && fileExt === "csv") {
    try {
      const text = new TextDecoder().decode(arrayBuffer);
      extractedText = text.slice(0, 30000);
    } catch {
      extractedText = null;
    }
  }

  // Registrar na tabela uploads
  const [uploadRecord] = await db
    .insert(uploads)
    .values({
      companyId,
      userId: user.id,
      sessionId: sessionId ?? undefined,
      fileName: file.name,
      fileSize: file.size,
      mimeType,
      storagePath,
      transcription: extractedText,
      transcriptionStatus,
    })
    .returning({ id: uploads.id });

  // ── RAG: indexar documentos com texto extraído ───────────────────────────
  // Apenas para arquivos com texto extraído e que não sejam áudio
  // (áudio precisa de transcrição primeiro, feita separadamente)
  if (extractedText && extractedText.length >= 50 && !isAudio && VOYAGE_ENABLED) {
    try {
      const [ragDoc] = await db
        .insert(ragDocuments)
        .values({
          companyId,
          agentId: agentId ?? undefined,
          fileName: file.name,
          fileType: fileExt,
          storagePath,
          status: "processing",
          createdBy: user.id,
        })
        .returning({ id: ragDocuments.id });

      // Disparar indexação em background — não bloquear a resposta
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/rag/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: ragDoc.id,
          text: extractedText,
          companyId,
          agentId: agentId ?? null,
        }),
      }).catch((err) => console.error("Erro ao disparar RAG ingest:", err));
    } catch (err) {
      // Falha silenciosa — upload já foi salvo com sucesso
      console.error("Erro ao criar registro RAG:", err);
    }
  }

  logAudit({
    companyId,
    userId: user.id,
    action: "rag.document_upload",
    entityType: "upload",
    entityId: uploadRecord.id,
    metadata: { fileName: file.name, mimeType, fileSize: file.size },
  });

  return NextResponse.json({
    uploadId: uploadRecord.id,
    fileName: file.name,
    mimeType,
    extractedText,
    isAudio,
    isPDF,
    isSpreadsheet,
    transcriptionStatus,
    storagePath,
  });
}
