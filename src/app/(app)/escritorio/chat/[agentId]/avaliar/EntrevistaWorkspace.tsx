"use client";

import { useRef, useState } from "react";
import {
  Mic,
  Star,
  CheckCircle2,
  Clock,
  Archive,
  XCircle,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { EntrevistaResult } from "@/app/api/avaliar-entrevista/route";

interface EntrevistaWorkspaceProps {
  agentPrompt: string;
}

const REC_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  contratar: { label: "Contratar", icon: CheckCircle2, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  segunda_entrevista: { label: "2ª Entrevista", icon: Clock, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  reserva: { label: "Banco de Reserva", icon: Archive, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  descartar: { label: "Não segue", icon: XCircle, color: "text-red-700", bg: "bg-red-50 border-red-200" },
};

const AUDIO_ACCEPT = "audio/mpeg,audio/mp4,audio/wav,audio/webm,video/mp4,video/webm";

export function EntrevistaWorkspace({ agentPrompt }: EntrevistaWorkspaceProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [descricaoVaga, setDescricaoVaga] = useState("");
  const [result, setResult] = useState<EntrevistaResult | null>(null);
  const [phase, setPhase] = useState<"idle" | "transcribing" | "analyzing" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [tokensUsed, setTokensUsed] = useState(0);
  const [showTranscricao, setShowTranscricao] = useState(false);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = Array.from(e.dataTransfer.files).find(
      (f) => f.type.startsWith("audio/") || f.type.startsWith("video/")
    );
    if (file) setAudioFile(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setAudioFile(file);
    e.target.value = "";
  }

  async function handleAvaliar() {
    if (!audioFile) return;

    setPhase("transcribing");
    setResult(null);
    setErrorMsg("");
    setTokensUsed(0);
    setShowTranscricao(false);

    const fd = new FormData();
    fd.append("audio", audioFile);
    fd.append("descricaoVaga", descricaoVaga);
    fd.append("agentPrompt", agentPrompt);

    try {
      setPhase("analyzing");
      const res = await fetch("/api/avaliar-entrevista", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? "Erro ao avaliar entrevista.");
        setPhase("error");
        return;
      }

      setResult(data.result as EntrevistaResult);
      setTokensUsed(data.tokensUsed ?? 0);
      setPhase("done");
    } catch {
      setErrorMsg("Erro de conexão. Tente novamente.");
      setPhase("error");
    }
  }

  function handleReset() {
    setAudioFile(null);
    setResult(null);
    setPhase("idle");
    setErrorMsg("");
    setTokensUsed(0);
    setShowTranscricao(false);
  }

  const isProcessing = phase === "transcribing" || phase === "analyzing";

  return (
    <div className="space-y-5">
      {/* Upload de áudio */}
      {phase === "idle" || phase === "error" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Vaga */}
          <div className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Descrição da Vaga</h2>
              <p className="text-xs text-gray-400 mt-0.5">Opcional — ajuda a avaliar a aderência do candidato</p>
            </div>
            <textarea
              value={descricaoVaga}
              onChange={(e) => setDescricaoVaga(e.target.value)}
              placeholder="Ex: Gerente de Projetos Sênior&#10;Requisitos: PMP, 5+ anos de experiência..."
              className="w-full h-48 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-900 placeholder-gray-400 outline-none resize-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            />
          </div>

          {/* Áudio */}
          <div className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Áudio da Entrevista</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                MP3, WAV, MP4, WebM · Máx 25 MB · O áudio será transcrito e analisado
              </p>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept={AUDIO_ACCEPT}
              className="hidden"
              onChange={handleFileInput}
            />

            {!audioFile ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 cursor-pointer transition-colors ${
                  isDragging
                    ? "border-amber-400 bg-amber-50"
                    : "border-gray-200 bg-gray-50 hover:border-amber-300 hover:bg-amber-50/50"
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm border border-gray-100">
                  <Mic className="h-5 w-5 text-amber-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">
                    {isDragging ? "Solte o arquivo aqui" : "Arraste o áudio ou clique para selecionar"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">MP3, WAV, MP4 ou WebM</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 border border-amber-100">
                  <Mic className="h-5 w-5 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{audioFile.name}</p>
                  <p className="text-xs text-gray-400">{(audioFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAudioFile(null)}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors shrink-0"
                >
                  Remover
                </button>
              </div>
            )}

            {phase === "error" && (
              <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                <p className="text-sm text-red-700">{errorMsg}</p>
              </div>
            )}
          </div>
        </div>
      ) : isProcessing ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-800">
              {phase === "transcribing" ? "Transcrevendo áudio..." : "Analisando entrevista..."}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {phase === "transcribing"
                ? "Usando Whisper Large v3 para transcrição em português"
                : "Identificando competências, alertas e recomendação"}
            </p>
          </div>
        </div>
      ) : null}

      {/* Resultado */}
      {phase === "done" && result && (
        <div className="space-y-4">
          {/* Card principal */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            {/* Header do candidato */}
            <div className="flex items-start gap-4 p-5 border-b border-gray-50">
              <div className="flex-1">
                <h3 className="text-base font-bold text-gray-900">{result.candidato}</h3>
                {result.cargo && (
                  <p className="text-xs text-gray-400 mt-0.5">{result.cargo}</p>
                )}
              </div>

              {/* Nota */}
              <div
                className={`flex items-center gap-1 rounded-xl border px-3 py-1 font-bold tabular-nums text-sm shrink-0 ${
                  result.nota >= 8
                    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                    : result.nota >= 6
                    ? "text-blue-700 bg-blue-50 border-blue-200"
                    : result.nota >= 4
                    ? "text-amber-700 bg-amber-50 border-amber-200"
                    : "text-red-700 bg-red-50 border-red-200"
                }`}
              >
                <Star className="h-3.5 w-3.5" />
                {result.nota.toFixed(1)}
              </div>

              {/* Recomendação */}
              {(() => {
                const cfg = REC_CONFIG[result.recomendacao] ?? REC_CONFIG.reserva;
                const Icon = cfg.icon;
                return (
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold shrink-0 ${cfg.bg} ${cfg.color}`}>
                    <Icon className="h-3 w-3" />
                    {cfg.label}
                  </span>
                );
              })()}
            </div>

            {/* Resumo */}
            <div className="px-5 py-4 border-b border-gray-50">
              <p className="text-sm text-gray-600">{result.resumo}</p>
            </div>

            {/* Competências + Alertas */}
            <div className="grid sm:grid-cols-2 gap-4 px-5 py-4 border-b border-gray-50">
              {result.competencias.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">
                    Competências demonstradas
                  </p>
                  <ul className="space-y-1">
                    {result.competencias.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.alertas.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">
                    Alertas
                  </p>
                  <ul className="space-y-1">
                    {result.alertas.map((a, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <AlertCircle className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Destaques da transcrição */}
            {result.destaquesTranscricao.length > 0 && (
              <div className="px-5 py-4 border-b border-gray-50">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Falas em destaque
                </p>
                <div className="space-y-2">
                  {result.destaquesTranscricao.map((fala, i) => (
                    <blockquote
                      key={i}
                      className="border-l-2 border-amber-300 pl-3 text-sm text-gray-600 italic"
                    >
                      "{fala}"
                    </blockquote>
                  ))}
                </div>
              </div>
            )}

            {/* Transcrição completa (colapsável) */}
            <div className="px-5 py-3">
              <button
                type="button"
                onClick={() => setShowTranscricao((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showTranscricao ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {showTranscricao ? "Ocultar" : "Ver"} transcrição completa
              </button>
              {showTranscricao && (
                <div className="mt-3 rounded-xl bg-gray-50 border border-gray-100 p-4 max-h-60 overflow-y-auto">
                  <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
                    {result.transcricao}
                  </p>
                </div>
              )}
            </div>
          </div>

          {tokensUsed > 0 && (
            <p className="text-xs text-gray-400 text-right tabular-nums">
              {tokensUsed.toLocaleString("pt-BR")} tokens consumidos
            </p>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2">
        {phase === "done" ? (
          <button
            type="button"
            onClick={handleReset}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Nova avaliação
          </button>
        ) : (
          <p className="text-xs text-gray-400">
            {audioFile ? audioFile.name : "Nenhum arquivo selecionado"}
          </p>
        )}

        {(phase === "idle" || phase === "error") && (
          <button
            type="button"
            onClick={handleAvaliar}
            disabled={!audioFile}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "#E8A020" }}
          >
            <Mic className="h-4 w-4" />
            Avaliar Entrevista
          </button>
        )}
      </div>
    </div>
  );
}
