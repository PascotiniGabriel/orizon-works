"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Star,
  CheckCircle2,
  Clock,
  Archive,
  XCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Trophy,
  AlertCircle,
  Upload,
  FileText,
  Trash2,
  Play,
} from "lucide-react";
import type { CurriculoResult } from "@/app/api/avaliar-curriculos/route";

interface CurriculoRankingWorkspaceProps {
  agentId: string;
  agentPrompt: string;
  agentDisplayName: string;
}

const RECOMENDACAO_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  contratar: {
    label: "Contratar",
    icon: CheckCircle2,
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
  },
  segunda_entrevista: {
    label: "2ª Entrevista",
    icon: Clock,
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
  },
  reserva: {
    label: "Banco de Reserva",
    icon: Archive,
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
  },
  descartar: {
    label: "Não segue",
    icon: XCircle,
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
  },
};

function ScoreBadge({ nota }: { nota: number }) {
  const color =
    nota >= 8
      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
      : nota >= 6
      ? "text-blue-700 bg-blue-50 border-blue-200"
      : nota >= 4
      ? "text-amber-700 bg-amber-50 border-amber-200"
      : "text-red-700 bg-red-50 border-red-200";
  return (
    <div className={`flex items-center gap-1 rounded-xl border px-3 py-1 font-bold tabular-nums text-sm ${color}`}>
      <Star className="h-3.5 w-3.5" />
      {nota.toFixed(1)}
    </div>
  );
}

function CurriculoResultCard({ result, rank }: { result: CurriculoResult; rank: number }) {
  const [expanded, setExpanded] = useState(rank < 3);
  const cfg = RECOMENDACAO_CONFIG[result.recomendacao] ?? RECOMENDACAO_CONFIG.reserva;
  const Icon = cfg.icon;

  return (
    <div
      className={`rounded-2xl border bg-white shadow-sm transition-all ${
        rank === 0 ? "border-amber-300 ring-1 ring-amber-200" : "border-gray-100"
      }`}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left cursor-pointer"
      >
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
            rank === 0
              ? "bg-amber-400 text-white"
              : rank === 1
              ? "bg-gray-300 text-gray-700"
              : rank === 2
              ? "bg-orange-300 text-white"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {rank === 0 ? <Trophy className="h-4 w-4" /> : rank + 1}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{result.nome}</p>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{result.fileName}</p>
        </div>

        <span
          className={`hidden sm:inline-flex items-center gap-1.5 shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.bg} ${cfg.color}`}
        >
          <Icon className="h-3 w-3" />
          {cfg.label}
        </span>

        <ScoreBadge nota={result.nota} />

        <div className="shrink-0 text-gray-400">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-4">
          <p className="text-sm text-gray-600">{result.resumo}</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {result.pontosFottes.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">
                  Pontos fortes
                </p>
                <ul className="space-y-1">
                  {result.pontosFottes.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.pontosFracos.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">
                  Pontos de atenção
                </p>
                <ul className="space-y-1">
                  {result.pontosFracos.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <AlertCircle className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold sm:hidden ${cfg.bg} ${cfg.color}`}
          >
            <Icon className="h-3 w-3" />
            {cfg.label}
          </div>
        </div>
      )}
    </div>
  );
}

export function CurriculoRankingWorkspace({
  agentId,
  agentPrompt,
  agentDisplayName,
}: CurriculoRankingWorkspaceProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [descricaoVaga, setDescricaoVaga] = useState("");
  const [results, setResults] = useState<CurriculoResult[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [errors, setErrors] = useState<string[]>([]);
  const [tokensUsed, setTokensUsed] = useState(0);
  const [phase, setPhase] = useState<"input" | "results">("input");
  const [tokenExhausted, setTokenExhausted] = useState(false);

  function addFiles(newFiles: File[]) {
    const pdfs = newFiles.filter((f) => f.type === "application/pdf" || f.name.endsWith(".pdf"));
    if (pdfs.length === 0) return;
    setFiles((prev) => {
      const combined = [...prev, ...pdfs];
      const unique = combined.filter(
        (f, i) => combined.findIndex((x) => x.name === f.name) === i
      );
      return unique.slice(0, 100);
    });
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
      e.target.value = "";
    }
  }

  async function handleAvaliar() {
    if (!descricaoVaga.trim() || files.length === 0) return;

    setProcessing(true);
    setResults([]);
    setErrors([]);
    setTokensUsed(0);
    setTokenExhausted(false);
    setProgress({ done: 0, total: files.length });
    setPhase("results");

    let totalTokens = 0;
    let exhausted = false;

    const evaluate = async (file: File, index: number) => {
      if (exhausted) return;
      const fd = new FormData();
      fd.append("pdf", file);
      fd.append("descricaoVaga", descricaoVaga);
      fd.append("agentPrompt", agentPrompt);
      fd.append("index", String(index));

      try {
        const res = await fetch("/api/avaliar-curriculos", { method: "POST", body: fd });
        const data = await res.json();

        if (!res.ok) {
          if (res.status === 402) {
            exhausted = true;
            setTokenExhausted(true);
          } else {
            setErrors((prev) => [...prev, data.error ?? `Erro ao processar: ${file.name}`]);
          }
          return;
        }

        setResults((prev) =>
          [...prev, data.result as CurriculoResult].sort((a, b) => b.nota - a.nota)
        );
        totalTokens += data.tokensUsed ?? 0;
        setTokensUsed(totalTokens);
      } catch {
        setErrors((prev) => [...prev, `Erro de conexão: ${file.name}`]);
      } finally {
        setProgress((prev) => ({ ...prev, done: prev.done + 1 }));
      }
    };

    await Promise.allSettled(files.map((file, i) => evaluate(file, i)));
    setProcessing(false);
  }

  function handleReset() {
    setFiles([]);
    setResults([]);
    setErrors([]);
    setTokensUsed(0);
    setProcessing(false);
    setPhase("input");
    setTokenExhausted(false);
  }

  const progressPercent =
    progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-white px-5 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href={`/escritorio/chat/${agentId}`}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Chat
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-sm font-semibold text-gray-900">Ranking de Currículos</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">{agentDisplayName}</span>
          {tokensUsed > 0 && (
            <span className="text-xs text-gray-400 tabular-nums">
              {tokensUsed.toLocaleString("pt-BR")} tokens
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5">
        {phase === "input" ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Vaga */}
            <div className="space-y-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Descrição da Vaga</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Cole a descrição completa: cargo, requisitos, responsabilidades
                </p>
              </div>
              <textarea
                value={descricaoVaga}
                onChange={(e) => setDescricaoVaga(e.target.value)}
                placeholder="Ex: Analista de Marketing Pleno&#10;Requisitos: experiência em Google Ads, Meta Ads, 3+ anos..."
                className="w-full h-72 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-900 placeholder-gray-400 outline-none resize-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
            </div>

            {/* Currículos PDF */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    Currículos em PDF ({files.length}/100)
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Arraste e solte ou clique para selecionar. Máximo 100 arquivos.
                  </p>
                </div>
                {files.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFiles([])}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                  >
                    Limpar tudo
                  </button>
                )}
              </div>

              {/* Drop zone */}
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,application/pdf"
                multiple
                className="hidden"
                onChange={handleFileInput}
              />
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-8 cursor-pointer transition-colors ${
                  isDragging
                    ? "border-amber-400 bg-amber-50"
                    : "border-gray-200 bg-gray-50 hover:border-amber-300 hover:bg-amber-50/50"
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm border border-gray-100">
                  <Upload className="h-5 w-5 text-amber-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">
                    {isDragging ? "Solte os PDFs aqui" : "Arraste os PDFs ou clique para selecionar"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Até 100 currículos em PDF. PDFs com texto extraível (não imagem).
                  </p>
                </div>
              </div>

              {/* Lista de arquivos */}
              {files.length > 0 && (
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {files.map((file, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2 group"
                    >
                      <FileText className="h-4 w-4 shrink-0 text-amber-500" />
                      <p className="flex-1 min-w-0 text-sm text-gray-700 truncate">{file.name}</p>
                      <span className="text-xs text-gray-400 shrink-0 tabular-nums">
                        {(file.size / 1024).toFixed(0)} KB
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="shrink-0 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Progresso */}
            {processing && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                    <span className="text-sm font-semibold text-amber-800">
                      Avaliando currículos...
                    </span>
                  </div>
                  <span className="text-sm font-bold text-amber-700 tabular-nums">
                    {progress.done}/{progress.total}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-amber-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-amber-600">
                  Resultados aparecem conforme cada currículo é avaliado
                </p>
              </div>
            )}

            {/* Token esgotado */}
            {tokenExhausted && (
              <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-800">Saldo de tokens esgotado</p>
                  <p className="text-xs text-red-600 mt-0.5">
                    Alguns currículos não foram avaliados. Recarregue tokens em Configurações e tente novamente.
                  </p>
                </div>
              </div>
            )}

            {/* Erros */}
            {errors.length > 0 && (
              <div className="rounded-2xl border border-red-100 bg-red-50 p-4 space-y-1">
                <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2">
                  {errors.length} erro(s)
                </p>
                {errors.map((e, i) => (
                  <p key={i} className="flex items-start gap-2 text-xs text-red-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    {e}
                  </p>
                ))}
              </div>
            )}

            {/* Sumário */}
            {results.length > 0 && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(["contratar", "segunda_entrevista", "reserva", "descartar"] as const).map(
                    (rec) => {
                      const cfg = RECOMENDACAO_CONFIG[rec];
                      const count = results.filter((r) => r.recomendacao === rec).length;
                      const Icon = cfg.icon;
                      return (
                        <div key={rec} className={`rounded-xl border p-3 ${cfg.bg}`}>
                          <div className="flex items-center gap-1.5">
                            <Icon className={`h-4 w-4 ${cfg.color}`} />
                            <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                          </div>
                          <p className={`text-2xl font-bold mt-1 ${cfg.color}`}>{count}</p>
                        </div>
                      );
                    }
                  )}
                </div>

                {/* Lista rankeada */}
                <div className="space-y-3">
                  {results.map((result, rank) => (
                    <CurriculoResultCard key={`${result.fileName}-${rank}`} result={result} rank={rank} />
                  ))}
                  {processing && results.length < progress.total && (
                    <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      <p className="text-sm text-gray-500">
                        Aguardando mais {progress.total - progress.done} currículo(s)...
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Sem resultados ainda */}
            {results.length === 0 && processing && (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Processando os primeiros currículos...</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 bg-white px-5 py-4 shrink-0">
        <div className="flex items-center justify-between gap-3">
          {phase === "results" ? (
            <button
              type="button"
              onClick={handleReset}
              disabled={processing}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
            >
              Nova avaliação
            </button>
          ) : (
            <p className="text-xs text-gray-400">
              {files.length > 0
                ? `${files.length} currículo(s) selecionado(s)`
                : "Nenhum arquivo selecionado"}
            </p>
          )}

          {phase === "input" && (
            <button
              type="button"
              onClick={handleAvaliar}
              disabled={processing || files.length === 0 || !descricaoVaga.trim()}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "#E8A020" }}
            >
              <Play className="h-4 w-4" />
              Avaliar {files.length > 0 ? `${files.length} currículo(s)` : "e Rankear"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
