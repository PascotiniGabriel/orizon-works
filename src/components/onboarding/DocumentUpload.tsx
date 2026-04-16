"use client";

import { useRef, useState, useTransition } from "react";
import { Paperclip, Loader2 } from "lucide-react";
import { uploadDocument } from "@/actions/uploads";

interface DocumentUploadProps {
  onUploaded: (message: string) => void;
  disabled?: boolean;
}

export function DocumentUpload({ onUploaded, disabled }: DocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    inputRef.current?.click();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      const result = await uploadDocument(formData);
      if (result.success) {
        onUploaded(result.message);
      } else {
        setError(result.message);
      }
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <div style={{ position: "relative" }}>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleChange}
        disabled={disabled || isPending}
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isPending}
        title="Enviar documento PDF"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: "34px", height: "34px", borderRadius: "6px",
          border: "1px solid rgba(255,255,255,0.1)", background: "transparent",
          color: "#3A3A3A", cursor: "pointer", transition: "border-color 0.15s, color 0.15s",
          opacity: (disabled || isPending) ? 0.4 : 1,
        }}
        onMouseEnter={(e) => {
          if (!disabled && !isPending) {
            (e.currentTarget as HTMLElement).style.borderColor = "#10B981";
            (e.currentTarget as HTMLElement).style.color = "#10B981";
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)";
          (e.currentTarget as HTMLElement).style.color = "#3A3A3A";
        }}
      >
        {isPending ? (
          <Loader2 style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} />
        ) : (
          <Paperclip style={{ width: "14px", height: "14px" }} />
        )}
      </button>
      {error && (
        <div style={{
          position: "absolute", bottom: "42px", left: 0, zIndex: 10,
          width: "224px", borderRadius: "8px", padding: "8px 12px",
          background: "#1A0A0A", border: "1px solid rgba(239,68,68,0.3)",
          fontSize: "12px", color: "#EF4444", boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
        }}>
          {error}
        </div>
      )}
    </div>
  );
}
