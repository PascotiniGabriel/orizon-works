import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCompanyAgents, getUserCompanyInfo } from "@/lib/db/queries/company";
import { getUnreadNotifications } from "@/lib/db/queries/admin";
import { AppSidebar } from "@/components/app/AppSidebar";
import { AppHeader } from "@/components/app/AppHeader";
import type { ReactNode } from "react";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const info = await getUserCompanyInfo(user.id);
  if (!info) redirect("/login");

  const [agents, rawNotifications] = await Promise.all([
    getCompanyAgents(info.companyId),
    getUnreadNotifications(info.companyId, info.userId),
  ]);

  // Serializar datas para client component
  const notifications = rawNotifications.map((n) => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
  }));

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#08080D" }}>
      <AppSidebar agents={agents} role={info.role} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader
          fullName={info.fullName}
          companyName={info.companyName}
          tokenBalance={info.tokenBalance}
          tokenLimit={info.tokenLimit}
          notifications={notifications}
        />
        <main className="flex-1 overflow-y-auto p-8" style={{ background: "#08080D" }}>{children}</main>
      </div>
    </div>
  );
}
