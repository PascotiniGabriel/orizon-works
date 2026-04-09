"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Play,
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
    <div
      className={`flex items-center gap-1 rounded-xl border px-3 py-1 font-bold tabular-nums ${color}`}
    >
      <Star className="h-3.5 w-3.5" />
      {nota.toFixed(1)}
    </div>
  );
}

function CurriculoResultCard({
  result,
  rank,
}: {
  result: CurriculoResult;
  rank: number;
}) {
  const [expanded, setExpanded] = useState(rank === 0);
  const cfg = RECOMENDACAO_CONFIG[result.recomendacao] ?? RECOMENDACAO_CONFIG.reserva;
  const Icon = cfg.icon;

  return (
    <div
      className={`rounded-2xl border bg-white shadow-sm transition-all ${
        rank === 0 ? "border-amber-300 ring-1 ring-amber-200" : "border-gray-100"
      }`}
    >
      {/* Header do card */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left cursor-pointer"
      >
        {/* Rank */}
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

        {/* Nome */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{result.nome}</p>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{result.resumo}</p>
        </div>

        {/* Recomendação */}
        <span
          className={`hidden sm:inline-flex items-center gap-1.5 shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.bg} ${cfg.color}`}
        >
          <Icon className="h-3 w-3" />
          {cfg.label}
        </span>

        {/* Nota */}
        <ScoreBadge nota={result.nota} />

        {/* Expand */}
        <div className="shrink-0 text-gray-400">
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </button>

      {/* Detalhes expandidos */}
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

          <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold sm:hidden ${cfg.bg} ${cfg.color}`}>
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
  const [descricaoVaga, setDescricaoVaga] = useState("");
  const [curriculos, setCurriculos] = useState<string[]>(["", ""]);
  const [results, setResults] = useState<CurriculoResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokensUsed, setTokensUsed] = useState(0);

  function addCurriculo() {
    if (curriculos.length >= 20) return;
    setCurriculos((prev) => [...prev, ""]);
  }

  function removeCurriculo(index: number) {
    setCurriculos((prev) => prev.filter((_, i) => i !== index));
  }

  function updateCurriculo(index: number, value: string) {
    setCurriculos((prev) => prev.map((c, i) => (i === index ? value : c)));
  }

  async function handleAvaliar() {
    const curriculosFilled = curriculos.filter((c) => c.trim().length > 0);
    if (!descricaoVaga.trim()) {
      setError("Preencha a descrição da vaga.");
      return;
    }
    if (curriculosFilled.length === 0) {
      setError("Cole ao menos 1 currículo.");
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch("/api/avaliar-curriculos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descricaoVaga,
          curriculos: curriculosFilled,
          agentPrompt,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erro ao processar. Tente novamente.");
        return;
      }

      setResults(data.results);
      setTokensUsed(data.tokensUsed ?? 0);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const curriculosFilled = curriculos.filter((c) => c.trim().length > 0);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-white px-5 py-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/escritorio/chat/${agentId}`}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Chat
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-sm font-semibold text-gray-900">
            Ranking de Currículos
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{agentDisplayName}</span>
          {results && tokensUsed > 0 && (
            <span className="text-xs text-gray-400 tabular-nums">
              — {tokensUsed.toLocaleString("pt-BR")} tokens usados
            </span>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto p-5">
        {!results ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {/* Coluna 1: Vaga */}
            <div className="space-y-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Descrição da Vaga
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Cole a descrição completa: cargo, requisitos, responsabilidades
                </p>
              </div>
              <textarea
                value={descricaoVaga}
                onChange={(e) => setDescricaoVaga(e.target.value)}
                placeholder="Ex: Analista de RH Pleno&#10;Requisitos: 3+ anos de experiência em recrutamento, conhecimento em ATS, etc."
                className="w-full h-64 lg:h-full min-h-64 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-900 placeholder-gray-400 outline-none resize-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
            </div>

            {/* Coluna 2: Currículos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    Currículos ({curriculosFilled.length}/{curriculos.length})
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Cole o texto de cada currículo. Máximo 20.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addCurriculo}
                  disabled={curriculos.length >= 20}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar
                </button>
              </div>

              <div className="space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
                {curriculos.map((curriculo, index) => (
                  <div key={index} className="relative group">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-500">
                        Candidato {index + 1}
                      </span>
                      {curriculos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCurriculo(index)}
                          className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <textarea
                      value={curriculo}
                      onChange={(e) => updateCurriculo(index, e.target.value)}
                      placeholder={`Cole aqui o currículo do Candidato ${index + 1}...`}
                      rows={5}
                      className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-900 placeholder-gray-400 outline-none resize-y transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Sumário */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(["contratar", "segunda_entrevista", "reserva", "descartar"] as const).map(
                (rec) => {
                  const cfg = RECOMENDACAO_CONFIG[rec];
                  const count = results.filter((r) => r.recomendacao === rec).length;
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={rec}
                      className={`rounded-xl border p-3 ${cfg.bg}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Icon className={`h-4 w-4 ${cfg.color}`} />
                        <span className={`text-xs font-semibold ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className={`text-2xl font-bold mt-1 ${cfg.color}`}>{count}</p>
                    </div>
                  );
                }
              )}
            </div>

            {/* Lista rankeada */}
            <div className="space-y-3">
              {results.map((result, index) => (
                <CurriculoResultCard
                  key={result.index}
                  result={result}
                  rank={index}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 bg-white px-5 py-4">
        {error && (
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          {results ? (
            <button
              type="button"
              onClick={() => {
                setResults(null);
                setError(null);
              }}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Nova avaliação
            </button>
          ) : (
            <p className="text-xs text-gray-400">
              {curriculosFilled.length} currículo(s) prontos para avaliação
            </p>
          )}

          {!results && (
            <button
              type="button"
              onClick={handleAvaliar}
              disabled={loading || curriculosFilled.length === 0 || !descricaoVaga.trim()}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "#E8A020" }}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Avaliando {curriculosFilled.length} currículo(s)...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Avaliar e Rankear
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
