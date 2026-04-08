"use client";

import { useState } from "react";

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

const TYPE_ICONS: Record<string, string> = {
  token_warning: "⚠️",
  token_blocked: "🔴",
  subscription_expiring: "📅",
  subscription_canceled: "❌",
  payment_failed: "💳",
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
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
        title="Notificações"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ backgroundColor: "#E8A020" }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-10 z-50 w-80 overflow-hidden rounded-xl border bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <span className="text-sm font-semibold text-gray-900">Notificações</span>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-gray-400 hover:text-gray-700"
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-400">
                  Nenhuma notificação
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex gap-3 border-b px-4 py-3 last:border-0 ${
                      !n.isRead ? "bg-amber-50/50" : ""
                    }`}
                  >
                    <span className="shrink-0 text-lg">
                      {TYPE_ICONS[n.type] ?? "ℹ️"}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">{n.title}</p>
                      <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">
                        {n.message}
                      </p>
                      <p className="mt-1 text-xs text-gray-300">
                        {formatDate(n.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
