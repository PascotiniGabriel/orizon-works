export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", height: "100vh", background: "#0A0A0A" }}>

      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-[400px] shrink-0 flex-col"
        style={{ padding: "32px 36px", borderRight: "1px solid rgba(255,255,255,0.07)" }}>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "28px", height: "28px", background: "#10B981", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ color: "#000", fontSize: "13px", fontWeight: 800 }}>O</span>
          </div>
          <span style={{ color: "#EBEBEB", fontSize: "16px", fontWeight: 600, letterSpacing: "-0.025em" }}>
            Orizon Works
          </span>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <p style={{ color: "#10B981", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "18px" }}>
            Plataforma de IA Empresarial
          </p>
          <h2 style={{ color: "#EBEBEB", fontSize: "30px", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.2, marginBottom: "30px" }}>
            Agentes de IA prontos<br />para o seu negócio.
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "36px" }}>
            {[
              "Agentes especializados por departamento",
              "Briefing completo do DNA da empresa",
              "Histórico e análise de todas as sessões",
              "Múltiplos usuários com controle de acesso",
            ].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10B981", flexShrink: 0 }} />
                <span style={{ color: "#555", fontSize: "15px", lineHeight: 1.4 }}>{item}</span>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "24px" }}>
            <p style={{ color: "#555", fontSize: "14px", lineHeight: 1.6, fontStyle: "italic", marginBottom: "14px" }}>
              &ldquo;Economizamos mais de 40 horas por mês só no setor comercial. O agente responde propostas, objeções e qualifica leads antes mesmo de eu entrar na reunião.&rdquo;
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: "#10B981", flexShrink: 0 }}>
                RF
              </div>
              <div>
                <p style={{ color: "#888", fontSize: "13px", fontWeight: 600, margin: 0 }}>Ricardo F.</p>
                <p style={{ color: "#444", fontSize: "12px", margin: 0 }}>Diretor Comercial · Distribuidora Podal</p>
              </div>
            </div>
          </div>
        </div>

        <p style={{ color: "#2A2A2A", fontSize: "13px" }}>
          © {new Date().getFullYear()} Orizon Works · Todos os direitos reservados
        </p>
      </div>

      {/* Right form panel */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 24px", background: "#111111", overflowY: "auto" }}>
        <div style={{ width: "100%", maxWidth: "380px" }}>{children}</div>
      </div>
    </div>
  );
}
