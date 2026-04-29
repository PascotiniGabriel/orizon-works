import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { checkTokenBalance, debitTokens } from "@/lib/db/queries/tokens";
import { maybeFireTokenAlerts } from "@/lib/token-alerts";

export const runtime = "nodejs";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-haiku-4-5-20251001";

const TOOL_PROMPTS: Record<string, (input: Record<string, string>) => string> = {
  // ── RH ───────────────────────────────────────────────────────────────────
  gerador_vaga: (i) => `Você é especialista em RH. Crie uma descrição de vaga profissional e atrativa em português do Brasil.

Cargo: ${i.cargo}
Empresa/Setor: ${i.empresa || "não informado"}
Nível: ${i.nivel || "Pleno"}
Modalidade: ${i.modalidade || "Presencial"}
Requisitos principais: ${i.requisitos || "não informado"}
Diferenciais desejados: ${i.diferenciais || "não informado"}
Salário/Benefícios: ${i.salario || "a combinar"}

Gere:
1. Título atrativo da vaga
2. Sobre a empresa (2-3 linhas genéricas sobre cultura)
3. Responsabilidades (bullets claros, 6-8 itens)
4. Requisitos obrigatórios (bullets, 4-6 itens)
5. Diferenciais (bullets, 3-4 itens)
6. Benefícios e informações adicionais
7. Call to action para candidatura

Formato profissional, linguagem inclusiva, engajante.`,

  pdi: (i) => `Você é especialista em desenvolvimento de pessoas (RH). Crie um PDI (Plano de Desenvolvimento Individual) estruturado em português do Brasil.

Funcionário: ${i.funcionario || "colaborador"}
Cargo atual: ${i.cargo}
Cargo alvo / próximo nível: ${i.cargo_alvo || "não informado"}
Pontos fortes identificados: ${i.pontos_fortes || "não informado"}
Pontos de melhoria: ${i.pontos_melhoria || "não informado"}
Período do PDI: ${i.periodo || "6 meses"}
Orçamento para desenvolvimento: ${i.orcamento || "não informado"}

Gere um PDI com:
1. Objetivos de desenvolvimento (SMART)
2. Competências a desenvolver (3-4)
3. Ações concretas por competência (cursos, projetos, mentoria)
4. Indicadores de sucesso por objetivo
5. Cronograma mês a mês
6. Recursos necessários
7. Responsabilidades (funcionário, gestor, empresa)

Seja específico e acionável.`,

  // ── COMERCIAL ────────────────────────────────────────────────────────────
  proposta: (i) => `Você é especialista em vendas B2B. Crie uma proposta comercial profissional em português do Brasil.

Cliente: ${i.cliente}
Setor do cliente: ${i.setor_cliente || "não informado"}
Solução/Produto oferecido: ${i.solucao}
Problema que resolve: ${i.problema}
Valor/Investimento: ${i.valor || "a definir"}
Prazo de entrega: ${i.prazo || "a combinar"}
Diferenciais competitivos: ${i.diferenciais || "não informado"}
Contexto adicional: ${i.contexto || "não informado"}

Gere uma proposta com:
1. Capa resumida (cliente, data, número da proposta)
2. Entendimento do problema/necessidade
3. Solução proposta (detalhada)
4. Metodologia/Como funciona
5. Por que nossa empresa (3 diferenciais)
6. Investimento e condições
7. Próximos passos
8. Validade da proposta

Tom profissional, focado em valor, não em preço.`,

  objecoes: (i) => `Você é especialista em vendas e treinamento comercial. Simule um treinamento de objeções de venda em português do Brasil.

Produto/Serviço: ${i.produto}
Objeção do cliente: ${i.objecao}
Perfil do cliente: ${i.perfil || "decisor empresarial"}
Contexto da negociação: ${i.contexto || "primeira reunião"}

Gere:
1. Análise da objeção (real intenção por trás dela)
2. Técnica recomendada para tratar
3. Script de resposta (palavra por palavra, natural)
4. Pergunta de avanço para retomar controle
5. Variação alternativa da resposta
6. O que NUNCA fazer nessa objeção
7. Sinal de compra escondido nessa objeção (se houver)`,

  // ── MARKETING ────────────────────────────────────────────────────────────
  calendario_conteudo: (i) => `Você é especialista em marketing de conteúdo. Crie um calendário de conteúdo em português do Brasil.

Empresa/Marca: ${i.empresa || "não informado"}
Segmento: ${i.segmento}
Público-alvo: ${i.publico}
Canais: ${i.canais || "Instagram, LinkedIn"}
Período: ${i.periodo || "próximas 4 semanas"}
Objetivo principal: ${i.objetivo || "engajamento e autoridade"}
Tom de comunicação: ${i.tom || "profissional e próximo"}

Gere um calendário com:
1. Tema central do período
2. Para cada semana: 3-4 posts com (canal, formato, gancho/título, mensagem central, CTA)
3. Hashtags sugeridas por canal
4. Ideias de conteúdo evergreen (reutilizável)
5. Datas comemorativas relevantes no período
6. Métricas para acompanhar

Formato tabular quando possível. Conteúdo prático e executável.`,

  copy: (i) => `Você é copywriter especialista. Crie copy persuasivo em português do Brasil.

Produto/Serviço: ${i.produto}
Público-alvo: ${i.publico}
Formato: ${i.formato || "post redes sociais"}
Objetivo: ${i.objetivo || "gerar leads"}
Tom: ${i.tom || "profissional e direto"}
Diferencial principal: ${i.diferencial || "não informado"}
CTA desejado: ${i.cta || "entre em contato"}

Gere 3 variações de copy com:
- Headline principal (gancho forte)
- Corpo do texto (problema → agitação → solução)
- CTA claro
- Variação A: emocional/storytelling
- Variação B: racional/dados
- Variação C: urgência/escassez
Para cada variação: headline + corpo + CTA.`,

  brief_campanha: (i) => `Você é especialista em planejamento de marketing. Crie um brief de campanha completo em português do Brasil.

Produto/Serviço: ${i.produto}
Objetivo da campanha: ${i.objetivo}
Público-alvo: ${i.publico}
Budget disponível: ${i.budget || "a definir"}
Período da campanha: ${i.periodo || "30 dias"}
Canais disponíveis: ${i.canais || "digital (social + search)"}
Concorrência principal: ${i.concorrencia || "não informado"}

Gere um brief com:
1. Contexto e situação atual
2. Objetivo SMART da campanha
3. Público-alvo detalhado (persona)
4. Proposta de valor única (USP)
5. Mensagem central e tom de voz
6. Mix de canais e distribuição de budget
7. Cronograma de execução
8. KPIs e metas por canal
9. Criativos necessários (lista)
10. Pontos de atenção e riscos`,

  // ── FINANCEIRO ───────────────────────────────────────────────────────────
  analise_dre: (i) => `Você é analista financeiro especialista. Analise o DRE em português do Brasil.

Receita Bruta: ${i.receita_bruta}
Deduções/Impostos: ${i.deducoes || "0"}
CMV/CPV: ${i.cmv || "0"}
Despesas Operacionais: ${i.despesas_op}
Despesas Administrativas: ${i.despesas_admin || "0"}
Despesas com Pessoal: ${i.despesas_pessoal || "0"}
Outras despesas: ${i.outras_despesas || "0"}
Período: ${i.periodo || "mês atual"}
Setor da empresa: ${i.setor || "não informado"}

Calcule e analise:
1. Receita Líquida
2. Lucro Bruto e Margem Bruta (%)
3. EBITDA estimado e Margem EBITDA (%)
4. Lucro/Prejuízo Operacional e Margem Líquida (%)
5. Análise vertical (cada linha como % da receita bruta)
6. Principais alertas (linhas fora do padrão do setor)
7. Recomendações de melhoria (3-5 ações concretas)
8. Comparativo com benchmarks do setor (se aplicável)

Seja preciso nos cálculos. Formato tabular + análise narrativa.`,

  fluxo_caixa: (i) => `Você é analista financeiro. Crie uma projeção de fluxo de caixa em português do Brasil.

Saldo inicial: ${i.saldo_inicial}
Receitas recorrentes mensais: ${i.receitas_recorrentes}
Receitas variáveis previstas: ${i.receitas_variaveis || "0"}
Custos fixos mensais: ${i.custos_fixos}
Custos variáveis: ${i.custos_variaveis || "0"}
Contas a receber (próximo mês): ${i.contas_receber || "0"}
Contas a pagar (próximo mês): ${i.contas_pagar || "0"}
Período de projeção: ${i.periodo || "3 meses"}
Cenários: otimista, realista, pessimista

Gere:
1. Projeção mês a mês (tabela) nos 3 cenários
2. Ponto de equilíbrio de caixa (break-even mensal)
3. Alertas de meses críticos (saldo negativo)
4. Necessidade de capital de giro
5. Recomendações para melhorar o fluxo
6. Indicadores: burn rate, runway (meses até zerar), dias de caixa`,

  break_even: (i) => `Você é analista financeiro. Calcule o ponto de equilíbrio em português do Brasil.

Custos Fixos Mensais: ${i.custos_fixos}
Preço de Venda Unitário: ${i.preco_venda}
Custo Variável Unitário: ${i.custo_variavel}
Produto/Serviço: ${i.produto || "produto principal"}
Capacidade máxima mensal: ${i.capacidade || "não informado"}
Setor: ${i.setor || "não informado"}

Calcule e apresente:
1. Margem de Contribuição Unitária (R$ e %)
2. Ponto de Equilíbrio Contábil (unidades e R$)
3. Ponto de Equilíbrio Financeiro (ajustado a caixa)
4. Ponto de Equilíbrio Econômico (com lucro mínimo desejado)
5. Margem de Segurança
6. Análise de sensibilidade: e se preço cair 10%? E se custo subir 15%?
7. Gráfico textual do break-even
8. Recomendações para reduzir o ponto de equilíbrio`,

  // ── ADMINISTRATIVO ───────────────────────────────────────────────────────
  ata_reuniao: (i) => `Você é especialista em gestão administrativa. Gere uma ata de reunião formal em português do Brasil.

Título/Pauta da reunião: ${i.pauta}
Data e horário: ${i.data_hora || "não informado"}
Local/Plataforma: ${i.local || "não informado"}
Participantes: ${i.participantes || "não informado"}
Transcrição/Notas da reunião: ${i.transcricao}
Próxima reunião: ${i.proxima_reuniao || "a definir"}

Gere uma ata formal com:
1. Cabeçalho (empresa, data, local, presentes, ausentes justificados)
2. Abertura da reunião
3. Pauta discutida (item por item)
4. Decisões tomadas (em destaque)
5. Ações definidas (tabela: ação | responsável | prazo)
6. Pontos de atenção / riscos identificados
7. Encerramento
8. Local para assinaturas (moderador + participantes chave)

Linguagem formal e objetiva.`,

  resumo_contrato: (i) => `Você é especialista jurídico-administrativo. Analise e resuma este contrato em português do Brasil.

Tipo de contrato: ${i.tipo_contrato || "não informado"}
Partes envolvidas: ${i.partes || "não informado"}
Conteúdo/Trechos do contrato: ${i.conteudo}
Foco da análise: ${i.foco || "pontos de atenção gerais"}

Gere:
1. Resumo executivo (5 linhas máximo)
2. Partes e papéis
3. Objeto do contrato
4. Principais obrigações de cada parte
5. Valores e condições de pagamento
6. Prazos e vigência
7. ⚠️ Pontos de atenção / cláusulas críticas (destaque em vermelho conceitual)
8. Penalidades e rescisão
9. Recomendações antes de assinar
10. Perguntas que devem ser feitas ao fornecedor/parceiro

IMPORTANTE: Deixe claro que esta é uma análise auxiliar e não substitui parecer jurídico profissional.`,

  mapeador_processo: (i) => `Você é especialista em gestão de processos (BPM). Mapeie e otimize o processo em português do Brasil.

Nome do processo: ${i.nome_processo}
Departamento responsável: ${i.departamento || "não informado"}
Descrição atual do processo: ${i.descricao}
Problema/dor atual: ${i.problema || "não informado"}
Frequência: ${i.frequencia || "não informado"}
Pessoas envolvidas: ${i.pessoas || "não informado"}

Gere:
1. Fluxograma textual do processo (passo a passo numerado com responsável e sistema)
2. Swimlane simplificado (quem faz o quê)
3. Tempo estimado por etapa e tempo total
4. Gargalos identificados (pontos de lentidão ou falha)
5. Riscos do processo atual
6. Processo otimizado (versão melhorada)
7. Quick wins (melhorias imediatas, sem custo)
8. Indicadores para monitorar o processo (KPIs)
9. Checklist de execução para os responsáveis`,
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [dbUser] = await db
    .select({ companyId: users.companyId })
    .from(users)
    .where(eq(users.id, user.id));

  if (!dbUser?.companyId) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const companyId = dbUser.companyId;
  const hasBalance = await checkTokenBalance(companyId, 300);
  if (!hasBalance) {
    return NextResponse.json({ error: "token_blocked", message: "Tokens esgotados." }, { status: 402 });
  }

  const body = await request.json();
  const { tool, input }: { tool: string; input: Record<string, string> } = body;

  const promptFn = TOOL_PROMPTS[tool];
  if (!promptFn) return NextResponse.json({ error: "Tool not found" }, { status: 400 });

  const prompt = promptFn(input);

  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const content = msg.content[0]?.type === "text" ? msg.content[0].text : "";
  const totalTokens = (msg.usage.input_tokens ?? 0) + (msg.usage.output_tokens ?? 0);

  const debitResult = await debitTokens(companyId, totalTokens);
  void maybeFireTokenAlerts(companyId, debitResult.newBalance, debitResult.tokenLimit);

  return NextResponse.json({ content, tokensUsed: totalTokens });
}
