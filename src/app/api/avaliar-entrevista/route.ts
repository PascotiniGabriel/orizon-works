import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { checkTokenBalance, debitTokens } from "@/lib/db/queries/tokens";

export const runtime = "nodejs";
export const maxDuration = 120; // Transcrição de áudio pode demorar

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-haiku-4-5-20251001";

export interface EntrevistaResult {
  candidato: string;
  cargo: string;
  nota: number; // 0-10
  competencias: string[];
  alertas: string[];
  recomendacao: "contratar" | "segunda_entrevista" | "reserva" | "descartar";
  resumo: string;
  destaquesTranscricao: string[];
  transcricao: string;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [dbUser] = await db
    .select({ companyId: users.companyId })
    .from(users)
    .where(eq(users.id, user.id));
  if (!dbUser?.companyId)
    return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const companyId = dbUser.companyId;

  // Verificar saldo — transcrição + análise consome mais tokens
  const hasBalance = await checkTokenBalance(companyId, 3000);
  if (!hasBalance)
    return NextResponse.json({ error: "Saldo de tokens insuficiente" }, { status: 402 });

  const formData = await request.formData();
  const audioFile = formData.get("audio") as File | null;
  const descricaoVaga = (formData.get("descricaoVaga") as string) ?? "";
  const agentPrompt = (formData.get("agentPrompt") as string) ?? "";

  if (!audioFile)
    return NextResponse.json({ error: "Arquivo de áudio é obrigatório" }, { status: 400 });

  // Verificar tipo e tamanho (máx 25 MB)
  const isAudio =
    audioFile.type.startsWith("audio/") || audioFile.type.startsWith("video/");
  if (!isAudio)
    return NextResponse.json({ error: "Envie um arquivo de áudio ou vídeo" }, { status: 415 });

  if (audioFile.size > 25 * 1024 * 1024)
    return NextResponse.json({ error: "Arquivo muito grande. Limite: 25 MB" }, { status: 413 });

  // ── 1. Transcrição via Groq Whisper ──────────────────────────────────────
  let transcricao = "";
  try {
    const { Groq } = await import("groq-sdk");
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const response = await groq.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-large-v3",
      language: "pt",
      response_format: "text",
    });

    transcricao = typeof response === "string" ? response : String(response);
  } catch (err) {
    return NextResponse.json(
      { error: "Falha na transcrição do áudio.", detail: String(err) },
      { status: 500 }
    );
  }

  if (!transcricao.trim()) {
    return NextResponse.json(
      { error: "O áudio não contém fala identificável." },
      { status: 400 }
    );
  }

  // ── 2. Análise da entrevista via Claude ───────────────────────────────────
  const systemPrompt = `${agentPrompt ? agentPrompt + "\n\n" : ""}Você é um especialista sênior em recrutamento e avaliação de entrevistas.
Analise transcrições de entrevistas com profundidade, identificando competências, comportamentos e fit cultural.
SEMPRE responda em JSON válido e exatamente no formato solicitado. Nenhum texto fora do JSON.`;

  const userPrompt = `Analise a transcrição de entrevista abaixo para a vaga especificada e retorne a avaliação em JSON.

## VAGA
${descricaoVaga || "Vaga não especificada — avalie de forma geral as competências demonstradas."}

## TRANSCRIÇÃO DA ENTREVISTA
${transcricao.slice(0, 8000)}

Responda APENAS com JSON válido, sem markdown, sem comentários:
{
  "candidato": "Nome do candidato se mencionado, caso contrário 'Candidato'",
  "cargo": "Cargo discutido na entrevista",
  "nota": <número de 0.0 a 10.0 com 1 casa decimal>,
  "competencias": ["competência ou qualidade demonstrada 1", "competência 2", "competência 3"],
  "alertas": ["ponto de atenção ou red flag 1", "ponto de atenção 2"],
  "recomendacao": "contratar" | "segunda_entrevista" | "reserva" | "descartar",
  "resumo": "Resumo objetivo em 2-3 frases sobre o candidato e sua adequação à vaga",
  "destaquesTranscricao": ["trecho relevante ou fala marcante 1", "trecho 2"]
}`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 900,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const tokensUsed =
      (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0);
    // Debitar tokens de análise + estimativa de transcrição
    await debitTokens(companyId, tokensUsed + 500);

    const rawText =
      response.content[0]?.type === "text" ? response.content[0].text.trim() : "{}";
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (!parsed) {
      return NextResponse.json({ error: "Falha ao interpretar resposta da IA" }, { status: 500 });
    }

    const result: EntrevistaResult = {
      candidato: parsed.candidato ?? "Candidato",
      cargo: parsed.cargo ?? "",
      nota: Math.max(0, Math.min(10, Number(parsed.nota) || 0)),
      competencias: Array.isArray(parsed.competencias) ? parsed.competencias : [],
      alertas: Array.isArray(parsed.alertas) ? parsed.alertas : [],
      recomendacao: (
        ["contratar", "segunda_entrevista", "reserva", "descartar"] as string[]
      ).includes(parsed.recomendacao)
        ? (parsed.recomendacao as EntrevistaResult["recomendacao"])
        : "reserva",
      resumo: parsed.resumo ?? "",
      destaquesTranscricao: Array.isArray(parsed.destaquesTranscricao)
        ? parsed.destaquesTranscricao
        : [],
      transcricao,
    };

    return NextResponse.json({ result, tokensUsed: tokensUsed + 500 });
  } catch {
    return NextResponse.json({ error: "Erro ao analisar entrevista" }, { status: 500 });
  }
}
