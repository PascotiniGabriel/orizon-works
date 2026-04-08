import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { checkTokenBalance, debitTokens } from "@/lib/db/queries/tokens";
import { buildSystemPrompt } from "@/lib/claude/prompt-builder";
import { getOrCreateSession, saveMessages } from "@/lib/db/queries/sessions";
import { enrichSimpleMessage } from "@/lib/claude/prompt-engineer";

export const runtime = "nodejs";

const MODEL = "claude-haiku-4-5-20251001";
// Estimativa conservadora de tokens de entrada para pré-verificação de saldo
const MIN_TOKENS_REQUIRED = 500;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────
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

  // ── Validar body ─────────────────────────────────────────────────────────
  const body = await request.json();
  const agentId: string | undefined = body.agentId;
  const sessionId: string | undefined = body.sessionId;
  const messages: ChatMessage[] = (body.messages ?? []).filter(
    (m: { role: string }) => m.role === "user" || m.role === "assistant"
  );

  if (!agentId) {
    return NextResponse.json({ error: "agentId is required" }, { status: 400 });
  }

  if (messages.length === 0) {
    return NextResponse.json({ error: "messages is required" }, { status: 400 });
  }

  // ── Verificar saldo de tokens antes de chamar a API ──────────────────────
  const hasBalance = await checkTokenBalance(companyId, MIN_TOKENS_REQUIRED);
  if (!hasBalance) {
    return NextResponse.json(
      { error: "token_blocked", message: "Tokens esgotados. Adquira um Token Pack para continuar." },
      { status: 402 }
    );
  }

  // ── Compilar system prompt ───────────────────────────────────────────────
  const compiled = await buildSystemPrompt(agentId, companyId);
  if (!compiled) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  // ── Criar/retomar sessão ─────────────────────────────────────────────────
  const activeSessionId = await getOrCreateSession(
    companyId,
    user.id,
    agentId,
    sessionId
  );

  // ── Última mensagem do usuário ───────────────────────────────────────────
  const lastUserMessage = messages[messages.length - 1]?.content ?? "";

  // ── Modo Simples: enriquecer última mensagem automaticamente (T17) ───────
  const enrichedMessages = messages.map((m, i) => {
    if (i === messages.length - 1 && m.role === "user") {
      return {
        ...m,
        content: enrichSimpleMessage(
          m.content,
          compiled.agentType,
          compiled.agentDisplayName
        ),
      };
    }
    return m;
  });

  // ── Streaming ────────────────────────────────────────────────────────────
  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: 2048,
    system: compiled.systemPrompt,
    messages: enrichedMessages,
  });

  let fullText = "";
  let inputTokens = 0;
  let outputTokens = 0;

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

          // Capturar contagem de tokens do evento final
          if (chunk.type === "message_delta" && chunk.usage) {
            outputTokens = chunk.usage.output_tokens;
          }
          if (chunk.type === "message_start" && chunk.message.usage) {
            inputTokens = chunk.message.usage.input_tokens;
          }
        }
      } finally {
        controller.close();
      }

      // ── Pós-streaming: debitar tokens e salvar mensagens ────────────────
      const totalTokens = inputTokens + outputTokens;

      await Promise.all([
        debitTokens(companyId, totalTokens),
        saveMessages(
          activeSessionId,
          companyId,
          lastUserMessage,
          fullText,
          inputTokens,
          outputTokens,
          MODEL
        ),
      ]);
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      // Expor sessionId para o cliente manter a sessão entre mensagens
      "X-Session-Id": activeSessionId,
    },
  });
}
