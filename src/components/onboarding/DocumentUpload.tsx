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
      // Limpar input para permitir reenvio do mesmo arquivo
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <div className="relative">
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
        className="flex h-9 w-9 items-center justify-center rounded-lg border text-gray-400 transition-colors hover:border-amber-400 hover:text-amber-500 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Paperclip className="h-4 w-4" />
        )}
      </button>
      {error && (
        <div className="absolute bottom-11 left-0 z-10 w-56 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs text-red-600 shadow-md">
          {error}
        </div>
      )}
    </div>
  );
}
