import { OnboardingChat } from "@/components/onboarding/OnboardingChat";

export default function OnboardingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#EBEBEB", letterSpacing: "-0.03em" }}>
          Vamos conhecer sua empresa
        </h1>
        <p style={{ marginTop: "6px", fontSize: "14px", color: "#555" }}>
          Responda às perguntas abaixo para personalizar seus agentes de IA. Leva menos de 5 minutos.
        </p>
      </div>

      <div style={{ height: "calc(100vh - 220px)", minHeight: "480px" }}>
        <OnboardingChat />
      </div>
    </div>
  );
}
