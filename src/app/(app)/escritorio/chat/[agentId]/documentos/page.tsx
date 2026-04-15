import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserCompanyInfo } from "@/lib/db/queries/company";
import { getAgentWithBriefings } from "@/lib/db/queries/agents";
import { listRagDocuments } from "@/lib/db/queries/rag";
import { DocumentosClient } from "./DocumentosClient";

const AGENT_TYPE_LABELS: Record<string, string> = {
  rh: "RH",
  marketing: "Marketing",
  comercial: "Comercial",
  financeiro: "Financeiro",
  administrativo: "Administrativo",
};

interface PageProps {
  params: Promise<{ agentId: string }>;
}

export default async function DocumentosPage({ params }: PageProps) {
  const { agentId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const info = await getUserCompanyInfo(user.id);
  if (!info) redirect("/login");

  // Apenas admin e sector_manager podem acessar
  if (info.role === "employee") redirect(`/escritorio/chat/${agentId}`);

  const data = await getAgentWithBriefings(agentId, info.companyId);
  if (!data) notFound();

  const { agent } = data;
  const agentLabel = agent.customName ?? AGENT_TYPE_LABELS[agent.type] ?? agent.type;

  const documents = await listRagDocuments(info.companyId, agentId);

  // Serializar datas para o client component
  const serializedDocuments = documents.map((d) => ({
    id: d.id,
    fileName: d.fileName,
    fileType: d.fileType,
    status: d.status,
    chunkCount: d.chunkCount,
    createdAt: d.createdAt.toISOString(),
    agentId: d.agentId,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* Page header bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          padding: "0 20px",
          height: "52px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
        }}
      >
        <Link
          href={`/escritorio/chat/${agentId}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: "#555",
            fontSize: "13px",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          <ArrowLeft style={{ width: "14px", height: "14px" }} strokeWidth={2} />
          {agentLabel}
        </Link>

        <span style={{ color: "rgba(255,255,255,0.1)", fontSize: "16px" }}>·</span>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <BookOpen style={{ width: "15px", height: "15px", color: "#10B981" }} strokeWidth={1.75} />
          <h1
            style={{
              color: "#EBEBEB",
              fontSize: "15px",
              fontWeight: 600,
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Base de Conhecimento
          </h1>
        </div>

        <span
          style={{
            marginLeft: "auto",
            color: "#444",
            fontSize: "12px",
          }}
        >
          {serializedDocuments.length} documento{serializedDocuments.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>

          {/* Info card */}
          <div
            style={{
              background: "rgba(16,185,129,0.05)",
              border: "1px solid rgba(16,185,129,0.12)",
              borderRadius: "10px",
              padding: "14px 16px",
              marginBottom: "20px",
            }}
          >
            <p style={{ color: "#EBEBEB", fontSize: "14px", fontWeight: 500, margin: "0 0 4px" }}>
              Como funciona a Base de Conhecimento?
            </p>
            <p style={{ color: "#555", fontSize: "13px", lineHeight: "1.6", margin: 0 }}>
              Faça upload de documentos (manuais, políticas, contratos, planilhas) e o agente{" "}
              <strong style={{ color: "#888" }}>{agentLabel}</strong> passará a consultá-los
              automaticamente durante as conversas. Apenas os trechos mais relevantes para cada pergunta
              são injetados — sem custo desnecessário de tokens.
            </p>
          </div>

          <DocumentosClient
            initialDocuments={serializedDocuments}
            agentId={agentId}
            companyId={info.companyId}
          />
        </div>
      </div>
    </div>
  );
}
