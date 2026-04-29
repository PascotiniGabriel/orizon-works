"use client";

import { useState } from "react";
import { Loader2, Copy, CheckCheck, ChevronDown, Zap } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ToolField {
  name: string;
  label: string;
  type: "input" | "textarea";
  required?: boolean;
  rows?: number;
  placeholder?: string;
}

interface ToolDef {
  id: string;
  label: string;
  description: string;
  fields: ToolField[];
}

// ─── Tool definitions per sector ─────────────────────────────────────────────

const SECTOR_TOOLS: Record<string, ToolDef[]> = {
  rh: [
    {
      id: "gerador_vaga",
      label: "Gerador de Descrição de Vaga",
      description: "Cria descrições profissionais e atrativas para vagas de emprego.",
      fields: [
        { name: "cargo", label: "Cargo *", type: "input", required: true, placeholder: "Ex: Analista de Marketing Pleno" },
        { name: "empresa", label: "Empresa / Setor", type: "input", placeholder: "Ex: Startup de tecnologia B2B" },
        { name: "nivel", label: "Nível", type: "input", placeholder: "Júnior / Pleno / Sênior" },
        { name: "modalidade", label: "Modalidade", type: "input", placeholder: "Presencial / Híbrido / Remoto" },
        { name: "requisitos", label: "Requisitos principais", type: "textarea", rows: 3, placeholder: "Liste as habilidades e experiências necessárias" },
        { name: "diferenciais", label: "Diferenciais desejados", type: "textarea", rows: 2, placeholder: "Ex: experiência com SaaS, inglês avançado" },
        { name: "salario", label: "Salário / Benefícios", type: "input", placeholder: "Ex: R$ 5.000 + VR + plano de saúde" },
      ],
    },
    {
      id: "pdi",
      label: "PDI — Plano de Desenvolvimento Individual",
      description: "Gera um PDI estruturado com objetivos SMART, ações e cronograma.",
      fields: [
        { name: "cargo", label: "Cargo atual *", type: "input", required: true, placeholder: "Ex: Analista de RH" },
        { name: "funcionario", label: "Nome do funcionário", type: "input", placeholder: "Ex: João Silva" },
        { name: "cargo_alvo", label: "Cargo alvo / próximo nível", type: "input", placeholder: "Ex: Coordenador de RH" },
        { name: "pontos_fortes", label: "Pontos fortes", type: "textarea", rows: 2, placeholder: "Habilidades e competências em destaque" },
        { name: "pontos_melhoria", label: "Pontos de melhoria", type: "textarea", rows: 2, placeholder: "Áreas que precisam desenvolver" },
        { name: "periodo", label: "Período do PDI", type: "input", placeholder: "Ex: 6 meses" },
        { name: "orcamento", label: "Orçamento para desenvolvimento", type: "input", placeholder: "Ex: R$ 2.000" },
      ],
    },
  ],

  comercial: [
    {
      id: "proposta",
      label: "Proposta Comercial",
      description: "Cria uma proposta B2B profissional focada em valor.",
      fields: [
        { name: "cliente", label: "Cliente *", type: "input", required: true, placeholder: "Nome da empresa cliente" },
        { name: "solucao", label: "Solução / Produto oferecido *", type: "input", required: true, placeholder: "Ex: Plataforma de automação de RH" },
        { name: "problema", label: "Problema que resolve *", type: "textarea", required: true, rows: 2, placeholder: "Qual dor do cliente sua solução resolve?" },
        { name: "setor_cliente", label: "Setor do cliente", type: "input", placeholder: "Ex: Indústria farmacêutica" },
        { name: "valor", label: "Valor / Investimento", type: "input", placeholder: "Ex: R$ 1.500/mês" },
        { name: "prazo", label: "Prazo de entrega", type: "input", placeholder: "Ex: 30 dias" },
        { name: "diferenciais", label: "Diferenciais competitivos", type: "textarea", rows: 2, placeholder: "Por que escolher vocês?" },
        { name: "contexto", label: "Contexto adicional", type: "textarea", rows: 2, placeholder: "Histórico, reunião anterior, etc." },
      ],
    },
    {
      id: "objecoes",
      label: "Treinamento de Objeções",
      description: "Simula respostas a objeções de clientes com scripts prontos para usar.",
      fields: [
        { name: "produto", label: "Produto / Serviço *", type: "input", required: true, placeholder: "Ex: Software de gestão financeira" },
        { name: "objecao", label: "Objeção do cliente *", type: "textarea", required: true, rows: 2, placeholder: "Ex: Está muito caro para o nosso budget atual" },
        { name: "perfil", label: "Perfil do cliente", type: "input", placeholder: "Ex: CFO de empresa de médio porte" },
        { name: "contexto", label: "Contexto da negociação", type: "input", placeholder: "Ex: 2ª reunião, já enviamos proposta" },
      ],
    },
  ],

  marketing: [
    {
      id: "calendario_conteudo",
      label: "Calendário de Conteúdo",
      description: "Planeja semanas de conteúdo por canal com ganchos, formatos e CTAs.",
      fields: [
        { name: "segmento", label: "Segmento / Nicho *", type: "input", required: true, placeholder: "Ex: Contabilidade para MEIs" },
        { name: "publico", label: "Público-alvo *", type: "input", required: true, placeholder: "Ex: Empreendedores iniciantes" },
        { name: "empresa", label: "Empresa / Marca", type: "input", placeholder: "Nome da marca" },
        { name: "canais", label: "Canais", type: "input", placeholder: "Instagram, LinkedIn, YouTube..." },
        { name: "periodo", label: "Período", type: "input", placeholder: "Ex: Próximas 4 semanas" },
        { name: "objetivo", label: "Objetivo principal", type: "input", placeholder: "Ex: Aumentar seguidores e gerar leads" },
        { name: "tom", label: "Tom de comunicação", type: "input", placeholder: "Ex: Educativo e próximo" },
      ],
    },
    {
      id: "copy",
      label: "Copy Persuasivo",
      description: "Gera 3 variações de copy (emocional, racional e urgência) para posts e anúncios.",
      fields: [
        { name: "produto", label: "Produto / Serviço *", type: "input", required: true, placeholder: "Ex: Curso online de Excel" },
        { name: "publico", label: "Público-alvo *", type: "input", required: true, placeholder: "Ex: Profissionais de administração" },
        { name: "formato", label: "Formato", type: "input", placeholder: "Post Instagram / E-mail / Anúncio Meta Ads" },
        { name: "objetivo", label: "Objetivo", type: "input", placeholder: "Ex: Gerar inscrições" },
        { name: "tom", label: "Tom", type: "input", placeholder: "Ex: Direto e motivacional" },
        { name: "diferencial", label: "Diferencial principal", type: "input", placeholder: "Ex: Certificado reconhecido + suporte vitalício" },
        { name: "cta", label: "CTA desejado", type: "input", placeholder: "Ex: Garanta sua vaga agora" },
      ],
    },
    {
      id: "brief_campanha",
      label: "Brief de Campanha",
      description: "Cria brief completo com persona, USP, mix de canais, KPIs e cronograma.",
      fields: [
        { name: "produto", label: "Produto / Serviço *", type: "input", required: true, placeholder: "Ex: Aplicativo de delivery regional" },
        { name: "objetivo", label: "Objetivo da campanha *", type: "input", required: true, placeholder: "Ex: Aquisição de 500 novos usuários em 30 dias" },
        { name: "publico", label: "Público-alvo *", type: "input", required: true, placeholder: "Ex: Homens 25-40 anos, cidades do interior" },
        { name: "budget", label: "Budget disponível", type: "input", placeholder: "Ex: R$ 15.000" },
        { name: "periodo", label: "Período da campanha", type: "input", placeholder: "Ex: 30 dias — junho/2025" },
        { name: "canais", label: "Canais disponíveis", type: "input", placeholder: "Ex: Meta Ads, Google, e-mail" },
        { name: "concorrencia", label: "Concorrência principal", type: "input", placeholder: "Ex: iFood, Rappi" },
      ],
    },
  ],

  financeiro: [
    {
      id: "analise_dre",
      label: "Análise de DRE",
      description: "Calcula margens, EBITDA e gera análise vertical com recomendações.",
      fields: [
        { name: "receita_bruta", label: "Receita Bruta (R$) *", type: "input", required: true, placeholder: "Ex: 150000" },
        { name: "despesas_op", label: "Despesas Operacionais (R$) *", type: "input", required: true, placeholder: "Ex: 40000" },
        { name: "deducoes", label: "Deduções / Impostos (R$)", type: "input", placeholder: "Ex: 12000" },
        { name: "cmv", label: "CMV / CPV (R$)", type: "input", placeholder: "Ex: 60000" },
        { name: "despesas_admin", label: "Despesas Administrativas (R$)", type: "input", placeholder: "Ex: 15000" },
        { name: "despesas_pessoal", label: "Despesas com Pessoal (R$)", type: "input", placeholder: "Ex: 30000" },
        { name: "outras_despesas", label: "Outras despesas (R$)", type: "input", placeholder: "Ex: 5000" },
        { name: "periodo", label: "Período", type: "input", placeholder: "Ex: Março/2025" },
        { name: "setor", label: "Setor da empresa", type: "input", placeholder: "Ex: Varejo / SaaS / Indústria" },
      ],
    },
    {
      id: "fluxo_caixa",
      label: "Projeção de Fluxo de Caixa",
      description: "Projeta fluxo em 3 cenários (otimista, realista, pessimista) com burn rate e runway.",
      fields: [
        { name: "saldo_inicial", label: "Saldo inicial (R$) *", type: "input", required: true, placeholder: "Ex: 50000" },
        { name: "receitas_recorrentes", label: "Receitas recorrentes mensais (R$) *", type: "input", required: true, placeholder: "Ex: 80000" },
        { name: "custos_fixos", label: "Custos fixos mensais (R$) *", type: "input", required: true, placeholder: "Ex: 45000" },
        { name: "receitas_variaveis", label: "Receitas variáveis previstas (R$)", type: "input", placeholder: "Ex: 20000" },
        { name: "custos_variaveis", label: "Custos variáveis (R$)", type: "input", placeholder: "Ex: 10000" },
        { name: "contas_receber", label: "Contas a receber — próximo mês (R$)", type: "input", placeholder: "Ex: 15000" },
        { name: "contas_pagar", label: "Contas a pagar — próximo mês (R$)", type: "input", placeholder: "Ex: 8000" },
        { name: "periodo", label: "Período de projeção", type: "input", placeholder: "Ex: 3 meses" },
      ],
    },
    {
      id: "break_even",
      label: "Ponto de Equilíbrio",
      description: "Calcula break-even contábil, financeiro e econômico com análise de sensibilidade.",
      fields: [
        { name: "custos_fixos", label: "Custos Fixos Mensais (R$) *", type: "input", required: true, placeholder: "Ex: 25000" },
        { name: "preco_venda", label: "Preço de Venda Unitário (R$) *", type: "input", required: true, placeholder: "Ex: 150" },
        { name: "custo_variavel", label: "Custo Variável Unitário (R$) *", type: "input", required: true, placeholder: "Ex: 60" },
        { name: "produto", label: "Produto / Serviço", type: "input", placeholder: "Ex: Assinatura mensal do software" },
        { name: "capacidade", label: "Capacidade máxima mensal", type: "input", placeholder: "Ex: 500 unidades" },
        { name: "setor", label: "Setor", type: "input", placeholder: "Ex: SaaS / Varejo / Serviços" },
      ],
    },
  ],

  administrativo: [
    {
      id: "ata_reuniao",
      label: "Ata de Reunião",
      description: "Transforma notas em ata formal com decisões, ações e responsáveis.",
      fields: [
        { name: "pauta", label: "Título / Pauta da reunião *", type: "input", required: true, placeholder: "Ex: Alinhamento estratégico Q2 2025" },
        { name: "transcricao", label: "Notas / Transcrição da reunião *", type: "textarea", required: true, rows: 6, placeholder: "Cole aqui o conteúdo discutido, decisões tomadas, quem falou o quê..." },
        { name: "data_hora", label: "Data e horário", type: "input", placeholder: "Ex: 28/04/2025 às 14h" },
        { name: "local", label: "Local / Plataforma", type: "input", placeholder: "Ex: Sala de reuniões / Google Meet" },
        { name: "participantes", label: "Participantes", type: "input", placeholder: "Ex: João (CEO), Maria (RH), Pedro (Comercial)" },
        { name: "proxima_reuniao", label: "Próxima reunião", type: "input", placeholder: "Ex: 05/05/2025 às 10h" },
      ],
    },
    {
      id: "resumo_contrato",
      label: "Resumo de Contrato",
      description: "Analisa contratos e destaca pontos críticos, obrigações e riscos.",
      fields: [
        { name: "conteudo", label: "Conteúdo / Trechos do contrato *", type: "textarea", required: true, rows: 8, placeholder: "Cole aqui o texto do contrato ou os trechos mais relevantes..." },
        { name: "tipo_contrato", label: "Tipo de contrato", type: "input", placeholder: "Ex: Contrato de prestação de serviços" },
        { name: "partes", label: "Partes envolvidas", type: "input", placeholder: "Ex: Empresa ABC (contratante) e XYZ Ltda (contratada)" },
        { name: "foco", label: "Foco da análise", type: "input", placeholder: "Ex: Cláusulas de rescisão e penalidades" },
      ],
    },
    {
      id: "mapeador_processo",
      label: "Mapeador de Processos",
      description: "Mapeia, documenta e otimiza processos com fluxograma, gargalos e KPIs.",
      fields: [
        { name: "nome_processo", label: "Nome do processo *", type: "input", required: true, placeholder: "Ex: Onboarding de novos clientes" },
        { name: "descricao", label: "Descrição atual do processo *", type: "textarea", required: true, rows: 5, placeholder: "Descreva como o processo funciona hoje, passo a passo..." },
        { name: "departamento", label: "Departamento responsável", type: "input", placeholder: "Ex: Customer Success" },
        { name: "problema", label: "Problema / dor atual", type: "input", placeholder: "Ex: Processo demora muito e gera retrabalho" },
        { name: "frequencia", label: "Frequência", type: "input", placeholder: "Ex: Diário / Semanal / Por demanda" },
        { name: "pessoas", label: "Pessoas envolvidas", type: "input", placeholder: "Ex: CS, Suporte, Financeiro (3 pessoas)" },
      ],
    },
  ],
};

// ─── Shared styles ────────────────────────────────────────────────────────────

const FIELD_STYLE: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "6px",
  color: "#EBEBEB",
  fontSize: "13px",
  padding: "8px 11px",
  fontFamily: "inherit",
  outline: "none",
  resize: "vertical",
  lineHeight: 1.5,
  boxSizing: "border-box",
};

// ─── ToolCard ─────────────────────────────────────────────────────────────────

function ToolCard({ tool }: { tool: ToolDef }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input: Record<string, string> = {};
    tool.fields.forEach((f) => {
      input[f.name] = (fd.get(f.name) as string) ?? "";
    });

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: tool.id, input }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "token_blocked") {
          setError("Tokens esgotados. Contate o administrador para recarregar.");
        } else {
          setError(data.error ?? "Erro ao gerar conteúdo.");
        }
        return;
      }

      setResult(data.content ?? "");
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!result) return;
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{
      background: "#161616",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: "10px",
      overflow: "hidden",
    }}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          background: "none",
          border: "none",
          cursor: "pointer",
          gap: "12px",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "8px",
            background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Zap style={{ width: "14px", height: "14px", color: "#10B981" }} strokeWidth={2} />
          </div>
          <div>
            <p style={{ color: "#EBEBEB", fontSize: "14px", fontWeight: 600, margin: 0 }}>
              {tool.label}
            </p>
            <p style={{ color: "#555", fontSize: "12px", margin: "2px 0 0" }}>
              {tool.description}
            </p>
          </div>
        </div>
        <ChevronDown
          style={{
            width: "15px", height: "15px", color: "#555", flexShrink: 0,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
          strokeWidth={2}
        />
      </button>

      {/* Body */}
      {open && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <form onSubmit={handleSubmit} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {tool.fields.map((field) => {
                const isWide = field.type === "textarea" || field.name === "transcricao" || field.name === "conteudo" || field.name === "descricao";
                return (
                  <div key={field.name} style={{ gridColumn: isWide ? "1 / -1" : undefined, display: "flex", flexDirection: "column", gap: "5px" }}>
                    <label style={{ color: "#888", fontSize: "11px", fontWeight: 500 }}>
                      {field.label}
                    </label>
                    {field.type === "textarea" ? (
                      <textarea
                        name={field.name}
                        required={field.required}
                        rows={field.rows ?? 3}
                        placeholder={field.placeholder}
                        style={{ ...FIELD_STYLE, minHeight: `${(field.rows ?? 3) * 24}px` }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(16,185,129,0.4)"; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
                      />
                    ) : (
                      <input
                        name={field.name}
                        required={field.required}
                        placeholder={field.placeholder}
                        style={{ ...FIELD_STYLE, height: "36px", resize: "none" }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(16,185,129,0.4)"; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  height: "36px", padding: "0 20px", borderRadius: "6px",
                  background: loading ? "rgba(16,185,129,0.5)" : "#10B981",
                  color: "#000", fontWeight: 700, fontSize: "13px",
                  border: "none", cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {loading && <Loader2 style={{ width: "14px", height: "14px" }} className="animate-spin" />}
                {loading ? "Gerando..." : "Gerar"}
              </button>

              {error && (
                <span style={{ color: "#F87171", fontSize: "13px" }}>{error}</span>
              )}
            </div>
          </form>

          {/* Result */}
          {result !== null && (
            <div style={{
              margin: "0 20px 20px",
              background: "#111",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "8px",
              overflow: "hidden",
            }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(255,255,255,0.02)",
              }}>
                <span style={{ color: "#555", fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em" }}>
                  RESULTADO
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "5px",
                    height: "26px", padding: "0 10px", borderRadius: "5px",
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                    color: copied ? "#10B981" : "#888", fontSize: "11px", fontWeight: 500,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  {copied
                    ? <><CheckCheck style={{ width: "11px", height: "11px" }} strokeWidth={2} /> Copiado</>
                    : <><Copy style={{ width: "11px", height: "11px" }} strokeWidth={2} /> Copiar</>
                  }
                </button>
              </div>
              <div style={{
                padding: "16px",
                maxHeight: "480px",
                overflowY: "auto",
                color: "#CCCCCC",
                fontSize: "13px",
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
                fontFamily: "var(--font-geist-mono, monospace)",
              }}>
                {result}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── WorkspaceFerramentas ─────────────────────────────────────────────────────

interface WorkspaceFerramentasProps {
  agentType: string;
}

export function WorkspaceFerramentas({ agentType }: WorkspaceFerramentasProps) {
  const tools = SECTOR_TOOLS[agentType] ?? [];

  if (tools.length === 0) {
    return (
      <div style={{
        padding: "48px 24px", textAlign: "center",
        color: "#444", fontSize: "14px",
      }}>
        Nenhuma ferramenta disponível para este setor ainda.
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ marginBottom: "8px" }}>
        <h2 style={{ color: "#EBEBEB", fontSize: "15px", fontWeight: 600, margin: 0 }}>
          Ferramentas de IA
        </h2>
        <p style={{ color: "#555", fontSize: "13px", marginTop: "4px" }}>
          Geração de conteúdo especializado. Expanda uma ferramenta, preencha os campos e clique em Gerar.
        </p>
      </div>

      {tools.map((tool) => (
        <ToolCard key={tool.id} tool={tool} />
      ))}
    </div>
  );
}
