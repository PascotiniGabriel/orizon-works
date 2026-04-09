import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { checkTokenBalance, debitTokens } from "@/lib/db/queries/tokens";

export const runtime = "nodejs";

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
}

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

  const body = await request.json();
  const descricaoVaga: string = body.descricaoVaga ?? "";
  const curriculos: string[] = body.curriculos ?? [];
  const agentPrompt: string = body.agentPrompt ?? "";

  if (!descricaoVaga.trim() || curriculos.length === 0) {
    return NextResponse.json(
      { error: "Descrição da vaga e ao menos 1 currículo são obrigatórios" },
      { status: 400 }
    );
  }

  if (curriculos.length > 20) {
    return NextResponse.json(
      { error: "Máximo de 20 currículos por avaliação" },
      { status: 400 }
    );
  }

  // Verifica saldo — estimativa: ~1200 tokens por currículo
  const estimatedTokens = curriculos.length * 1200;
  const hasBalance = await checkTokenBalance(companyId, estimatedTokens);
  if (!hasBalance) {
    return NextResponse.json({ error: "Saldo de tokens insuficiente" }, { status: 402 });
  }

  const results: CurriculoResult[] = [];
  let totalTokensUsed = 0;

  const systemPrompt = `${agentPrompt ? agentPrompt + "\n\n" : ""}Você é um especialista em recrutamento e seleção.
Avalie currículos com precisão, imparcialidade e critérios objetivos.
SEMPRE responda em JSON válido, exatamente no formato solicitado, sem texto fora do JSON.`;

  for (let i = 0; i < curriculos.length; i++) {
    const curriculo = curriculos[i];
    if (!curriculo.trim()) continue;

    const userPrompt = `Analise o seguinte currículo para a vaga descrita abaixo.

## DESCRIÇÃO DA VAGA
${descricaoVaga}

## CURRÍCULO ${i + 1}
${curriculo}

Responda APENAS com JSON válido no formato abaixo (sem markdown, sem texto extra):
{
  "nome": "Nome do candidato (ou 'Candidato ${i + 1}' se não identificado)",
  "nota": <número de 0 a 10, com até 1 casa decimal>,
  "pontosFottes": ["ponto 1", "ponto 2", "ponto 3"],
  "pontosFracos": ["ponto 1", "ponto 2"],
  "recomendacao": "contratar" | "segunda_entrevista" | "reserva" | "descartar",
  "resumo": "Resumo em 1-2 frases sobre a adequação do candidato à vaga"
}`;

    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 600,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });

      const tokensUsed =
        (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0);
      totalTokensUsed += tokensUsed;

      const rawText =
        response.content[0]?.type === "text" ? response.content[0].text.trim() : "{}";

      // Extrai JSON mesmo que venha com markdown
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

      if (parsed) {
        results.push({
          index: i,
          nome: parsed.nome ?? `Candidato ${i + 1}`,
          nota: Math.max(0, Math.min(10, Number(parsed.nota) || 0)),
          pontosFottes: Array.isArray(parsed.pontosFottes) ? parsed.pontosFottes : [],
          pontosFracos: Array.isArray(parsed.pontosFracos) ? parsed.pontosFracos : [],
          recomendacao: ["contratar", "segunda_entrevista", "reserva", "descartar"].includes(
            parsed.recomendacao
          )
            ? parsed.recomendacao
            : "reserva",
          resumo: parsed.resumo ?? "",
        });
      }
    } catch {
      results.push({
        index: i,
        nome: `Candidato ${i + 1}`,
        nota: 0,
        pontosFottes: [],
        pontosFracos: ["Erro ao processar currículo"],
        recomendacao: "descartar",
        resumo: "Erro ao processar este currículo.",
      });
    }
  }

  // Debita tokens
  if (totalTokensUsed > 0) {
    await debitTokens(companyId, totalTokensUsed);
  }

  // Ordena por nota (maior primeiro)
  results.sort((a, b) => b.nota - a.nota);

  return NextResponse.json({ results, tokensUsed: totalTokensUsed });
}
