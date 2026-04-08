"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PromptBuilderModalProps {
  onClose: () => void;
  onConfirm: (finalPrompt: string) => void;
  agentName: string;
}

interface Fields {
  personagem: string;
  tarefa: string;
  contexto: string;
  exemplo: string;
  formato: string;
  tom: string;
}

type Step = "form" | "reviewing" | "preview";

export function PromptBuilderModal({
  onClose,
  onConfirm,
  agentName,
}: PromptBuilderModalProps) {
  const [step, setStep] = useState<Step>("form");
  const [fields, setFields] = useState<Fields>({
    personagem: "",
    tarefa: "",
    contexto: "",
    exemplo: "",
    formato: "",
    tom: "",
  });
  const [improvedPrompt, setImprovedPrompt] = useState("");
  const [editablePrompt, setEditablePrompt] = useState("");
  const [error, setError] = useState("");

  function update(field: keyof Fields, value: string) {
    setFields((prev) => ({ ...prev, [field]: value }));
  }

  async function handleReview() {
    if (!fields.tarefa.trim() || !fields.contexto.trim()) {
      setError("Preencha pelo menos Tarefa e Contexto.");
      return;
    }
    setError("");
    setStep("reviewing");

    try {
      const res = await fetch("/api/chat/engenheiro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      });

      if (res.status === 402) {
        setError("Tokens insuficientes para usar o Modo Guiado.");
        setStep("form");
        return;
      }

      if (!res.ok) throw new Error("Erro na revisão.");

      const data = await res.json();
      setImprovedPrompt(data.improvedPrompt);
      setEditablePrompt(data.improvedPrompt);
      setStep("preview");
    } catch {
      setError("Erro ao melhorar o prompt. Tente novamente.");
      setStep("form");
    }
  }

  function handleConfirm() {
    onConfirm(editablePrompt.trim() || improvedPrompt);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 text-white"
          style={{ backgroundColor: "#0D1B2A" }}
        >
          <div>
            <h2 className="font-bold">Modo Guiado</h2>
            <p className="text-xs text-gray-300">
              Preencha os campos para construir um prompt de alto impacto
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Conteúdo */}
        <div className="max-h-[70vh] overflow-y-auto p-6">
          {step === "form" && (
            <div className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <Field
                label="🎭 Personagem"
                hint="Quem deve ser o agente nesta tarefa?"
                placeholder={`${agentName} especialista em análise de currículos com 10 anos de experiência`}
                value={fields.personagem}
                onChange={(v) => update("personagem", v)}
                required={false}
              />
              <Field
                label="📋 Tarefa"
                hint="O que você precisa que seja feito?"
                placeholder="Analise este currículo e dê uma nota de 0 a 10 por critério"
                value={fields.tarefa}
                onChange={(v) => update("tarefa", v)}
                required
              />
              <Field
                label="📍 Contexto"
                hint="Qual é a situação ou objetivo?"
                placeholder="Estamos selecionando para a vaga de Analista de Marketing Júnior"
                value={fields.contexto}
                onChange={(v) => update("contexto", v)}
                required
              />
              <Field
                label="💡 Exemplo"
                hint="Algum exemplo de referência? (opcional)"
                placeholder="Considere como positivo o perfil com experiência em redes sociais"
                value={fields.exemplo}
                onChange={(v) => update("exemplo", v)}
                required={false}
              />
              <Field
                label="📐 Formato"
                hint="Como deve ser a resposta? (opcional)"
                placeholder="Tabela com critérios, pontuação e justificativa"
                value={fields.formato}
                onChange={(v) => update("formato", v)}
                required={false}
              />
              <Field
                label="🎨 Tom"
                hint="Tom de comunicação desejado? (opcional)"
                placeholder="Objetivo e profissional"
                value={fields.tom}
                onChange={(v) => update("tom", v)}
                required={false}
              />

              <div className="flex items-center gap-2 pt-2">
                <p className="text-xs text-gray-400 flex-1">
                  O Modo Guiado usa tokens extras para revisar seu prompt com IA.
                </p>
                <Button
                  onClick={handleReview}
                  className="shrink-0 font-semibold text-white"
                  style={{ backgroundColor: "#E8A020" }}
                >
                  Revisar com IA →
                </Button>
              </div>
            </div>
          )}

          {step === "reviewing" && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex gap-1.5">
                <span className="h-2 w-2 animate-bounce rounded-full bg-amber-400" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-amber-400" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-amber-400" style={{ animationDelay: "300ms" }} />
              </div>
              <p className="font-medium text-gray-700">Melhorando seu prompt...</p>
              <p className="mt-1 text-sm text-gray-400">O agente revisor está trabalhando.</p>
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">
                  Prompt melhorado — edite se necessário:
                </p>
                <textarea
                  value={editablePrompt}
                  onChange={(e) => setEditablePrompt(e.target.value)}
                  rows={8}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 resize-none"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep("form")}
                  className="flex-1"
                >
                  ← Editar campos
                </Button>
                <Button
                  onClick={handleConfirm}
                  className="flex-1 font-semibold text-white"
                  style={{ backgroundColor: "#E8A020" }}
                >
                  Enviar ao agente →
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  placeholder,
  value,
  onChange,
  required,
}: {
  label: string;
  hint: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required: boolean;
}) {
  return (
    <div>
      <label className="mb-1 flex items-center gap-1 text-sm font-medium text-gray-800">
        {label}
        {required && (
          <span className="text-amber-500" title="Obrigatório">
            *
          </span>
        )}
      </label>
      <p className="mb-1.5 text-xs text-gray-400">{hint}</p>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="text-sm"
      />
    </div>
  );
}
