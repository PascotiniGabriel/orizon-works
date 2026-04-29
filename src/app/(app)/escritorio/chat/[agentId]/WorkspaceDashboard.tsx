"use client";

import { useState } from "react";
import {
  Users, TrendingUp, TrendingDown, Target, DollarSign,
  Megaphone, FolderOpen, AlertCircle, CheckCircle2, Clock,
  BarChart3, ArrowUpRight, ArrowDownRight, Minus,
} from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color?: string;
}

function KpiCard({ label, value, subtitle, trend, trendValue, color = "#10B981" }: KpiCardProps) {
  const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;
  const trendColor = trend === "up" ? "#10B981" : trend === "down" ? "#F87171" : "#888";

  return (
    <div style={{
      background: "#161616", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: "10px", padding: "18px 20px",
    }}>
      <p style={{ color: "#555", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>
        {label}
      </p>
      <p style={{ color: "#EBEBEB", fontSize: "28px", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1 }}>
        {value}
      </p>
      {(subtitle || trendValue) && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px" }}>
          {trendValue && (
            <span style={{ display: "flex", alignItems: "center", gap: "2px", color: trendColor, fontSize: "12px", fontWeight: 600 }}>
              <TrendIcon style={{ width: "13px", height: "13px" }} strokeWidth={2.5} />
              {trendValue}
            </span>
          )}
          {subtitle && <span style={{ color: "#444", fontSize: "12px" }}>{subtitle}</span>}
        </div>
      )}
    </div>
  );
}

interface MetaBarProps {
  label: string;
  current: number;
  target: number;
  unit?: string;
  color?: string;
}

function MetaBar({ label, current, target, unit = "", color = "#10B981" }: MetaBarProps) {
  const pct = Math.min((current / target) * 100, 100);
  const barColor = pct >= 80 ? "#10B981" : pct >= 50 ? "#FBBF24" : "#F87171";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ color: "#888", fontSize: "13px" }}>{label}</span>
        <span style={{ color: "#EBEBEB", fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-geist-mono)" }}>
          {current.toLocaleString("pt-BR")}{unit} / {target.toLocaleString("pt-BR")}{unit}
        </span>
      </div>
      <div style={{ height: "4px", background: "rgba(255,255,255,0.07)", borderRadius: "2px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: "2px", transition: "width 0.6s ease" }} />
      </div>
      <span style={{ color: barColor, fontSize: "11px", fontWeight: 600 }}>{pct.toFixed(0)}% da meta</span>
    </div>
  );
}

interface KpiInputProps {
  label: string;
  name: string;
  placeholder?: string;
  prefix?: string;
}

function KpiInput({ label, name, placeholder, prefix }: KpiInputProps) {
  return (
    <div>
      <label style={{ color: "#555", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "5px" }}>
        {label}
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", padding: "0 10px", height: "34px" }}>
        {prefix && <span style={{ color: "#555", fontSize: "13px" }}>{prefix}</span>}
        <input
          name={name}
          placeholder={placeholder ?? "0"}
          style={{ background: "none", border: "none", color: "#EBEBEB", fontSize: "14px", outline: "none", flex: 1, fontFamily: "var(--font-geist-mono)" }}
        />
      </div>
    </div>
  );
}

// ── Dashboard RH ─────────────────────────────────────────────────────────────
function RHDashboard() {
  const [kpis, setKpis] = useState<Record<string, number> | null>(null);
  const [form, setForm] = useState(false);

  function calcular(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const v = (k: string) => Number(fd.get(k) || 0);
    const headcount = v("headcount");
    const admitidos = v("admitidos");
    const demitidos = v("demitidos");
    const vagas = v("vagas");
    const tempoMedio = v("tempo_contratacao");
    const custo = v("custo_contratacao");

    const turnover = headcount > 0 ? ((demitidos / headcount) * 100) : 0;
    const crescimento = headcount > 0 ? ((admitidos - demitidos) / headcount) * 100 : 0;

    setKpis({ headcount, admitidos, demitidos, vagas, tempoMedio, custo, turnover, crescimento });
    setForm(false);
  }

  if (!kpis) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", gap: "16px" }}>
      <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Users style={{ width: "22px", height: "22px", color: "#A78BFA" }} strokeWidth={1.75} />
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "#EBEBEB", fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Dashboard de RH</p>
        <p style={{ color: "#555", fontSize: "14px" }}>Insira os dados do mês para visualizar seus KPIs de RH.</p>
      </div>
      <button onClick={() => setForm(true)} style={{ height: "38px", padding: "0 20px", background: "#A78BFA", color: "#000", fontWeight: 700, fontSize: "13px", borderRadius: "6px", border: "none", cursor: "pointer" }}>
        Inserir dados do mês
      </button>

      {form && (
        <form onSubmit={calcular} style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", padding: "24px", width: "100%", maxWidth: "500px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <p style={{ color: "#EBEBEB", fontSize: "14px", fontWeight: 600 }}>Dados do mês</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <KpiInput label="Headcount total" name="headcount" />
            <KpiInput label="Vagas abertas" name="vagas" />
            <KpiInput label="Admissões no mês" name="admitidos" />
            <KpiInput label="Demissões no mês" name="demitidos" />
            <KpiInput label="Tempo médio contrat. (dias)" name="tempo_contratacao" />
            <KpiInput label="Custo médio por contrat." name="custo_contratacao" prefix="R$" />
          </div>
          <button type="submit" style={{ height: "36px", background: "#A78BFA", color: "#000", fontWeight: 700, fontSize: "13px", borderRadius: "6px", border: "none", cursor: "pointer" }}>
            Calcular KPIs
          </button>
        </form>
      )}
    </div>
  );

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px", maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ color: "#EBEBEB", fontSize: "16px", fontWeight: 600 }}>KPIs de RH — Mês Atual</h2>
        <button onClick={() => setKpis(null)} style={{ color: "#555", fontSize: "12px", background: "none", border: "none", cursor: "pointer" }}>Atualizar dados</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        <KpiCard label="Headcount" value={kpis.headcount.toString()} subtitle="colaboradores ativos" />
        <KpiCard label="Vagas Abertas" value={kpis.vagas.toString()} subtitle="posições em aberto" color="#A78BFA" />
        <KpiCard label="Admissões" value={kpis.admitidos.toString()} trend="up" trendValue={`+${kpis.admitidos}`} />
        <KpiCard label="Demissões" value={kpis.demitidos.toString()} trend={kpis.demitidos > 0 ? "down" : "neutral"} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
        <KpiCard
          label="Turnover Mensal"
          value={`${kpis.turnover.toFixed(1)}%`}
          trend={kpis.turnover > 5 ? "down" : "up"}
          trendValue={kpis.turnover > 5 ? "Acima do ideal" : "Dentro do ideal"}
          subtitle="ideal: < 5%/mês"
        />
        <KpiCard
          label="Crescimento de Equipe"
          value={`${kpis.crescimento > 0 ? "+" : ""}${kpis.crescimento.toFixed(1)}%`}
          trend={kpis.crescimento >= 0 ? "up" : "down"}
        />
        <KpiCard
          label="Tempo Médio Contrat."
          value={`${kpis.tempoMedio}d`}
          trend={kpis.tempoMedio > 30 ? "down" : "up"}
          subtitle="dias até contratação"
        />
      </div>

      {kpis.custo > 0 && (
        <div style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", padding: "20px" }}>
          <p style={{ color: "#555", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>Custo de Recrutamento</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <p style={{ color: "#888", fontSize: "13px" }}>Custo médio por contratação</p>
              <p style={{ color: "#EBEBEB", fontSize: "24px", fontWeight: 700, letterSpacing: "-0.03em" }}>R$ {kpis.custo.toLocaleString("pt-BR")}</p>
            </div>
            <div>
              <p style={{ color: "#888", fontSize: "13px" }}>Custo total do mês</p>
              <p style={{ color: "#EBEBEB", fontSize: "24px", fontWeight: 700, letterSpacing: "-0.03em" }}>R$ {(kpis.custo * kpis.admitidos).toLocaleString("pt-BR")}</p>
            </div>
          </div>
        </div>
      )}

      <div style={{ background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.15)", borderRadius: "8px", padding: "14px 16px" }}>
        <p style={{ color: "#A78BFA", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Análise Rápida</p>
        <ul style={{ color: "#888", fontSize: "13px", lineHeight: 1.7, paddingLeft: "16px", margin: 0 }}>
          {kpis.turnover > 5 && <li>Turnover elevado ({kpis.turnover.toFixed(1)}%) — identifique os motivos das saídas com pesquisa de desligamento.</li>}
          {kpis.vagas > kpis.headcount * 0.1 && <li>Volume alto de vagas abertas ({kpis.vagas}) — considere priorizar vagas críticas.</li>}
          {kpis.tempoMedio > 30 && <li>Tempo de contratação ({kpis.tempoMedio} dias) acima do ideal — revise o funil de seleção.</li>}
          {kpis.turnover <= 5 && kpis.tempoMedio <= 30 && <li>KPIs dentro dos parâmetros ideais. Continue monitorando mensalmente.</li>}
        </ul>
      </div>
    </div>
  );
}

// ── Dashboard Comercial ───────────────────────────────────────────────────────
function ComercialDashboard() {
  const [kpis, setKpis] = useState<Record<string, number> | null>(null);

  function calcular(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const v = (k: string) => Number(fd.get(k) || 0);
    const meta = v("meta"); const realizado = v("realizado");
    const propostas = v("propostas"); const fechamentos = v("fechamentos");
    const leads = v("leads"); const ticketMedio = v("ticket_medio");
    const pipeline = v("pipeline");

    const atingimento = meta > 0 ? (realizado / meta) * 100 : 0;
    const winRate = propostas > 0 ? (fechamentos / propostas) * 100 : 0;
    const conversao = leads > 0 ? (fechamentos / leads) * 100 : 0;

    setKpis({ meta, realizado, propostas, fechamentos, leads, ticketMedio, pipeline, atingimento, winRate, conversao });
  }

  if (!kpis) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", gap: "16px" }}>
      <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <TrendingUp style={{ width: "22px", height: "22px", color: "#60A5FA" }} strokeWidth={1.75} />
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "#EBEBEB", fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Dashboard Comercial</p>
        <p style={{ color: "#555", fontSize: "14px" }}>Insira os dados de vendas do mês.</p>
      </div>
      <form onSubmit={calcular} style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", padding: "24px", width: "100%", maxWidth: "520px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <KpiInput label="Meta de receita (R$)" name="meta" />
          <KpiInput label="Receita realizada (R$)" name="realizado" />
          <KpiInput label="Propostas enviadas" name="propostas" />
          <KpiInput label="Fechamentos (deals)" name="fechamentos" />
          <KpiInput label="Leads no mês" name="leads" />
          <KpiInput label="Ticket médio (R$)" name="ticket_medio" />
          <KpiInput label="Pipeline total (R$)" name="pipeline" />
        </div>
        <button type="submit" style={{ height: "36px", background: "#60A5FA", color: "#000", fontWeight: 700, fontSize: "13px", borderRadius: "6px", border: "none", cursor: "pointer" }}>
          Calcular KPIs
        </button>
      </form>
    </div>
  );

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px", maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ color: "#EBEBEB", fontSize: "16px", fontWeight: 600 }}>KPIs Comerciais — Mês Atual</h2>
        <button onClick={() => setKpis(null)} style={{ color: "#555", fontSize: "12px", background: "none", border: "none", cursor: "pointer" }}>Atualizar dados</button>
      </div>

      <div style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", padding: "20px" }}>
        <p style={{ color: "#555", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>Atingimento de Meta</p>
        <MetaBar label="Receita" current={kpis.realizado} target={kpis.meta} unit="" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        <KpiCard label="Receita Realizada" value={`R$ ${(kpis.realizado/1000).toFixed(0)}k`} trend={kpis.atingimento >= 100 ? "up" : "down"} trendValue={`${kpis.atingimento.toFixed(0)}% da meta`} />
        <KpiCard label="Win Rate" value={`${kpis.winRate.toFixed(1)}%`} trend={kpis.winRate >= 25 ? "up" : "down"} subtitle="ideal: > 25%" />
        <KpiCard label="Conversão Leads" value={`${kpis.conversao.toFixed(1)}%`} trend={kpis.conversao >= 5 ? "up" : "down"} />
        <KpiCard label="Pipeline" value={`R$ ${(kpis.pipeline/1000).toFixed(0)}k`} subtitle="em negociação" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
        <KpiCard label="Deals Fechados" value={kpis.fechamentos.toString()} trend="up" />
        <KpiCard label="Ticket Médio" value={`R$ ${kpis.ticketMedio.toLocaleString("pt-BR")}`} />
        <KpiCard label="Propostas Enviadas" value={kpis.propostas.toString()} />
      </div>

      <div style={{ background: "rgba(96,165,250,0.05)", border: "1px solid rgba(96,165,250,0.15)", borderRadius: "8px", padding: "14px 16px" }}>
        <p style={{ color: "#60A5FA", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Análise Rápida</p>
        <ul style={{ color: "#888", fontSize: "13px", lineHeight: 1.7, paddingLeft: "16px", margin: 0 }}>
          {kpis.atingimento < 80 && <li>Meta abaixo de 80% — identifique gargalos no funil e acelere o pipeline existente.</li>}
          {kpis.winRate < 25 && <li>Win rate abaixo do ideal ({kpis.winRate.toFixed(1)}%) — revise o processo de qualificação de leads.</li>}
          {kpis.pipeline > kpis.meta * 3 && <li>Pipeline saudável ({((kpis.pipeline / kpis.meta) * 100).toFixed(0)}% da meta) — foque em acelerar o ciclo de vendas.</li>}
          {kpis.atingimento >= 100 && <li>Meta atingida! Pipeline de R$ {kpis.pipeline.toLocaleString("pt-BR")} para o próximo período.</li>}
        </ul>
      </div>
    </div>
  );
}

// ── Dashboard Marketing ───────────────────────────────────────────────────────
function MarketingDashboard() {
  const [kpis, setKpis] = useState<Record<string, number> | null>(null);

  function calcular(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const v = (k: string) => Number(fd.get(k) || 0);
    const metaLeads = v("meta_leads"); const leadsGerados = v("leads_gerados");
    const budget = v("budget"); const gastoAtual = v("gasto_atual");
    const impressoes = v("impressoes"); const cliques = v("cliques");
    const conversoes = v("conversoes"); const seguidores = v("seguidores");

    const ctr = impressoes > 0 ? (cliques / impressoes) * 100 : 0;
    const cpl = leadsGerados > 0 ? gastoAtual / leadsGerados : 0;
    const taxaConv = cliques > 0 ? (conversoes / cliques) * 100 : 0;
    const atingLeads = metaLeads > 0 ? (leadsGerados / metaLeads) * 100 : 0;

    setKpis({ metaLeads, leadsGerados, budget, gastoAtual, impressoes, cliques, conversoes, seguidores, ctr, cpl, taxaConv, atingLeads });
  }

  if (!kpis) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", gap: "16px" }}>
      <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(251,113,133,0.1)", border: "1px solid rgba(251,113,133,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Megaphone style={{ width: "22px", height: "22px", color: "#FB7185" }} strokeWidth={1.75} />
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "#EBEBEB", fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Dashboard de Marketing</p>
        <p style={{ color: "#555", fontSize: "14px" }}>Insira os dados de campanhas do mês.</p>
      </div>
      <form onSubmit={calcular} style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", padding: "24px", width: "100%", maxWidth: "520px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <KpiInput label="Meta de leads" name="meta_leads" />
          <KpiInput label="Leads gerados" name="leads_gerados" />
          <KpiInput label="Budget total (R$)" name="budget" />
          <KpiInput label="Gasto atual (R$)" name="gasto_atual" />
          <KpiInput label="Impressões" name="impressoes" />
          <KpiInput label="Cliques" name="cliques" />
          <KpiInput label="Conversões" name="conversoes" />
          <KpiInput label="Novos seguidores" name="seguidores" />
        </div>
        <button type="submit" style={{ height: "36px", background: "#FB7185", color: "#fff", fontWeight: 700, fontSize: "13px", borderRadius: "6px", border: "none", cursor: "pointer" }}>
          Calcular KPIs
        </button>
      </form>
    </div>
  );

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px", maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ color: "#EBEBEB", fontSize: "16px", fontWeight: 600 }}>KPIs de Marketing — Mês Atual</h2>
        <button onClick={() => setKpis(null)} style={{ color: "#555", fontSize: "12px", background: "none", border: "none", cursor: "pointer" }}>Atualizar dados</button>
      </div>

      <div style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <MetaBar label="Leads Gerados" current={kpis.leadsGerados} target={kpis.metaLeads} />
        <MetaBar label="Budget Utilizado" current={kpis.gastoAtual} target={kpis.budget} unit="" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        <KpiCard label="CTR" value={`${kpis.ctr.toFixed(2)}%`} trend={kpis.ctr >= 2 ? "up" : "down"} subtitle="ideal: > 2%" />
        <KpiCard label="CPL" value={`R$ ${kpis.cpl.toFixed(0)}`} trend={kpis.cpl < 50 ? "up" : "down"} subtitle="custo por lead" />
        <KpiCard label="Taxa Conversão" value={`${kpis.taxaConv.toFixed(1)}%`} trend={kpis.taxaConv >= 3 ? "up" : "down"} />
        <KpiCard label="Novos Seguidores" value={kpis.seguidores.toLocaleString("pt-BR")} trend="up" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
        <KpiCard label="Leads Gerados" value={kpis.leadsGerados.toString()} trendValue={`${kpis.atingLeads.toFixed(0)}% da meta`} trend={kpis.atingLeads >= 80 ? "up" : "down"} />
        <KpiCard label="Impressões" value={kpis.impressoes >= 1000 ? `${(kpis.impressoes/1000).toFixed(1)}k` : kpis.impressoes.toString()} />
        <KpiCard label="Conversões" value={kpis.conversoes.toString()} />
      </div>
    </div>
  );
}

// ── Dashboard Financeiro ──────────────────────────────────────────────────────
function FinanceiroDashboard() {
  const [kpis, setKpis] = useState<Record<string, number> | null>(null);

  function calcular(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const v = (k: string) => Number(fd.get(k) || 0);
    const receita = v("receita"); const custos = v("custos");
    const despesas = v("despesas"); const impostos = v("impostos");
    const caixa = v("caixa"); const contasReceber = v("contas_receber");
    const contasPagar = v("contas_pagar"); const metaReceita = v("meta_receita");

    const lucrobruto = receita - custos;
    const mbf = receita > 0 ? (lucrobruto / receita) * 100 : 0;
    const ebitda = lucrobruto - despesas;
    const mebitda = receita > 0 ? (ebitda / receita) * 100 : 0;
    const lucroLiq = ebitda - impostos;
    const mLiq = receita > 0 ? (lucroLiq / receita) * 100 : 0;
    const atingMeta = metaReceita > 0 ? (receita / metaReceita) * 100 : 0;

    setKpis({ receita, custos, despesas, impostos, caixa, contasReceber, contasPagar, metaReceita, lucrobruto, mbf, ebitda, mebitda, lucroLiq, mLiq, atingMeta });
  }

  if (!kpis) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", gap: "16px" }}>
      <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <DollarSign style={{ width: "22px", height: "22px", color: "#4EDBA4" }} strokeWidth={1.75} />
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "#EBEBEB", fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Dashboard Financeiro</p>
        <p style={{ color: "#555", fontSize: "14px" }}>Insira os dados financeiros do mês.</p>
      </div>
      <form onSubmit={calcular} style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", padding: "24px", width: "100%", maxWidth: "520px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <KpiInput label="Meta de receita (R$)" name="meta_receita" />
          <KpiInput label="Receita bruta (R$)" name="receita" />
          <KpiInput label="CMV / Custos (R$)" name="custos" />
          <KpiInput label="Despesas operac. (R$)" name="despesas" />
          <KpiInput label="Impostos (R$)" name="impostos" />
          <KpiInput label="Saldo em caixa (R$)" name="caixa" />
          <KpiInput label="Contas a receber (R$)" name="contas_receber" />
          <KpiInput label="Contas a pagar (R$)" name="contas_pagar" />
        </div>
        <button type="submit" style={{ height: "36px", background: "#4EDBA4", color: "#000", fontWeight: 700, fontSize: "13px", borderRadius: "6px", border: "none", cursor: "pointer" }}>
          Calcular KPIs
        </button>
      </form>
    </div>
  );

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px", maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ color: "#EBEBEB", fontSize: "16px", fontWeight: 600 }}>KPIs Financeiros — Mês Atual</h2>
        <button onClick={() => setKpis(null)} style={{ color: "#555", fontSize: "12px", background: "none", border: "none", cursor: "pointer" }}>Atualizar dados</button>
      </div>

      {kpis.metaReceita > 0 && (
        <div style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", padding: "20px" }}>
          <MetaBar label="Atingimento de Meta de Receita" current={kpis.receita} target={kpis.metaReceita} />
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        <KpiCard label="Receita Bruta" value={`R$ ${(kpis.receita/1000).toFixed(0)}k`} />
        <KpiCard label="Lucro Bruto" value={`R$ ${(kpis.lucrobruto/1000).toFixed(0)}k`} trend={kpis.lucrobruto > 0 ? "up" : "down"} trendValue={`MB: ${kpis.mbf.toFixed(1)}%`} />
        <KpiCard label="EBITDA" value={`R$ ${(kpis.ebitda/1000).toFixed(0)}k`} trend={kpis.ebitda > 0 ? "up" : "down"} trendValue={`${kpis.mebitda.toFixed(1)}%`} />
        <KpiCard label="Lucro Líquido" value={`R$ ${(kpis.lucroLiq/1000).toFixed(0)}k`} trend={kpis.lucroLiq > 0 ? "up" : "down"} trendValue={`ML: ${kpis.mLiq.toFixed(1)}%`} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
        <KpiCard label="Caixa Disponível" value={`R$ ${(kpis.caixa/1000).toFixed(0)}k`} trend={kpis.caixa > 0 ? "up" : "down"} />
        <KpiCard label="A Receber" value={`R$ ${(kpis.contasReceber/1000).toFixed(0)}k`} subtitle="contas a receber" />
        <KpiCard label="A Pagar" value={`R$ ${(kpis.contasPagar/1000).toFixed(0)}k`} subtitle="contas a pagar" trend={kpis.contasPagar > kpis.caixa ? "down" : "neutral"} />
      </div>

      <div style={{ background: "rgba(78,219,164,0.05)", border: "1px solid rgba(78,219,164,0.15)", borderRadius: "8px", padding: "14px 16px" }}>
        <p style={{ color: "#4EDBA4", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Análise Rápida</p>
        <ul style={{ color: "#888", fontSize: "13px", lineHeight: 1.7, paddingLeft: "16px", margin: 0 }}>
          {kpis.mbf < 30 && <li>Margem bruta baixa ({kpis.mbf.toFixed(1)}%) — revise precificação ou corte CMV.</li>}
          {kpis.contasPagar > kpis.caixa && <li>⚠️ Contas a pagar (R$ {kpis.contasPagar.toLocaleString("pt-BR")}) superam caixa — risco de inadimplência.</li>}
          {kpis.lucroLiq > 0 && kpis.mLiq >= 10 && <li>Margem líquida saudável ({kpis.mLiq.toFixed(1)}%). Boa performance operacional.</li>}
          {kpis.ebitda < 0 && <li>EBITDA negativo — operação consumindo caixa. Revisão urgente de custos necessária.</li>}
        </ul>
      </div>
    </div>
  );
}

// ── Dashboard Administrativo ──────────────────────────────────────────────────
function AdministrativoDashboard() {
  const [kpis, setKpis] = useState<Record<string, number | string> | null>(null);

  function calcular(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const v = (k: string) => Number(fd.get(k) || 0);
    const s = (k: string) => (fd.get(k) as string) || "";
    setKpis({
      contratos: v("contratos"), contratos_vencer: v("contratos_vencer"),
      reunioes: v("reunioes"), tarefas: v("tarefas"), tarefas_concluidas: v("tarefas_concluidas"),
      processos: v("processos"), custo_operacional: v("custo_operacional"),
      meta_custo: v("meta_custo"), prioridade: s("prioridade"),
    });
  }

  if (!kpis) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", gap: "16px" }}>
      <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <FolderOpen style={{ width: "22px", height: "22px", color: "#FBBF24" }} strokeWidth={1.75} />
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "#EBEBEB", fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Dashboard Administrativo</p>
        <p style={{ color: "#555", fontSize: "14px" }}>Insira os dados operacionais do mês.</p>
      </div>
      <form onSubmit={calcular} style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", padding: "24px", width: "100%", maxWidth: "520px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <KpiInput label="Contratos ativos" name="contratos" />
          <KpiInput label="Contratos a vencer (30d)" name="contratos_vencer" />
          <KpiInput label="Reuniões no mês" name="reunioes" />
          <KpiInput label="Tarefas abertas" name="tarefas" />
          <KpiInput label="Tarefas concluídas" name="tarefas_concluidas" />
          <KpiInput label="Processos mapeados" name="processos" />
          <KpiInput label="Custo operacional (R$)" name="custo_operacional" />
          <KpiInput label="Meta de custo (R$)" name="meta_custo" />
        </div>
        <div>
          <label style={{ color: "#555", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "5px" }}>Prioridade do mês</label>
          <input name="prioridade" placeholder="Ex: Renovação de contratos de TI" style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", padding: "0 10px", height: "34px", color: "#EBEBEB", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
        </div>
        <button type="submit" style={{ height: "36px", background: "#FBBF24", color: "#000", fontWeight: 700, fontSize: "13px", borderRadius: "6px", border: "none", cursor: "pointer" }}>
          Calcular KPIs
        </button>
      </form>
    </div>
  );

  const taxaTarefas = Number(kpis.tarefas) > 0 ? (Number(kpis.tarefas_concluidas) / Number(kpis.tarefas)) * 100 : 0;
  const controleCusto = Number(kpis.meta_custo) > 0 ? (Number(kpis.custo_operacional) / Number(kpis.meta_custo)) * 100 : 0;

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px", maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ color: "#EBEBEB", fontSize: "16px", fontWeight: 600 }}>KPIs Administrativos — Mês Atual</h2>
        <button onClick={() => setKpis(null)} style={{ color: "#555", fontSize: "12px", background: "none", border: "none", cursor: "pointer" }}>Atualizar dados</button>
      </div>

      {kpis.prioridade && (
        <div style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: "8px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px" }}>
          <Target style={{ width: "16px", height: "16px", color: "#FBBF24", flexShrink: 0 }} strokeWidth={2} />
          <p style={{ color: "#FBBF24", fontSize: "13px", fontWeight: 600 }}>Prioridade: {String(kpis.prioridade)}</p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        <KpiCard label="Contratos Ativos" value={String(kpis.contratos)} />
        <KpiCard label="A Vencer (30d)" value={String(kpis.contratos_vencer)} trend={Number(kpis.contratos_vencer) > 3 ? "down" : "neutral"} subtitle="atenção necessária" />
        <KpiCard label="Reuniões" value={String(kpis.reunioes)} subtitle="no mês" />
        <KpiCard label="Processos Mapeados" value={String(kpis.processos)} />
      </div>

      <div style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <MetaBar label="Tarefas Concluídas" current={Number(kpis.tarefas_concluidas)} target={Number(kpis.tarefas)} />
        {Number(kpis.meta_custo) > 0 && <MetaBar label="Controle de Custo Operacional" current={Number(kpis.custo_operacional)} target={Number(kpis.meta_custo)} />}
      </div>
    </div>
  );
}

// ── Dispatcher principal ──────────────────────────────────────────────────────
export function WorkspaceDashboard({ agentType, agentDisplayName }: { agentType: string; agentDisplayName: string }) {
  switch (agentType) {
    case "rh":            return <RHDashboard />;
    case "comercial":     return <ComercialDashboard />;
    case "marketing":     return <MarketingDashboard />;
    case "financeiro":    return <FinanceiroDashboard />;
    case "administrativo": return <AdministrativoDashboard />;
    default: return (
      <div style={{ padding: "60px 24px", textAlign: "center", color: "#555" }}>
        <BarChart3 style={{ width: "40px", height: "40px", margin: "0 auto 12px", opacity: 0.3 }} />
        <p>Dashboard para {agentDisplayName} em breve.</p>
      </div>
    );
  }
}
