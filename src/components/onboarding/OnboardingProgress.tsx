"use client";

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
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#3A3A3A" }}>
          Perfil da empresa
        </span>
        <span style={{ fontSize: "12px", color: "#555" }}>{count}/{STEPS.length}</span>
      </div>

      {/* Progress bar */}
      <div style={{ height: "2px", background: "rgba(255,255,255,0.07)", borderRadius: "1px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${percent}%`, background: "#10B981", borderRadius: "1px", transition: "width 0.5s ease" }} />
      </div>

      <ul style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {STEPS.map((step, i) => (
          <li key={step} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "16px", height: "16px", borderRadius: "50%", flexShrink: 0,
              fontSize: "9px", fontWeight: 700,
              background: i < count ? "#10B981" : "rgba(255,255,255,0.06)",
              color: i < count ? "#000" : "#3A3A3A",
            }}>
              {i < count ? "✓" : i + 1}
            </span>
            <span style={{ fontSize: "12px", color: i < count ? "#EBEBEB" : "#3A3A3A" }}>
              {step}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
