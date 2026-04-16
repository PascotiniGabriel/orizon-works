import { SectorOnboarding } from "@/components/onboarding/SectorOnboarding";

export default function OnboardingSetorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#EBEBEB", letterSpacing: "-0.03em" }}>
          Configure seu primeiro agente
        </h1>
        <p style={{ marginTop: "6px", fontSize: "14px", color: "#555" }}>
          Escolha o setor, dê um nome e responda às perguntas para personalizar o agente com o contexto da sua empresa.
        </p>
      </div>

      <SectorOnboarding />
    </div>
  );
}
