import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserCompanyInfo } from "@/lib/db/queries/company";
import type { ReactNode } from "react";

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const info = await getUserCompanyInfo(user.id);
  if (!info) redirect("/login");

  // Se o onboarding já foi concluído, manda direto para o escritório
  if (info.onboardingCompleted) redirect("/escritorio");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0A0A0A" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "#0A0A0A", padding: "0 24px", height: "52px", display: "flex", alignItems: "center" }}>
        <div style={{ maxWidth: "900px", width: "100%", margin: "0 auto", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "24px", height: "24px", background: "#10B981", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ color: "#000", fontSize: "12px", fontWeight: 800 }}>O</span>
          </div>
          <span style={{ color: "#EBEBEB", fontSize: "15px", fontWeight: 600, letterSpacing: "-0.025em" }}>
            Orizon Works
          </span>
          <span style={{ marginLeft: "8px", borderRadius: "999px", background: "rgba(16,185,129,0.1)", padding: "2px 10px", fontSize: "11px", fontWeight: 600, color: "#10B981", border: "1px solid rgba(16,185,129,0.2)", letterSpacing: "0.02em" }}>
            Configuração inicial
          </span>
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 24px" }}>
        {children}
      </main>
    </div>
  );
}
