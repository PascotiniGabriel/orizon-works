import { OnboardingChat } from "@/components/onboarding/OnboardingChat";

export default function OnboardingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#0D1B2A" }}>
          Vamos conhecer sua empresa
        </h1>
        <p className="mt-1 text-muted-foreground">
          Responda às perguntas abaixo para personalizar seus agentes de IA.
          Leva menos de 5 minutos.
        </p>
      </div>

      <div style={{ height: "calc(100vh - 240px)", minHeight: "480px" }}>
        <OnboardingChat />
      </div>
    </div>
  );
}
