"use client";

import { useState } from "react";
import { Bell, AlertTriangle, XCircle, Calendar, CreditCard, Info } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationBellProps {
  initialNotifications: Notification[];
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  token_warning:         AlertTriangle,
  token_blocked:         XCircle,
  subscription_expiring: Calendar,
  subscription_canceled: XCircle,
  payment_failed:        CreditCard,
};

const TYPE_COLORS: Record<string, string> = {
  token_warning:         "#E8A020",
  token_blocked:         "#F87171",
  subscription_expiring: "#74B4FB",
  subscription_canceled: "#F87171",
  payment_failed:        "#F87171",
};

export function NotificationBell({ initialNotifications }: NotificationBellProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [open, setOpen] = useState(false);

  const unread = notifications.filter((n) => !n.isRead).length;

  async function markAllRead() {
    const ids = notifications.filter((n) => !n.isRead).map((n) => n.id);
    if (ids.length === 0) return;
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  function formatDate(dateStr: string) {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateStr));
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (!open && unread > 0) markAllRead();
        }}
        className="relative flex h-7 w-7 items-center justify-center rounded-[6px] transition-all duration-150 hover:bg-white/[0.05]"
        style={{ color: unread > 0 ? "#E8A020" : "#3C3C52" }}
        title="Notificações"
      >
        <Bell className="h-[14px] w-[14px]" strokeWidth={unread > 0 ? 2.5 : 1.75} />
        {unread > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-bold"
            style={{ background: "#E8A020", color: "#000008" }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          {/* Dropdown opens to the right and upward */}
          <div
            className="fixed z-50 w-72 overflow-hidden shadow-2xl"
            style={{
              background: "#111118",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "10px",
              left: "264px",
              bottom: "80px",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <span className="text-[13px] font-semibold" style={{ color: "#F0EDE8" }}>
                Notificações
              </span>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[11px] transition-colors hover:text-[#F0EDE8]"
                  style={{ color: "#3C3C52" }}
                >
                  Marcar como lidas
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-[13px]" style={{ color: "#3C3C52" }}>
                  Nenhuma notificação
                </div>
              ) : (
                notifications.map((n) => {
                  const Icon = TYPE_ICONS[n.type] ?? Info;
                  const iconColor = TYPE_COLORS[n.type] ?? "#6B6B84";
                  return (
                    <div
                      key={n.id}
                      className="flex gap-3 px-4 py-3"
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        background: !n.isRead ? "rgba(232,160,32,0.03)" : "transparent",
                      }}
                    >
                      <div
                        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px]"
                        style={{ background: `${iconColor}15` }}
                      >
                        <Icon className="h-3.5 w-3.5" style={{ color: iconColor }} strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium" style={{ color: "#F0EDE8" }}>
                          {n.title}
                        </p>
                        <p className="mt-0.5 text-[12px] leading-relaxed" style={{ color: "#5A5A72" }}>
                          {n.message}
                        </p>
                        <p className="mt-1 text-[10px]" style={{ color: "#2C2C3A" }}>
                          {formatDate(n.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
