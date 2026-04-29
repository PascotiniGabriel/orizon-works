"use client";

import { useState, useEffect, useRef } from "react";
import { FileText, Trash2, Upload, Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

interface RagDocument {
  id: string;
  fileName: string;
  fileType: string;
  status: string;
  chunkCount: number | null;
  createdAt: string;
  agentId: string | null;
}

interface DocumentosClientProps {
  initialDocuments?: RagDocument[];
  agentId: string;
  companyId?: string;
}

const STATUS_LABELS: Record<string, string> = {
  processing: "Indexando...",
  ready: "Pronto",
  error: "Erro",
};

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  processing: {
    bg: "rgba(251,191,36,0.08)",
    text: "#FBBF24",
    border: "rgba(251,191,36,0.2)",
  },
  ready: {
    bg: "rgba(16,185,129,0.08)",
    text: "#10B981",
    border: "rgba(16,185,129,0.2)",
  },
  error: {
    bg: "rgba(248,113,113,0.08)",
    text: "#F87171",
    border: "rgba(248,113,113,0.2)",
  },
};

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

export function DocumentosClient({ initialDocuments, agentId }: DocumentosClientProps) {
  const [documents, setDocuments] = useState<RagDocument[]>(initialDocuments ?? []);

  // Fetch on mount when no initialDocuments provided (e.g. when rendered inside WorkspaceShell)
  useEffect(() => {
    if (initialDocuments !== undefined) return;
    fetch(`/api/rag/list?agentId=${agentId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setDocuments(data.documents ?? []); })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Polling a cada 4s enquanto houver documentos em processing
  useEffect(() => {
    const hasProcessing = documents.some((d) => d.status === "processing");
    if (!hasProcessing) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/rag/list?agentId=${agentId}`);
        if (res.ok) {
          const data = await res.json();
          setDocuments(data.documents ?? []);
        }
      } catch {
        // ignora erro de polling
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [documents, agentId]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("agentId", agentId);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error ?? "Erro ao fazer upload.");
        return;
      }

      // Se arquivo tem texto e não é áudio, o backend cria o registro RAG automaticamente
      // Atualizar lista após 1s para mostrar o novo documento
      setTimeout(async () => {
        try {
          const listRes = await fetch(`/api/rag/list?agentId=${agentId}`);
          if (listRes.ok) {
            const listData = await listRes.json();
            setDocuments(listData.documents ?? []);
          }
        } catch {
          // ignora
        }
      }, 1000);
    } catch {
      setUploadError("Erro de conexão. Tente novamente.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(documentId: string, fileName: string) {
    if (!confirm(`Remover "${fileName}" e todos os seus chunks indexados?`)) return;

    setDeletingId(documentId);
    try {
      const res = await fetch("/api/rag/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });

      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== documentId));
      } else {
        const data = await res.json();
        alert(data.error ?? "Erro ao remover documento.");
      }
    } catch {
      alert("Erro de conexão. Tente novamente.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleRefresh() {
    try {
      const res = await fetch(`/api/rag/list?agentId=${agentId}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents ?? []);
      }
    } catch {
      // ignora
    }
  }

  const hasProcessing = documents.some((d) => d.status === "processing");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Upload button row */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.csv,.txt"
          style={{ display: "none" }}
          onChange={handleUpload}
          disabled={uploading}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            height: "36px",
            padding: "0 16px",
            background: uploading ? "rgba(16,185,129,0.4)" : "#10B981",
            color: "#000",
            fontWeight: 600,
            fontSize: "13px",
            borderRadius: "7px",
            border: "none",
            cursor: uploading ? "not-allowed" : "pointer",
            fontFamily: "inherit",
          }}
        >
          {uploading ? (
            <Loader2 style={{ width: "14px", height: "14px" }} className="animate-spin" />
          ) : (
            <Upload style={{ width: "14px", height: "14px" }} strokeWidth={2} />
          )}
          {uploading ? "Enviando..." : "Adicionar documento"}
        </button>

        {hasProcessing && (
          <button
            onClick={handleRefresh}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              height: "36px",
              padding: "0 12px",
              background: "transparent",
              color: "#555",
              fontSize: "12px",
              borderRadius: "7px",
              border: "1px solid rgba(255,255,255,0.08)",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <RefreshCw style={{ width: "12px", height: "12px" }} strokeWidth={2} />
            Atualizar
          </button>
        )}

        <span style={{ color: "#444", fontSize: "12px" }}>
          PDF, CSV ou TXT · máx. 10 MB
        </span>
      </div>

      {uploadError && (
        <div
          style={{
            background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.2)",
            borderRadius: "8px",
            padding: "10px 14px",
            color: "#F87171",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <AlertCircle style={{ width: "14px", height: "14px", flexShrink: 0 }} strokeWidth={2} />
          {uploadError}
        </div>
      )}

      {/* Document list */}
      {documents.length === 0 ? (
        <div
          style={{
            background: "#161616",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "10px",
            padding: "48px 24px",
            textAlign: "center",
          }}
        >
          <FileText
            style={{ width: "32px", height: "32px", color: "#333", margin: "0 auto 12px" }}
            strokeWidth={1.5}
          />
          <p style={{ color: "#555", fontSize: "14px", margin: 0 }}>
            Nenhum documento indexado ainda.
          </p>
          <p style={{ color: "#444", fontSize: "13px", marginTop: "6px" }}>
            Faça upload de um PDF, CSV ou TXT para que o agente passe a consultá-lo durante o chat.
          </p>
        </div>
      ) : (
        <div
          style={{
            background: "#161616",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          {documents.map((doc, idx) => {
            const statusStyle = STATUS_COLORS[doc.status] ?? STATUS_COLORS.error;
            const isDeleting = deletingId === doc.id;

            return (
              <div
                key={doc.id}
                className="ow-row"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "14px 16px",
                  borderBottom:
                    idx < documents.length - 1
                      ? "1px solid rgba(255,255,255,0.05)"
                      : "none",
                  opacity: isDeleting ? 0.5 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                {/* File icon */}
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    flexShrink: 0,
                    borderRadius: "8px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FileText
                    style={{ width: "15px", height: "15px", color: "#555" }}
                    strokeWidth={1.75}
                  />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      color: "#EBEBEB",
                      fontSize: "14px",
                      fontWeight: 500,
                      margin: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {doc.fileName}
                  </p>
                  <p style={{ color: "#555", fontSize: "12px", marginTop: "2px" }}>
                    {doc.fileType.toUpperCase()}
                    {doc.chunkCount ? ` · ${doc.chunkCount} chunks` : ""}
                    {" · "}
                    {formatDate(doc.createdAt)}
                  </p>
                </div>

                {/* Status badge */}
                <div
                  style={{
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "3px 9px",
                    borderRadius: "6px",
                    background: statusStyle.bg,
                    border: `1px solid ${statusStyle.border}`,
                    fontSize: "12px",
                    fontWeight: 500,
                    color: statusStyle.text,
                  }}
                >
                  {doc.status === "processing" && (
                    <Loader2
                      style={{ width: "11px", height: "11px" }}
                      className="animate-spin"
                    />
                  )}
                  {doc.status === "ready" && (
                    <CheckCircle2 style={{ width: "11px", height: "11px" }} strokeWidth={2} />
                  )}
                  {doc.status === "error" && (
                    <AlertCircle style={{ width: "11px", height: "11px" }} strokeWidth={2} />
                  )}
                  {STATUS_LABELS[doc.status] ?? doc.status}
                </div>

                {/* Delete button */}
                <button
                  onClick={() => handleDelete(doc.id, doc.fileName)}
                  disabled={isDeleting}
                  title="Remover documento"
                  style={{
                    flexShrink: 0,
                    width: "30px",
                    height: "30px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "transparent",
                    border: "none",
                    cursor: isDeleting ? "not-allowed" : "pointer",
                    color: "#444",
                    borderRadius: "6px",
                    padding: 0,
                  }}
                >
                  {isDeleting ? (
                    <Loader2
                      style={{ width: "14px", height: "14px" }}
                      className="animate-spin"
                    />
                  ) : (
                    <Trash2 style={{ width: "14px", height: "14px" }} strokeWidth={1.75} />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
