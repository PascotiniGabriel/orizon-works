"use client";

interface ExportMessage {
  role: "user" | "assistant";
  content: string;
}

interface ExportOptions {
  agentName: string;
  agentType: string;
  userName?: string;
  messages: ExportMessage[];
}

const AGENT_TYPE_LABELS: Record<string, string> = {
  rh: "RH",
  marketing: "Marketing",
  comercial: "Comercial",
  financeiro: "Financeiro",
  administrativo: "Administrativo",
};

function formatDateFull() {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

// ============================================================
// PDF
// ============================================================
export async function exportToPDF(options: ExportOptions): Promise<void> {
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  function checkPage(height: number) {
    if (y + height > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
  }

  // Header
  doc.setFillColor(13, 27, 42); // #0D1B2A
  doc.rect(0, 0, pageWidth, 18, "F");
  doc.setTextColor(232, 160, 32); // #E8A020
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("ORIZON WORKS", margin, 12);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Plataforma de Agentes de IA Empresariais", margin + 42, 12);

  y = 28;

  // Título
  doc.setTextColor(13, 27, 42);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`Conversa com ${options.agentName}`, margin, y);
  y += 7;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  const subtitle = [
    `Agente: ${AGENT_TYPE_LABELS[options.agentType] ?? options.agentType}`,
    options.userName ? `Usuário: ${options.userName}` : null,
    `Exportado em: ${formatDateFull()}`,
  ]
    .filter(Boolean)
    .join("  ·  ");
  doc.text(subtitle, margin, y);
  y += 8;

  // Linha divisória
  doc.setDrawColor(232, 160, 32);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Mensagens
  for (const msg of options.messages) {
    const isUser = msg.role === "user";
    const roleLabel = isUser ? "Você" : options.agentName;

    checkPage(14);

    // Label do remetente
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(isUser ? 200 : 13, isUser ? 130 : 27, isUser ? 32 : 42);
    doc.text(roleLabel.toUpperCase(), margin, y);
    y += 5;

    // Conteúdo
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    const lines = doc.splitTextToSize(msg.content, contentWidth);
    for (const line of lines) {
      checkPage(6);
      doc.text(line, margin, y);
      y += 5.5;
    }
    y += 4;
  }

  const fileName = `orizon-${options.agentName.toLowerCase().replace(/\s/g, "-")}-${Date.now()}.pdf`;
  doc.save(fileName);
}

// ============================================================
// WORD (.docx)
// ============================================================
export async function exportToWord(options: ExportOptions): Promise<void> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } =
    await import("docx");

  const children = [];

  // Título
  children.push(
    new Paragraph({
      text: `Conversa com ${options.agentName}`,
      heading: HeadingLevel.HEADING_1,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: [
            `Agente: ${AGENT_TYPE_LABELS[options.agentType] ?? options.agentType}`,
            options.userName ? `Usuário: ${options.userName}` : null,
            `Exportado em: ${formatDateFull()}`,
          ]
            .filter(Boolean)
            .join("  ·  "),
          size: 18,
          color: "888888",
        }),
      ],
    }),
    new Paragraph({ text: "" }) // espaço
  );

  for (const msg of options.messages) {
    const isUser = msg.role === "user";
    const roleLabel = isUser ? "Você" : options.agentName;

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: roleLabel.toUpperCase(),
            bold: true,
            size: 18,
            color: isUser ? "C88220" : "0D1B2A",
          }),
        ],
        spacing: { before: 240 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: msg.content,
            size: 22,
          }),
        ],
        alignment: AlignmentType.LEFT,
      })
    );
  }

  const doc = new Document({
    sections: [{ children }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `orizon-${options.agentName.toLowerCase().replace(/\s/g, "-")}-${Date.now()}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
