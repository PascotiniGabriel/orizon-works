import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";
import { db } from "@/lib/db";
import { users, companyBriefings, companies } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Você é o assistente de configuração da OrizonWorks. Sua missão é conhecer a empresa do usuário para configurar os agentes de IA de forma personalizada.

Conduza uma conversa natural e amigável em português para coletar as seguintes informações:
1. Nome e segmento de atuação da empresa
2. Missão ou propósito principal
3. Valores e cultura organizacional
4. Tom de comunicação preferido (formal, informal, técnico, amigável)
5. Público-alvo principal
6. Principais produtos ou serviços

Faça UMA pergunta por vez. Seja direto e evite perguntas longas. Quando tiver coletado todas as informações acima, gere o sinal de conclusão no seguinte formato EXATO (última mensagem sua):

BRIEFING_COMPLETO
\`\`\`json
{
  "companyName": "...",
  "segment": "...",
  "mission": "...",
  "values": "...",
  "communicationTone": "...",
  "targetAudience": "...",
  "mainProducts": "...",
  "compiledPrompt": "Você é um assistente de IA da empresa [nome]. [segmento]. [missão]. Tom: [tom]. Público: [público]. Produtos: [produtos]. Valores: [valores]."
}
\`\`\`

Não inclua nada após o bloco JSON.`;

interface Message {
  role: "user" | "assistant";
  content: string;
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
  // Filtrar mensagens de sistema (notificações de upload) antes de enviar ao Claude
  const messages: Message[] = (body.messages ?? []).filter(
    (m: { role: string }) => m.role === "user" || m.role === "assistant"
  );

  // Incluir texto de documentos enviados, se houver
  const [briefing] = await db
    .select({ additionalContext: companyBriefings.additionalContext })
    .from(companyBriefings)
    .where(eq(companyBriefings.companyId, companyId));

  const systemPrompt = briefing?.additionalContext
    ? `${SYSTEM_PROMPT}\n\n--- DOCUMENTOS ENVIADOS PELA EMPRESA ---\n${briefing.additionalContext}\n--- FIM DOS DOCUMENTOS ---\n\nUse o conteúdo acima como contexto adicional para enriquecer suas perguntas e confirmar informações já mencionadas nos documentos.`
    : SYSTEM_PROMPT;

  const stream = anthropic.messages.stream({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  let fullText = "";

  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            const text = chunk.delta.text;
            fullText += text;
            controller.enqueue(encoder.encode(text));
          }
        }
      } finally {
        controller.close();
      }

      // Detectar sinal de conclusão e salvar briefing
      if (fullText.includes("BRIEFING_COMPLETO")) {
        await saveBriefing(companyId, user.id, fullText).catch(console.error);
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function saveBriefing(companyId: string, userId: string, text: string) {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (!jsonMatch) return;

  let data: Record<string, string>;
  try {
    data = JSON.parse(jsonMatch[1]);
  } catch {
    return;
  }

  await db
    .insert(companyBriefings)
    .values({
      companyId,
      companyName: data.companyName ?? null,
      segment: data.segment ?? null,
      mission: data.mission ?? null,
      values: data.values ?? null,
      communicationTone: data.communicationTone ?? null,
      targetAudience: data.targetAudience ?? null,
      mainProducts: data.mainProducts ?? null,
      compiledPrompt: data.compiledPrompt ?? null,
      isComplete: true,
      completedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: companyBriefings.companyId,
      set: {
        companyName: data.companyName ?? null,
        segment: data.segment ?? null,
        mission: data.mission ?? null,
        values: data.values ?? null,
        communicationTone: data.communicationTone ?? null,
        targetAudience: data.targetAudience ?? null,
        mainProducts: data.mainProducts ?? null,
        compiledPrompt: data.compiledPrompt ?? null,
        isComplete: true,
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    });

  await db
    .update(companies)
    .set({ onboardingCompleted: true, updatedAt: new Date() })
    .where(eq(companies.id, companyId));

  // Marcar Camada 1 concluída no app_metadata do JWT
  // O proxy lê esse flag para redirecionar para /onboarding/setor (Camada 2)
  await adminSupabase.auth.admin.updateUserById(userId, {
    app_metadata: { company_briefing_completed: true },
  });
}
