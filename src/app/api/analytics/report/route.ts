import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { getUserCompanyInfo } from "@/lib/db/queries/company";
import { getMonthlyAnalytics } from "@/lib/db/queries/analytics";
import { debitTokens } from "@/lib/db/queries/tokens";

export const runtime = "nodejs";
export const maxDuration = 60;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const MINS_PER_SESSION = 15;

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const info = await getUserCompanyInfo(user.id);
  if (!info) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin = info.role === "company_admin" || info.role === "super_admin";
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const year = parseInt(searchParams.get("year") ?? String(now.getFullYear()), 10);
  const month = parseInt(searchParams.get("month") ?? String(now.getMonth() + 1), 10);

  const hourlyRate = parseFloat(info.hourlyRate ?? "35");
  const analytics = await getMonthlyAnalytics(info.companyId, year, month);
  const hoursSaved = (analytics.totalSessions * MINS_PER_SESSION) / 60;
  const valueEstimated = hoursSaved * hourlyRate;

  // Gerar resumo executivo com Claude Haiku
  let summary = "";
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system: "Você gera resumos executivos de impacto de IA para relatórios empresariais. Responda em português brasileiro. Seja objetivo, profissional e direto. Sem markdown, sem títulos, apenas texto corrido.",
      messages: [{
        role: "user",
        content: `Gere um resumo executivo com exatamente 3 parágrafos separados por quebra de linha dupla, para o relatório mensal de impacto de IA da empresa abaixo.

Empresa: ${info.companyName}
Período: ${MONTHS_PT[month - 1]} ${year}
Sessões realizadas: ${analytics.totalSessions}
Mensagens trocadas: ${analytics.totalMessages}
Horas economizadas (estimativa): ${hoursSaved.toFixed(1)}h
Valor gerado (estimativa): R$ ${valueEstimated.toFixed(0)}
Documentos na base de conhecimento: ${analytics.ragDocumentsCount}
Tarefas criadas: ${analytics.tasksCreated}

Parágrafo 1: O que foi realizado este mês (dados objetivos, tom analítico).
Parágrafo 2: Principal resultado ou destaque identificado nos dados.
Parágrafo 3: Uma recomendação prática e específica para o próximo mês.`,
      }],
    });

    const rawText = response.content[0].type === "text" ? response.content[0].text.trim() : "";
    summary = rawText;

    const tokensUsed = (response.usage.input_tokens ?? 0) + (response.usage.output_tokens ?? 0);
    await debitTokens(info.companyId, tokensUsed);
  } catch {
    summary = "O resumo executivo não pôde ser gerado automaticamente. Os dados acima refletem o desempenho real da plataforma no período.";
  }

  return NextResponse.json({
    totalSessions: analytics.totalSessions,
    totalMessages: analytics.totalMessages,
    totalTokensUsed: analytics.totalTokensUsed,
    hoursSaved: hoursSaved.toFixed(1),
    valueFormatted: `R$ ${valueEstimated.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`,
    ragDocumentsCount: analytics.ragDocumentsCount,
    tasksCreated: analytics.tasksCreated,
    agentUsage: analytics.agentUsage,
    summary,
    companyName: info.companyName,
    period: `${MONTHS_PT[month - 1]} ${year}`,
  });
}
