import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { checkTokenBalance, debitTokens } from "@/lib/db/queries/tokens";
import { buildGuidedPrompt, PROMPT_ENGINEER_SYSTEM } from "@/lib/claude/prompt-engineer";
import type { GuidedPromptFields } from "@/lib/claude/prompt-engineer";

export const runtime = "nodejs";

const MODEL = "claude-haiku-4-5-20251001";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * POST /api/chat/engenheiro
 *
 * Recebe os campos do Modo Guiado, constrói o prompt estruturado,
 * manda para um agente revisor Claude e devolve o prompt melhorado.
 *
 * Body: { fields: GuidedPromptFields }
 * Response: { improvedPrompt: string }
 */
export async function POST(request: NextRequest) {
  // Auth
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

  // Verificar saldo (mínimo 300 tokens para a revisão)
  const hasBalance = await checkTokenBalance(companyId, 300);
  if (!hasBalance) {
    return NextResponse.json(
      { error: "token_blocked", message: "Tokens insuficientes." },
      { status: 402 }
    );
  }

  const body = await request.json();
  const fields: GuidedPromptFields = body.fields;

  if (!fields?.tarefa || !fields?.contexto) {
    return NextResponse.json(
      { error: "Tarefa e Contexto são obrigatórios." },
      { status: 400 }
    );
  }

  const rawPrompt = buildGuidedPrompt(fields);

  // Chamada ao agente revisor
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 800,
    system: PROMPT_ENGINEER_SYSTEM,
    messages: [
      {
        role: "user",
        content: `Revise e melhore este prompt estruturado:\n\n${rawPrompt}`,
      },
    ],
  });

  const improvedPrompt =
    response.content[0]?.type === "text" ? response.content[0].text : rawPrompt;

  const totalTokens =
    (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0);

  await debitTokens(companyId, totalTokens);

  return NextResponse.json({ improvedPrompt, rawPrompt });
}
