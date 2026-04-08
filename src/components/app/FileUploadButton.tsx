"use client";

import { useRef, useState } from "react";

export interface UploadedFile {
  uploadId: string;
  fileName: string;
  mimeType: string;
  extractedText: string | null;
  isAudio: boolean;
  isPDF: boolean;
  isSpreadsheet: boolean;
  transcriptionStatus: string;
}

interface FileUploadButtonProps {
  agentType: string;
  sessionId?: string;
  onUploaded: (file: UploadedFile) => void;
  disabled?: boolean;
}

const ACCEPT_BY_AGENT: Record<string, string> = {
  rh: ".pdf,audio/*,video/mp4,video/webm",
  financeiro: ".xlsx,.xls,.csv,.pdf",
  administrativo: "audio/*,video/mp4,video/webm",
  marketing: ".pdf",
  comercial: ".pdf",
};

const LABEL_BY_AGENT: Record<string, string> = {
  rh: "PDF / Áudio",
  financeiro: "Excel / CSV / PDF",
  administrativo: "Áudio / Vídeo",
  marketing: "PDF",
  comercial: "PDF",
};

export function FileUploadButton({
  agentType,
  sessionId,
  onUploaded,
  disabled,
}: FileUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const accept = ACCEPT_BY_AGENT[agentType] ?? ".pdf";
  const label = LABEL_BY_AGENT[agentType] ?? "Arquivo";

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const fd = new FormData();
      fd.append("file", file);
      if (sessionId) fd.append("sessionId", sessionId);

      const res = await fetch("/api/upload", { method: "POST", body: fd });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Erro ao enviar arquivo.");
        return;
      }

      const data: UploadedFile = await res.json();
      onUploaded(data);
    } catch {
      setError("Falha no upload. Tente novamente.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFile}
        className="hidden"
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
        title={`Anexar ${label}`}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-gray-500 border border-gray-200 transition-colors hover:border-amber-300 hover:text-amber-600 disabled:opacity-40"
      >
        {uploading ? (
          <>
            <span className="h-3 w-3 animate-spin rounded-full border border-gray-300 border-t-amber-500" />
            Enviando...
          </>
        ) : (
          <>
            📎 {label}
          </>
        )}
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
