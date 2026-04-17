import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse") as (buffer: Buffer) => Promise<{ text: string }>;
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { checkTokenBalance, debitTokens } from "@/lib/db/queries/tokens";

export const runtime = "nodejs";
export const maxDuration = 60;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-haiku-4-5-20251001";

export interface CurriculoResult {
  index: number;
  nome: string;
  nota: number; // 0-10
  pontosFottes: string[];
  pontosFracos: string[];
  recomendacao: "contratar" | "segunda_entrevista" | "reserva" | "descartar";
  resumo: string;
  fileName: string;
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

  // Verifica saldo — estimativa conservadora por currículo
  const hasBalance = await checkTokenBalance(companyId, 1500);
  if (!hasBalance)
    return NextResponse.json({ error: "Saldo de tokens insuficiente" }, { status: 402 });

  const formData = await request.formData();
  const file = formData.get("pdf") as File | null;
  const descricaoVaga = (formData.get("descricaoVaga") as string) ?? "";
  const agentPrompt = (formData.get("agentPrompt") as string) ?? "";
  const indexRaw = (formData.get("index") as string) ?? "0";
  const index = parseInt(indexRaw, 10);

  if (!file) return NextResponse.json({ error: "PDF é obrigatório" }, { status: 400 });
  if (!descricaoVaga.trim())
    return NextResponse.json({ error: "Descrição da vaga é obrigatória" }, { status: 400 });

  // Extrai texto do PDF
  const buffer = Buffer.from(await file.arrayBuffer());
  let curriculo: string;
  try {
    const pdfData = await pdfParse(buffer);
    curriculo = pdfData.text ?? "";
  } catch {
    return NextResponse.json(
      { error: `Não foi possível ler o arquivo: ${file.name}` },
      { status: 400 }
    );
  }

  if (!curriculo.trim()) {
    return NextResponse.json(
      {
        error: `O PDF "${file.name}" não contém texto legível. Pode ser um PDF de imagem — converta para texto antes.`,
      },
      { status: 400 }
    );
  }

  const systemPrompt = `${agentPrompt ? agentPrompt + "\n\n" : ""}Você é um especialista sênior em recrutamento e seleção de talentos.
Avalie currículos com precisão técnica, imparcialidade e critérios objetivos alinhados à vaga.
SEMPRE responda em JSON válido e exatamente no formato solicitado. Nenhum texto fora do JSON.`;

  const userPrompt = `Analise o currículo abaixo para a vaga especificada e retorne a avaliação em JSON.

## VAGA
${descricaoVaga}

## CURRÍCULO (arquivo: ${file.name})
${curriculo.slice(0, 15000)}

Responda APENAS com JSON válido, sem markdown, sem comentários:
{
  "nome": "Nome completo do candidato (ou '${file.name.replace(".pdf", "")}' se não identificado)",
  "nota": <número de 0.0 a 10.0 com 1 casa decimal>,
  "pontosFottes": ["ponto forte 1", "ponto forte 2", "ponto forte 3"],
  "pontosFracos": ["ponto de atenção 1", "ponto de atenção 2"],
  "recomendacao": "contratar" | "segunda_entrevista" | "reserva" | "descartar",
  "resumo": "Resumo objetivo em 1-2 frases sobre a adequação do candidato à vaga"
}`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 700,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const tokensUsed =
      (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0);
    await debitTokens(companyId, tokensUsed);

    const rawText =
      response.content[0]?.type === "text" ? response.content[0].text.trim() : "{}";

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (!parsed) {
      return NextResponse.json({ error: "Falha ao interpretar resposta da IA" }, { status: 500 });
    }

    const result: CurriculoResult = {
      index,
      nome: parsed.nome ?? file.name.replace(/\.pdf$/i, ""),
      nota: Math.max(0, Math.min(10, Number(parsed.nota) || 0)),
      pontosFottes: Array.isArray(parsed.pontosFottes) ? parsed.pontosFottes : [],
      pontosFracos: Array.isArray(parsed.pontosFracos) ? parsed.pontosFracos : [],
      recomendacao: (
        ["contratar", "segunda_entrevista", "reserva", "descartar"] as string[]
      ).includes(parsed.recomendacao)
        ? (parsed.recomendacao as CurriculoResult["recomendacao"])
        : "reserva",
      resumo: parsed.resumo ?? "",
      fileName: file.name,
    };

    return NextResponse.json({ result, tokensUsed });
  } catch {
    return NextResponse.json({ error: `Erro ao avaliar ${file.name}` }, { status: 500 });
  }
}
