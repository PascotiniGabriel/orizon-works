export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen" style={{ background: "#000008" }}>
      {/* Left panel — brand */}
      <div
        className="hidden lg:flex lg:w-[55%] flex-col px-16 py-12 justify-between"
        style={{ borderRight: "1px solid rgba(255,255,255,0.07)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center text-[17px] font-bold"
            style={{
              border: "1.5px solid #E8A020",
              borderRadius: "7px",
              color: "#E8A020",
              background: "rgba(232,160,32,0.07)",
              letterSpacing: "-0.06em",
            }}
          >
            O
          </div>
          <span
            style={{
              color: "#F0EDE8",
              fontSize: "15px",
              fontWeight: 600,
              letterSpacing: "-0.03em",
            }}
          >
            Orizon<span style={{ color: "#E8A020" }}>Works</span>
          </span>
        </div>

        {/* Main statement */}
        <div>
          <h1
            style={{
              color: "#F0EDE8",
              fontSize: "52px",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: "1.08",
              marginBottom: "24px",
            }}
          >
            Seus agentes<br />
            trabalham<br />
            <span style={{ color: "#E8A020" }}>enquanto você</span><br />
            cresce.
          </h1>
          <p style={{ color: "#5A5A72", fontSize: "15px", lineHeight: "1.7" }}>
            IA empresarial com o contexto real<br />da sua empresa.
          </p>
          <div style={{ marginTop: "28px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              "Múltiplos departamentos com IA dedicada",
              "Briefings que lembram o DNA da sua empresa",
              "Histórico e análise de todas as interações",
            ].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    background: "#E8A020",
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: "#6B6B84", fontSize: "13px" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ color: "#252532", fontSize: "12px" }}>
          © {new Date().getFullYear()} Orizon Works · Todos os direitos reservados
        </p>
      </div>

      {/* Right panel — form */}
      <div
        className="flex flex-1 items-center justify-center px-8 py-12 overflow-y-auto"
        style={{ background: "#0B0B12" }}
      >
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
