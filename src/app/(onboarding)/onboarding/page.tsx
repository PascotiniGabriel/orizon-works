import { OnboardingChat } from "@/components/onboarding/OnboardingChat";

export default function OnboardingPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "18px" }}>
      <div style={{ flexShrink: 0 }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#EBEBEB", letterSpacing: "-0.03em" }}>
          Vamos conhecer sua empresa
        </h1>
        <p style={{ marginTop: "6px", fontSize: "14px", color: "#555" }}>
          Responda às perguntas abaixo para personalizar seus agentes de IA. Leva menos de 5 minutos.
        </p>
      </div>

      {/* flex: 1 + minHeight: 0 é o par necessário para overflow funcionar em flex */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <OnboardingChat />
      </div>
    </div>
  );
}
