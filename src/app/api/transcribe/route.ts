import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users, uploads } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { checkTokenBalance, debitTokens } from "@/lib/db/queries/tokens";

export const runtime = "nodejs";

/**
 * POST /api/transcribe
 *
 * Transcreve um arquivo de áudio/vídeo usando Whisper API via Groq.
 * O arquivo deve já estar registrado na tabela uploads.
 *
 * Body: { uploadId: string }
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

  const { uploadId } = await request.json();
  if (!uploadId) {
    return NextResponse.json({ error: "uploadId é obrigatório." }, { status: 400 });
  }

  // Buscar registro do upload
  const [uploadRecord] = await db
    .select()
    .from(uploads)
    .where(
      and(eq(uploads.id, uploadId), eq(uploads.companyId, companyId))
    )
    .limit(1);

  if (!uploadRecord) {
    return NextResponse.json({ error: "Upload não encontrado." }, { status: 404 });
  }

  if (uploadRecord.transcriptionStatus === "completed") {
    return NextResponse.json({ transcription: uploadRecord.transcription });
  }

  // Verificar saldo mínimo (transcrição pode ser longa)
  const hasBalance = await checkTokenBalance(companyId, 1000);
  if (!hasBalance) {
    return NextResponse.json({ error: "token_blocked" }, { status: 402 });
  }

  // Baixar arquivo do Supabase Storage
  const { data: fileData, error: downloadError } = await supabase.storage
    .from("company-documents")
    .download(uploadRecord.storagePath);

  if (downloadError || !fileData) {
    return NextResponse.json({ error: "Erro ao baixar arquivo." }, { status: 500 });
  }

  // Marcar como processing
  await db
    .update(uploads)
    .set({ transcriptionStatus: "processing" })
    .where(eq(uploads.id, uploadId));

  try {
    const { Groq } = await import("groq-sdk");
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const arrayBuffer = await fileData.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: uploadRecord.mimeType });
    const file = new File([blob], uploadRecord.fileName, { type: uploadRecord.mimeType });

    const response = await groq.audio.transcriptions.create({
      file,
      model: "whisper-large-v3",
      language: "pt",
      response_format: "text",
    });

    const transcription = typeof response === "string" ? response : String(response);

    // Salvar transcrição
    await db
      .update(uploads)
      .set({
        transcription,
        transcriptionStatus: "completed",
      })
      .where(eq(uploads.id, uploadId));

    // Debitar tokens estimados (Whisper cobra por minuto de áudio, ~200 tokens/min aproximado)
    await debitTokens(companyId, 500);

    return NextResponse.json({ transcription, uploadId });
  } catch (err) {
    await db
      .update(uploads)
      .set({ transcriptionStatus: "failed" })
      .where(eq(uploads.id, uploadId));

    return NextResponse.json(
      { error: "Falha na transcrição.", detail: String(err) },
      { status: 500 }
    );
  }
}
