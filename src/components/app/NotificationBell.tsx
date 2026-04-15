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
  token_warning:         "#FBBF24",
  token_blocked:         "#F87171",
  subscription_expiring: "#60A5FA",
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
    <div style={{ position: "relative" }}>
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (!open && unread > 0) markAllRead();
        }}
        title="Notificações"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "28px",
          height: "28px",
          borderRadius: "5px",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: unread > 0 ? "#10B981" : "#666",
          position: "relative",
          transition: "background 0.12s",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
      >
        <Bell style={{ width: "14px", height: "14px" }} strokeWidth={unread > 0 ? 2.5 : 1.75} />
        {unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-1px",
              right: "-1px",
              width: "14px",
              height: "14px",
              borderRadius: "50%",
              background: "#10B981",
              color: "#000",
              fontSize: "8px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 40 }}
            onClick={() => setOpen(false)}
          />
          {/* Dropdown opens right of sidebar, upward */}
          <div
            style={{
              position: "fixed",
              zIndex: 50,
              width: "280px",
              background: "#161616",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "8px",
              boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
              left: "228px",
              bottom: "70px",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <span style={{ color: "#EBEBEB", fontSize: "13px", fontWeight: 600 }}>
                Notificações
              </span>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#555",
                    fontSize: "11px",
                    fontFamily: "inherit",
                  }}
                >
                  Marcar como lidas
                </button>
              )}
            </div>

            {/* List */}
            <div style={{ maxHeight: "280px", overflowY: "auto" }}>
              {notifications.length === 0 ? (
                <div
                  style={{
                    padding: "32px 16px",
                    textAlign: "center",
                    color: "#3A3A3A",
                    fontSize: "12px",
                  }}
                >
                  Nenhuma notificação
                </div>
              ) : (
                notifications.map((n) => {
                  const Icon = TYPE_ICONS[n.type] ?? Info;
                  const iconColor = TYPE_COLORS[n.type] ?? "#555";
                  return (
                    <div
                      key={n.id}
                      style={{
                        display: "flex",
                        gap: "12px",
                        padding: "12px 16px",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        background: !n.isRead ? "rgba(16,185,129,0.03)" : "transparent",
                      }}
                    >
                      <div
                        style={{
                          marginTop: "2px",
                          width: "28px",
                          height: "28px",
                          borderRadius: "5px",
                          background: `${iconColor}15`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Icon style={{ width: "13px", height: "13px", color: iconColor }} strokeWidth={2} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ color: "#EBEBEB", fontSize: "12px", fontWeight: 500 }}>{n.title}</p>
                        <p style={{ color: "#555", fontSize: "11px", marginTop: "2px", lineHeight: 1.5 }}>
                          {n.message}
                        </p>
                        <p style={{ color: "#3A3A3A", fontSize: "10px", marginTop: "4px", fontFamily: "var(--font-geist-mono)" }}>
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
