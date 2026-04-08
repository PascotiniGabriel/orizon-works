import type { ReactNode } from "react";

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8fafc" }}>
      {/* Header */}
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg font-bold text-white text-sm"
            style={{ backgroundColor: "#E8A020" }}
          >
            O
          </div>
          <span className="font-bold text-lg" style={{ color: "#0D1B2A" }}>
            OrizonWorks
          </span>
          <span className="ml-2 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700 border border-orange-200">
            Configuração inicial
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
