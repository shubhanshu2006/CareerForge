"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "react-hot-toast";
import AppHeader from "@/components/AppHeader";
import { createApi, unwrap } from "@/lib/api";
import { FaBell, FaCheckDouble, FaCircle } from "react-icons/fa";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function NotificationsPage() {
  const { getToken, isLoaded } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    if (!isLoaded) return;
    const api = createApi(() => getToken());
    try {
      const data = await unwrap<NotificationsResponse>(await api.getNotifications());
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [isLoaded, getToken]);

  useEffect(() => { load(); }, [load]);

  const handleMarkAllRead = async () => {
    const api = createApi(() => getToken());
    setMarkingAll(true);
    try {
      await unwrap(await api.markAllNotificationsRead());
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success("All marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    } finally {
      setMarkingAll(false);
    }
  };

  const handleMarkRead = async (id: number) => {
    const api = createApi(() => getToken());
    try {
      await unwrap(await api.markNotificationRead(id));
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch { /* silent */ }
  };

  if (loading) return (
    <>
      <AppHeader />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "50%", border: "3px solid var(--color-border)", borderTopColor: "var(--color-orange)", animation: "spin 0.7s linear infinite" }} />
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <AppHeader
        left={
          <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--color-white-65)" }}>
            Notifications
          </span>
        }
      />

      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto", padding: "32px", boxSizing: "border-box" }}>

          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <h1 style={{ fontFamily: "var(--font-body)", fontWeight: 800, fontSize: "clamp(22px, 3vw, 28px)", letterSpacing: "-0.025em", color: "var(--color-white)", margin: 0 }}>
                Notifications
              </h1>
              {unreadCount > 0 && (
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 700,
                  background: "var(--color-orange)", color: "#000",
                  padding: "2px 8px", borderRadius: "999px",
                }}>
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="btn-ghost"
                style={{ gap: "6px", fontSize: "12px", padding: "8px 14px" }}
              >
                <FaCheckDouble style={{ fontSize: "11px" }} />
                {markingAll ? "Marking…" : "Mark all read"}
              </button>
            )}
          </div>

          {/* Empty state */}
          {notifications.length === 0 && (
            <div style={{
              textAlign: "center", padding: "80px 24px",
              background: "var(--color-surface-2)", border: "1px solid var(--color-border)",
              borderRadius: "16px",
            }}>
              <div style={{ fontSize: "40px", marginBottom: "16px", opacity: 0.4 }}>
                <FaBell />
              </div>
              <p style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "16px", color: "var(--color-white)", margin: "0 0 8px" }}>
                No notifications yet
              </p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--color-white-40)", margin: 0 }}>
                When new jobs match your preferences, you'll see alerts here.
              </p>
            </div>
          )}

          {/* Notification list */}
          {notifications.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && handleMarkRead(n.id)}
                  style={{
                    background: n.isRead ? "var(--color-surface-2)" : "rgba(249,115,22,0.05)",
                    border: `1px solid ${n.isRead ? "var(--color-border)" : "rgba(249,115,22,0.18)"}`,
                    borderRadius: "12px",
                    padding: "16px 18px",
                    cursor: n.isRead ? "default" : "pointer",
                    transition: "border-color 0.2s, background 0.2s",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "14px",
                  }}
                  onMouseEnter={(e) => {
                    if (!n.isRead) {
                      e.currentTarget.style.borderColor = "rgba(249,115,22,0.35)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!n.isRead) {
                      e.currentTarget.style.borderColor = "rgba(249,115,22,0.18)";
                    }
                  }}
                >
                  {/* Unread dot */}
                  <div style={{ paddingTop: "4px", flexShrink: 0, width: "10px" }}>
                    {!n.isRead && (
                      <FaCircle style={{ fontSize: "8px", color: "var(--color-orange)" }} />
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "14px",
                      color: n.isRead ? "var(--color-white-65)" : "var(--color-white)",
                      margin: "0 0 4px",
                    }}>
                      {n.title}
                    </p>
                    <p style={{
                      fontFamily: "var(--font-body)", fontSize: "13px",
                      color: "var(--color-white-40)", margin: "0 0 8px", lineHeight: 1.5,
                    }}>
                      {n.message}
                    </p>
                    <span style={{
                      fontFamily: "var(--font-mono)", fontSize: "11px",
                      color: "var(--color-white-40)", letterSpacing: "0.04em",
                    }}>
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>

                  {/* Type badge */}
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700,
                    letterSpacing: "0.08em", textTransform: "uppercase",
                    color: n.type === "JOB_ALERT" ? "var(--color-orange)" : "var(--color-white-40)",
                    background: n.type === "JOB_ALERT" ? "var(--color-orange-dim)" : "var(--color-surface-3)",
                    border: `1px solid ${n.type === "JOB_ALERT" ? "var(--color-orange-border)" : "var(--color-border)"}`,
                    padding: "3px 8px", borderRadius: "999px", flexShrink: 0, whiteSpace: "nowrap",
                  }}>
                    {n.type === "JOB_ALERT" ? "Job Alert" : n.type.toLowerCase().replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
