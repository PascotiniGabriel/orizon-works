import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";
import { db } from "@/lib/db";
import { users, agents, agentBriefings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SECTOR_PROMPTS: Record<string, string> = {
  rh: `Você é o assistente de configuração da OrizonWorks configurando um agente de RH (Recursos Humanos).

Conduza uma conversa em português para entender como esse agente deve atuar nessa empresa. Faça UMA pergunta por vez.

Colete:
1. Principais responsabilidades (recrutamento, folha de pagamento, treinamentos, benefícios, clima organizacional etc.)
2. Tom de comunicação com colaboradores (formal, acolhedor, técnico)
3. Temas que o agente NÃO deve abordar (ex: salários individuais, processos disciplinares em andamento)
4. Exemplos de perguntas frequentes dos colaboradores que o agente deve saber responder

Quando tiver coletado todas as informações, emita o sinal no formato EXATO:

AGENT_BRIEFING_COMPLETO
\`\`\`json
{
  "sectorContext": "...",
  "specificInstructions": "...",
  "restrictedTopics": "...",
  "preferredExamples": "...",
  "compiledPrompt": "Você é o agente de RH da empresa. Sua função: [contexto]. Instruções: [instruções]. Evite: [restrições]. Exemplos comuns: [exemplos]."
}
\`\`\`

Não inclua nada após o bloco JSON.`,

  marketing: `Você é o assistente de configuração da OrizonWorks configurando um agente de Marketing.

Conduza uma conversa em português para entender como esse agente deve atuar nessa empresa. Faça UMA pergunta por vez.

Colete:
1. Principais atividades de marketing (conteúdo, redes sociais, campanhas, branding, SEO etc.)
2. Tom e voz da marca nas comunicações externas
3. Temas ou abordagens que o agente deve evitar (concorrentes, promessas específicas, dados internos)
4. Exemplos de tarefas ou perguntas frequentes que o agente deve saber lidar

Quando tiver coletado todas as informações, emita o sinal no formato EXATO:

AGENT_BRIEFING_COMPLETO
\`\`\`json
{
  "sectorContext": "...",
  "specificInstructions": "...",
  "restrictedTopics": "...",
  "preferredExamples": "...",
  "compiledPrompt": "Você é o agente de Marketing da empresa. Sua função: [contexto]. Instruções: [instruções]. Evite: [restrições]. Exemplos comuns: [exemplos]."
}
\`\`\`

Não inclua nada após o bloco JSON.`,

  comercial: `Você é o assistente de configuração da OrizonWorks configurando um agente Comercial (Vendas).

Conduza uma conversa em português para entender como esse agente deve atuar nessa empresa. Faça UMA pergunta por vez.

Colete:
1. Etapas do processo de vendas (prospecção, qualificação, proposta, negociação, fechamento)
2. Principais objeções dos clientes e como a empresa costuma respondê-las
3. Informações que o agente não deve divulgar (margens, descontos não autorizados, dados de outros clientes)
4. Exemplos de situações comuns em vendas que o agente deve saber conduzir

Quando tiver coletado todas as informações, emita o sinal no formato EXATO:

AGENT_BRIEFING_COMPLETO
\`\`\`json
{
  "sectorContext": "...",
  "specificInstructions": "...",
  "restrictedTopics": "...",
  "preferredExamples": "...",
  "compiledPrompt": "Você é o agente Comercial da empresa. Sua função: [contexto]. Instruções: [instruções]. Evite: [restrições]. Exemplos comuns: [exemplos]."
}
\`\`\`

Não inclua nada após o bloco JSON.`,

  financeiro: `Você é o assistente de configuração da OrizonWorks configurando um agente Financeiro.

Conduza uma conversa em português para entender como esse agente deve atuar nessa empresa. Faça UMA pergunta por vez.

Colete:
1. Principais atividades financeiras (contas a pagar/receber, conciliação, relatórios, cobranças, fluxo de caixa)
2. Nível de acesso e autonomia do agente (só consultas? pode gerar relatórios? apenas orientações?)
3. Informações sensíveis que o agente jamais deve expor (dados bancários, margens, salários individuais)
4. Exemplos de perguntas ou tarefas frequentes que o agente deve saber responder

Quando tiver coletado todas as informações, emita o sinal no formato EXATO:

AGENT_BRIEFING_COMPLETO
\`\`\`json
{
  "sectorContext": "...",
  "specificInstructions": "...",
  "restrictedTopics": "...",
  "preferredExamples": "...",
  "compiledPrompt": "Você é o agente Financeiro da empresa. Sua função: [contexto]. Instruções: [instruções]. Evite: [restrições]. Exemplos comuns: [exemplos]."
}
\`\`\`

Não inclua nada após o bloco JSON.`,

  administrativo: `Você é o assistente de configuração da OrizonWorks configurando um agente Administrativo.

Conduza uma conversa em português para entender como esse agente deve atuar nessa empresa. Faça UMA pergunta por vez.

Colete:
1. Principais responsabilidades administrativas (documentos, fornecedores, contratos, agenda, protocolos internos)
2. Processos ou fluxos de trabalho mais comuns que o agente deve conhecer
3. Informações confidenciais ou temas que o agente não deve tratar
4. Exemplos de solicitações frequentes que o agente deve saber resolver

Quando tiver coletado todas as informações, emita o sinal no formato EXATO:

AGENT_BRIEFING_COMPLETO
\`\`\`json
{
  "sectorContext": "...",
  "specificInstructions": "...",
  "restrictedTopics": "...",
  "preferredExamples": "...",
  "compiledPrompt": "Você é o agente Administrativo da empresa. Sua função: [contexto]. Instruções: [instruções]. Evite: [restrições]. Exemplos comuns: [exemplos]."
}
\`\`\`

Não inclua nada após o bloco JSON.`,
};

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

  const body = await request.json();
  const agentId: string = body.agentId;
  const agentType: string = body.agentType;
  const messages: Message[] = (body.messages ?? []).filter(
    (m: { role: string }) => m.role === "user" || m.role === "assistant"
  );

  const systemPrompt = SECTOR_PROMPTS[agentType] ?? SECTOR_PROMPTS.administrativo;

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

      if (fullText.includes("AGENT_BRIEFING_COMPLETO")) {
        await saveAgentBriefing(agentId, dbUser.companyId!, user.id, fullText).catch(
          console.error
        );
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

async function saveAgentBriefing(
  agentId: string,
  companyId: string,
  userId: string,
  text: string
) {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (!jsonMatch) return;

  let data: Record<string, string>;
  try {
    data = JSON.parse(jsonMatch[1]);
  } catch {
    return;
  }

  await db
    .insert(agentBriefings)
    .values({
      agentId,
      companyId,
      sectorContext: data.sectorContext ?? null,
      specificInstructions: data.specificInstructions ?? null,
      restrictedTopics: data.restrictedTopics ?? null,
      preferredExamples: data.preferredExamples ?? null,
      compiledPrompt: data.compiledPrompt ?? null,
      isComplete: true,
    })
    .onConflictDoUpdate({
      target: agentBriefings.agentId,
      set: {
        sectorContext: data.sectorContext ?? null,
        specificInstructions: data.specificInstructions ?? null,
        restrictedTopics: data.restrictedTopics ?? null,
        preferredExamples: data.preferredExamples ?? null,
        compiledPrompt: data.compiledPrompt ?? null,
        isComplete: true,
        updatedAt: new Date(),
      },
    });

  // Vincular briefingId ao agente
  await db
    .update(agents)
    .set({ updatedAt: new Date() })
    .where(eq(agents.id, agentId));

  // Marcar onboarding totalmente completo no JWT
  await adminSupabase.auth.admin.updateUserById(userId, {
    app_metadata: { onboarding_completed: true },
  });
}
