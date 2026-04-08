/**
 * Engenheiro de Prompt — Utilitários
 *
 * T17 — Modo Simples: enriquece automaticamente a mensagem do usuário
 *        com estrutura antes de enviar ao agente. Transparente para o usuário.
 *
 * T18 — Modo Guiado: o usuário preenche campos estruturados e um segundo
 *        agente Claude revisa/melhora o prompt antes de enviar.
 */

// ============================================================
// MODO SIMPLES — enriquecimento automático
// ============================================================

const AGENT_CONTEXT: Record<string, string> = {
  rh: "recrutamento, seleção, cultura organizacional e gestão de pessoas",
  marketing: "campanhas, conteúdo, posicionamento de marca e crescimento",
  comercial: "vendas, prospecção, propostas e relacionamento com clientes",
  financeiro: "finanças, KPIs, fluxo de caixa, custos e rentabilidade",
  administrativo: "processos internos, comunicados, reuniões e organização",
};

/**
 * Enriquece a mensagem do usuário com estrutura básica de prompt.
 * Mantém o conteúdo original e adiciona contexto de forma transparente.
 * Retorna a mensagem original se já for suficientemente estruturada.
 */
export function enrichSimpleMessage(
  userMessage: string,
  agentType: string,
  agentName: string
): string {
  const trimmed = userMessage.trim();

  // Mensagens já estruturadas ou muito curtas não precisam de enriquecimento
  if (trimmed.length < 10 || trimmed.length > 600) return trimmed;

  // Detecta se a mensagem já tem estrutura explícita
  const alreadyStructured =
    /\b(por favor|preciso que|quero que|você pode|crie|gere|faça|analise|elabore)\b/i.test(
      trimmed
    );

  if (alreadyStructured) return trimmed;

  const context = AGENT_CONTEXT[agentType] ?? "especialidade do agente";

  // Adiciona contexto mínimo para melhorar a qualidade da resposta
  return `${trimmed}\n\n[Contexto do pedido: o usuário está buscando ajuda com ${context}. Responda de forma completa, estruturada e prática, com base no briefing da empresa.]`;
}

// ============================================================
// MODO GUIADO — construção manual + revisão por IA
// ============================================================

export interface GuidedPromptFields {
  personagem?: string;
  tarefa: string;
  contexto: string;
  exemplo?: string;
  formato?: string;
  tom?: string;
}

/**
 * Monta o prompt estruturado a partir dos campos preenchidos pelo usuário.
 */
export function buildGuidedPrompt(fields: GuidedPromptFields): string {
  const parts: string[] = [];

  if (fields.personagem) {
    parts.push(`🎭 Personagem: ${fields.personagem}`);
  }

  parts.push(`📋 Tarefa: ${fields.tarefa}`);
  parts.push(`📍 Contexto: ${fields.contexto}`);

  if (fields.exemplo) {
    parts.push(`💡 Exemplo de referência: ${fields.exemplo}`);
  }

  if (fields.formato) {
    parts.push(`📐 Formato da resposta: ${fields.formato}`);
  }

  if (fields.tom) {
    parts.push(`🎨 Tom: ${fields.tom}`);
  }

  return parts.join("\n");
}

/**
 * System prompt usado pelo agente revisor de prompts (Modo Guiado).
 */
export const PROMPT_ENGINEER_SYSTEM = `Você é um especialista em engenharia de prompts para agentes de IA empresariais.

Sua tarefa é revisar o prompt estruturado enviado pelo usuário e devolver uma versão melhorada, mais clara e mais eficaz.

Regras:
- Mantenha todos os campos originais, apenas melhore a redação
- Torne o pedido mais específico e acionável
- Preserve a intenção original do usuário
- Escreva em português claro e direto
- Responda APENAS com o prompt melhorado, sem explicações adicionais
- Não adicione campos que o usuário não preencheu`;
