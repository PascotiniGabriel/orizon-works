import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { companies, users, sessions, messages, agents, notifications } from "@/lib/db/schema";
import { eq, and, gte, count, sql } from "drizzle-orm";
import { debitTokens } from "@/lib/db/queries/tokens";
import { sendWeeklySummaryEmail } from "@/lib/email";

export const runtime = "nodejs";
export const maxDuration = 300;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function getWeekRange() {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - now.getDay() + 1);
  monday.setHours(0, 0, 0, 0);
  const fmt = (d: Date) =>
    d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  return { start: monday, label: `${fmt(monday)} – ${fmt(now)}` };
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { start: weekStart, label: weekLabel } = getWeekRange();

  const allCompanies = await db
    .select({ id: companies.id, name: companies.name })
    .from(companies);

  let processed = 0;
  let errors = 0;

  for (const company of allCompanies) {
    try {
      const [sessRow] = await db
        .select({ count: count() })
        .from(sessions)
        .where(and(eq(sessions.companyId, company.id), gte(sessions.createdAt, weekStart)));

      const [msgRow] = await db
        .select({ count: count() })
        .from(messages)
        .where(and(eq(messages.companyId, company.id), gte(messages.createdAt, weekStart)));

      const sessionCount = sessRow?.count ?? 0;
      const messageCount = msgRow?.count ?? 0;

      if (sessionCount === 0) continue;

      const agentRows = await db
        .select({
          agentType: agents.type,
          agentName: agents.customName,
          sessCount: sql<number>`COUNT(${sessions.id})`,
        })
        .from(agents)
        .leftJoin(sessions, and(
          eq(sessions.agentId, agents.id),
          gte(sessions.createdAt, weekStart),
        ))
        .where(eq(agents.companyId, company.id))
        .groupBy(agents.id, agents.type, agents.customName);

      const agentLines = agentRows
        .filter((r) => Number(r.sessCount) > 0)
        .map((r) => `- ${r.agentName ?? r.agentType}: ${r.sessCount} sessões`)
        .join("\n");

      const prompt = `Gere um resumo semanal executivo em português para a empresa "${company.name}".

Dados da semana (${weekLabel}):
- Total de sessões com agentes de IA: ${sessionCount}
- Total de mensagens trocadas: ${messageCount}
- Uso por agente:
${agentLines || "- Nenhum detalhamento disponível"}

Escreva 2-3 frases curtas destacando os pontos mais relevantes: o que foi usado, se houve alta atividade, e uma sugestão de próximo passo. Tom: profissional e encorajador. Máx 200 palavras. Responda apenas o texto do resumo, sem títulos.`;

      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 250,
        system: "Você é um assistente que gera resumos executivos semanais para equipes que usam IA empresarial. Seja conciso e actionável.",
        messages: [{ role: "user", content: prompt }],
      });

      const summaryText = response.content[0].type === "text" ? response.content[0].text.trim() : "";
      const tokensUsed = (response.usage.input_tokens ?? 0) + (response.usage.output_tokens ?? 0);
      const summaryHtml = summaryText.replace(/\n/g, "<br>");

      const adminRows = await db
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(and(eq(users.companyId, company.id), eq(users.role, "company_admin")));

      await db.insert(notifications).values({
        companyId: company.id,
        userId: adminRows[0]?.id ?? null,
        type: "weekly_summary",
        title: `Resumo da semana — ${weekLabel}`,
        message: summaryText.slice(0, 500),
        isRead: false,
      });

      for (const admin of adminRows) {
        if (admin.email) {
          await sendWeeklySummaryEmail({
            toEmail: admin.email,
            companyName: company.name,
            summaryHtml,
            weekLabel,
          });
        }
      }

      await debitTokens(company.id, tokensUsed);
      processed++;
    } catch {
      errors++;
    }
  }

  return NextResponse.json({ processed, errors, weekLabel });
}
