export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Lado esquerdo — branding */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{ backgroundColor: "#0D1B2A" }}
      >
        <div>
          <span className="text-2xl font-bold text-white tracking-tight">
            Orizon<span style={{ color: "#E8A020" }}>Works</span>
          </span>
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Agentes de IA para{" "}
            <span style={{ color: "#E8A020" }}>sua equipe</span>
          </h1>
          <p className="text-lg" style={{ color: "#8BA6C1" }}>
            Configure assistentes inteligentes para RH, Marketing, Comercial e
            muito mais. Tudo com o contexto da sua empresa.
          </p>
        </div>
        <p style={{ color: "#8BA6C1" }} className="text-sm">
          © {new Date().getFullYear()} Orizon Works. Todos os direitos
          reservados.
        </p>
      </div>

      {/* Lado direito — formulário */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
