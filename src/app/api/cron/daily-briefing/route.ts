import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { agents, agentBriefings, dailyBriefings } from "@/lib/db/schema";
import { eq, and, isNotNull } from "drizzle-orm";
import { debitTokens } from "@/lib/db/queries/tokens";

export const runtime = "nodejs";
export const maxDuration = 300;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);

  const agentsWithBriefings = await db
    .select({
      agentId: agents.id,
      companyId: agents.companyId,
      agentType: agents.type,
      compiledPrompt: agentBriefings.compiledPrompt,
    })
    .from(agents)
    .innerJoin(agentBriefings, eq(agentBriefings.agentId, agents.id))
    .where(and(
      eq(agentBriefings.isComplete, true),
      isNotNull(agentBriefings.compiledPrompt),
    ));

  let generated = 0;
  let skipped = 0;
  let errors = 0;

  for (const agent of agentsWithBriefings) {
    try {
      const [existing] = await db
        .select({ id: dailyBriefings.id })
        .from(dailyBriefings)
        .where(and(
          eq(dailyBriefings.agentId, agent.agentId),
          eq(dailyBriefings.date, today),
        ))
        .limit(1);

      if (existing) { skipped++; continue; }

      const context = agent.compiledPrompt?.slice(0, 2000) ?? `Agente de ${agent.agentType} empresarial`;

      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system: "Você gera briefings diários práticos para equipes empresariais. Responda APENAS com JSON válido, sem markdown.",
        messages: [{
          role: "user",
          content: `Com base no contexto do agente abaixo, gere um briefing diário em JSON com exatamente 3 campos:
- "focoDoDia": frase curta (máx 100 chars) com o foco principal para hoje
- "dicaRapida": dica prática e acionável (máx 130 chars) relacionada ao papel do agente
- "perguntaDoDia": pergunta reflexiva (máx 110 chars) que estimule pensamento estratégico

Contexto:
${context}`,
        }],
      });

      const rawText = response.content[0].type === "text" ? response.content[0].text.trim() : "{}";
      const parsed = JSON.parse(rawText) as { focoDoDia: string; dicaRapida: string; perguntaDoDia: string };
      const tokensUsed = (response.usage.input_tokens ?? 0) + (response.usage.output_tokens ?? 0);

      await db.insert(dailyBriefings).values({
        agentId: agent.agentId,
        companyId: agent.companyId,
        date: today,
        focoDoDia: parsed.focoDoDia ?? "",
        dicaRapida: parsed.dicaRapida ?? "",
        perguntaDoDia: parsed.perguntaDoDia ?? "",
        tokensUsed,
      });

      await debitTokens(agent.companyId, tokensUsed);
      generated++;
    } catch {
      errors++;
    }
  }

  return NextResponse.json({ generated, skipped, errors, date: today });
}
