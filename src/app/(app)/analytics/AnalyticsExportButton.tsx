"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { tokensToCredits, formatCredits } from "@/lib/utils/credits";

interface Props {
  companyName: string;
  year: number;
  month: number;
}

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function AnalyticsExportButton({ companyName, year, month }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/report?year=${year}&month=${month}`);
      if (!res.ok) throw new Error("Falha ao gerar relatório");
      const data = await res.json();

      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const W = 210;
      const margin = 20;
      let y = margin;

      // Topo emerald
      doc.setFillColor(16, 185, 129);
      doc.rect(0, 0, W, 10, "F");
      doc.setFontSize(7);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text("ORIZON WORKS · RELATÓRIO DE IMPACTO IA", margin, 7);

      y = 24;

      // Título
      doc.setFontSize(20);
      doc.setTextColor(25, 25, 25);
      doc.setFont("helvetica", "bold");
      doc.text("Relatório de Impacto IA", margin, y);
      y += 9;

      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "normal");
      doc.text(`${MONTHS_PT[month - 1]} ${year}  ·  ${companyName}`, margin, y);
      y += 12;

      doc.setDrawColor(220, 220, 220);
      doc.line(margin, y, W - margin, y);
      y += 10;

      // KPIs
      doc.setFontSize(11);
      doc.setTextColor(25, 25, 25);
      doc.setFont("helvetica", "bold");
      doc.text("Métricas do Período", margin, y);
      y += 8;

      const kpis: [string, string][] = [
        ["Sessões realizadas", String(data.totalSessions)],
        ["Mensagens trocadas", String(data.totalMessages)],
        ["Horas economizadas", `${data.hoursSaved}h`],
        ["Valor estimado gerado", data.valueFormatted],
        ["Créditos utilizados", formatCredits(tokensToCredits(data.totalTokensUsed))],
        ["Documentos indexados", String(data.ragDocumentsCount)],
        ["Tarefas criadas", String(data.tasksCreated)],
      ];

      doc.setFontSize(10);
      for (const [label, value] of kpis) {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 80, 80);
        doc.text(label, margin + 4, y);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(25, 25, 25);
        doc.text(value, W - margin, y, { align: "right" });
        y += 7;
      }

      y += 6;
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, y, W - margin, y);
      y += 10;

      // Uso por agente
      if (data.agentUsage?.length) {
        doc.setFontSize(11);
        doc.setTextColor(25, 25, 25);
        doc.setFont("helvetica", "bold");
        doc.text("Uso por Agente", margin, y);
        y += 8;

        doc.setFontSize(10);
        for (const agent of data.agentUsage) {
          if (agent.sessions === 0) continue;
          doc.setFont("helvetica", "normal");
          doc.setTextColor(60, 60, 60);
          const name = agent.agentName ?? agent.agentType;
          doc.text(`${name}`, margin + 4, y);
          doc.setTextColor(100, 100, 100);
          doc.text(`${agent.sessions} sessões`, W - margin, y, { align: "right" });
          y += 7;
        }

        y += 4;
        doc.setDrawColor(220, 220, 220);
        doc.line(margin, y, W - margin, y);
        y += 10;
      }

      // Resumo executivo
      if (data.summary) {
        doc.setFontSize(11);
        doc.setTextColor(25, 25, 25);
        doc.setFont("helvetica", "bold");
        doc.text("Resumo Executivo", margin, y);
        y += 8;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(55, 55, 55);

        const lines = doc.splitTextToSize(data.summary, W - margin * 2);
        for (const line of lines) {
          if (y > 262) { doc.addPage(); y = margin; }
          doc.text(line, margin, y);
          y += 6;
        }
      }

      // Rodapé
      const footerY = 284;
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, footerY - 5, W - margin, footerY - 5);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.setFont("helvetica", "normal");
      const dateStr = new Date().toLocaleDateString("pt-BR");
      doc.text(`Gerado pelo Orizon Works em ${dateStr}`, margin, footerY);
      doc.text(
        "Estimativa: 15 min economizados por sessão · R$35/h de referência.",
        margin,
        footerY + 5
      );

      doc.save(`orizon-impacto-${MONTHS_PT[month - 1].toLowerCase()}-${year}.pdf`);
    } catch (err) {
      console.error("Erro ao exportar:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      style={{
        display: "flex", alignItems: "center", gap: "7px",
        height: "34px", padding: "0 16px",
        background: loading ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "6px",
        cursor: loading ? "not-allowed" : "pointer",
        color: loading ? "#444" : "#888",
        fontSize: "13px", fontWeight: 500,
        transition: "all 0.15s",
        fontFamily: "inherit",
      }}
      onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.color = "#EBEBEB"; }}
      onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.color = "#888"; }}
    >
      <Download style={{ width: "13px", height: "13px" }} strokeWidth={2} />
      {loading ? "Gerando PDF..." : "Exportar Relatório"}
    </button>
  );
}
