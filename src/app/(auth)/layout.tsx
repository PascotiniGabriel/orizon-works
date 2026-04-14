export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", height: "100vh", background: "#0A0A0A" }}>

      {/* ── Left brand panel ── */}
      <div
        className="hidden lg:flex lg:w-[400px] shrink-0 flex-col"
        style={{
          padding: "28px 32px",
          borderRight: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
          <div
            style={{
              width: "26px",
              height: "26px",
              background: "#10B981",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ color: "#000", fontSize: "12px", fontWeight: 800, letterSpacing: "-0.04em" }}>O</span>
          </div>
          <span
            style={{
              color: "#EBEBEB",
              fontSize: "14px",
              fontWeight: 600,
              letterSpacing: "-0.025em",
            }}
          >
            Orizon Works
          </span>
        </div>

        {/* Center content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <p
            style={{
              color: "#10B981",
              fontSize: "10px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              marginBottom: "16px",
            }}
          >
            Plataforma de IA Empresarial
          </p>

          <h2
            style={{
              color: "#EBEBEB",
              fontSize: "26px",
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 1.25,
              marginBottom: "28px",
            }}
          >
            Agentes de IA prontos<br />para o seu negócio.
          </h2>

          {/* Feature bullets */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {[
              "Agentes especializados por departamento",
              "Briefing completo do DNA da empresa",
              "Histórico e análise de todas as sessões",
              "Múltiplos usuários com controle de acesso",
            ].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    background: "#10B981",
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: "#555", fontSize: "13px", lineHeight: 1.4 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ color: "#2A2A2A", fontSize: "11px" }}>
          © {new Date().getFullYear()} Orizon Works · Todos os direitos reservados
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 24px",
          background: "#111111",
          overflowY: "auto",
        }}
      >
        <div style={{ width: "100%", maxWidth: "360px" }}>{children}</div>
      </div>
    </div>
  );
}
