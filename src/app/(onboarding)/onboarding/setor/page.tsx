import { SectorOnboarding } from "@/components/onboarding/SectorOnboarding";

export default function OnboardingSetorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#0D1B2A" }}>
          Configure seu primeiro agente
        </h1>
        <p className="mt-1 text-muted-foreground">
          Escolha o setor, dê um nome e responda às perguntas para personalizar o agente com o contexto da sua empresa.
        </p>
      </div>

      <SectorOnboarding />
    </div>
  );
}
