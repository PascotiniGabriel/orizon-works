"use client";

import { Progress } from "@/components/ui/progress";

const STEPS = [
  "Nome e segmento",
  "Missão",
  "Valores e cultura",
  "Tom de comunicação",
  "Público-alvo",
  "Produtos e serviços",
];

interface OnboardingProgressProps {
  completedFields: string[];
}

export function OnboardingProgress({ completedFields }: OnboardingProgressProps) {
  const count = Math.min(completedFields.length, STEPS.length);
  const percent = Math.round((count / STEPS.length) * 100);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium" style={{ color: "#0D1B2A" }}>
          Perfil da empresa
        </span>
        <span className="text-muted-foreground">{count}/{STEPS.length}</span>
      </div>
      <Progress value={percent} className="h-2" />
      <ul className="space-y-1">
        {STEPS.map((step, i) => (
          <li
            key={step}
            className="flex items-center gap-2 text-xs"
            style={{ color: i < count ? "#0D1B2A" : "#94a3b8" }}
          >
            <span
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
              style={{
                backgroundColor: i < count ? "#E8A020" : "#e2e8f0",
                color: i < count ? "#fff" : "#94a3b8",
              }}
            >
              {i < count ? "✓" : i + 1}
            </span>
            {step}
          </li>
        ))}
      </ul>
    </div>
  );
}
