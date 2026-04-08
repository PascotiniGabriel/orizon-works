import { getAgentWithBriefings } from "@/lib/db/queries/agents";

export interface CompiledPrompt {
  systemPrompt: string;
  agentDisplayName: string;
  agentType: string;
  avatarUrl: string | null;
}

/**
 * Compila o system prompt final combinando:
 * - Camada 1: briefing da empresa (identidade, tom, público, produtos)
 * - Camada 2: briefing do agente (contexto do setor, instruções específicas)
 *
 * Hierarquia de fontes:
 * 1. Se o briefing da Camada 2 já tem compiledPrompt gerado pela IA → usa como base
 * 2. Se a empresa tem compiledPrompt (Camada 1) → injeta como contexto de empresa
 * 3. Fallback: constrói a partir dos campos individuais
 */
export async function buildSystemPrompt(
  agentId: string,
  companyId: string
): Promise<CompiledPrompt | null> {
  const data = await getAgentWithBriefings(agentId, companyId);
  if (!data) return null;

  const { agent, companyBriefing: cb, agentBriefing: ab } = data;

  const agentLabel = agentTypeLabel(agent.type);
  const agentDisplayName = agent.customName ?? agentLabel;

  // ── Bloco da empresa (Camada 1) ──────────────────────────────────────────
  let companyBlock = "";

  if (cb?.compiledPrompt) {
    // Usa o prompt compilado pela IA durante o onboarding da empresa
    companyBlock = cb.compiledPrompt.trim();
  } else if (cb) {
    // Fallback: constrói a partir dos campos individuais
    const parts: string[] = [];
    if (cb.companyName) parts.push(`Empresa: ${cb.companyName}.`);
    if (cb.segment) parts.push(`Segmento: ${cb.segment}.`);
    if (cb.mission) parts.push(`Missão: ${cb.mission}.`);
    if (cb.values) parts.push(`Valores: ${cb.values}.`);
    if (cb.communicationTone) parts.push(`Tom de comunicação: ${cb.communicationTone}.`);
    if (cb.targetAudience) parts.push(`Público-alvo: ${cb.targetAudience}.`);
    if (cb.mainProducts) parts.push(`Produtos/Serviços: ${cb.mainProducts}.`);
    companyBlock = parts.join(" ");
  }

  if (cb?.additionalContext) {
    companyBlock += `\n\n--- Documentos de referência da empresa ---\n${cb.additionalContext}\n--- Fim dos documentos ---`;
  }

  // ── Bloco do agente (Camada 2) ────────────────────────────────────────────
  let agentBlock = "";

  if (ab?.compiledPrompt) {
    // Usa o prompt compilado pela IA durante o briefing de setor
    agentBlock = ab.compiledPrompt.trim();
  } else if (ab) {
    // Fallback: constrói a partir dos campos individuais
    const parts: string[] = [];
    parts.push(`Você é o agente de ${agentLabel} da empresa.`);
    if (ab.sectorContext) parts.push(ab.sectorContext);
    if (ab.specificInstructions) parts.push(`Instruções: ${ab.specificInstructions}`);
    if (ab.restrictedTopics) parts.push(`Não aborde: ${ab.restrictedTopics}`);
    if (ab.preferredExamples) parts.push(`Exemplos de uso: ${ab.preferredExamples}`);
    agentBlock = parts.join(" ");
  } else {
    // Sem briefing de setor ainda: prompt genérico
    agentBlock = `Você é o agente de ${agentLabel}. Responda de forma útil e profissional em português.`;
  }

  // ── Composição final ─────────────────────────────────────────────────────
  const sections: string[] = [];

  sections.push(agentBlock);

  if (companyBlock) {
    sections.push(
      `\n\n--- Contexto da empresa ---\n${companyBlock}\n--- Fim do contexto ---`
    );
  }

  sections.push(
    `\n\nRegras gerais:\n- Responda sempre em português do Brasil.\n- Seja direto, claro e profissional.\n- Não invente informações que não foram fornecidas.\n- Se não souber responder, informe claramente e sugira quem pode ajudar.`
  );

  return {
    systemPrompt: sections.join("").trim(),
    agentDisplayName,
    agentType: agent.type,
    avatarUrl: agent.avatarUrl,
  };
}

function agentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    rh: "RH",
    marketing: "Marketing",
    comercial: "Comercial",
    financeiro: "Financeiro",
    administrativo: "Administrativo",
  };
  return labels[type] ?? type;
}
