import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCompanyAgents, getUserCompanyInfo } from "@/lib/db/queries/company";
import { getUnreadNotifications } from "@/lib/db/queries/admin";
import { AppSidebar } from "@/components/app/AppSidebar";
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

  const notifications = rawNotifications.map((n) => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
  }));

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#000008" }}>
      <AppSidebar
        agents={agents}
        role={info.role}
        notifications={notifications}
        fullName={info.fullName}
        tokenBalance={info.tokenBalance}
        tokenLimit={info.tokenLimit}
      />
      <main
        className="flex-1 overflow-y-auto"
        style={{ background: "#0B0B12" }}
      >
        {children}
      </main>
    </div>
  );
}
