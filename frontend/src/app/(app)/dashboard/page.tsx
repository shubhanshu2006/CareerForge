"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useAuth } from "@clerk/nextjs";
import { toast } from "react-hot-toast";
import AppHeader from "@/components/AppHeader";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { createApi, unwrap } from "@/lib/api";
import { FaPaperPlane, FaCalendarAlt, FaTrophy, FaBookmark } from "react-icons/fa";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface DashboardMetrics {
  totalApplications?: number;
  statusBreakdown?: Record<string, number>;
  recentApplications?: Array<{
    id: number;
    status: string;
    createdAt: string;
    job?: { id: number; title: string; company?: string; companyName?: string };
  }>;
}

export default function DashboardPage() {
  const { getToken, isLoaded } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics>({});
  const [loading, setLoading] = useState(true);
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  useEffect(() => {
    if (!isLoaded) return;
    const api = createApi(() => getToken());
    (async () => {
      try {
        const data = await unwrap<DashboardMetrics>(await api.getDashboard());
        setMetrics(data ?? {});
      } catch (e) {
        console.error(e);
        toast.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, [isLoaded]);

  const breakdown = metrics.statusBreakdown ?? {};
  const recent = metrics.recentApplications ?? [];
  const totalApplied = metrics.totalApplications ?? 0;

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 1024px) { .dash-grid-4 { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 768px) {
          .dash-main-inner { padding: 80px 16px 24px !important; }
          .dash-grid-4 { grid-template-columns: 1fr 1fr !important; }
          .dash-bottom { flex-direction: column !important; }
          .dash-saved-panel { width: 100% !important; }
          .dash-activity-panel { width: 100% !important; flex: none !important; }
          .activity-table th:nth-child(2), .activity-table td:nth-child(2),
          .activity-table th:nth-child(4), .activity-table td:nth-child(4) { display: none !important; }
        }
        @media (max-width: 480px) { .dash-grid-4 { grid-template-columns: 1fr !important; } }
      `}</style>

      <AppHeader
        left={
          <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "13px", color: "var(--color-white-40)" }}>
            {today}
          </div>
        }
      />

      <div style={{ flex: 1, overflowY: "auto" }}>
        <div className="dash-main-inner" style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px", boxSizing: "border-box" }}>

          {/* Greeting */}
          <div style={{ marginBottom: "32px" }}>
            <h1
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 800,
                fontSize: "clamp(22px, 3vw, 30px)",
                letterSpacing: "-0.025em",
                color: "var(--color-white)",
                margin: "0 0 6px",
              }}
            >
              {getGreeting()} 👋
            </h1>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--color-white-40)", margin: 0 }}>
              {today}
            </p>
          </div>

          {/* Stat cards */}
          <div
            className="dash-grid-4"
            style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}
          >
            <StatCard title="Total Applied"         value={totalApplied}                                          icon={<FaPaperPlane />} />
            <StatCard title="Interviews"            value={(breakdown.INTERVIEW ?? 0) + (breakdown.FINAL_ROUND ?? 0)} icon={<FaCalendarAlt />} />
            <StatCard title="Offers Received"       value={breakdown.OFFER ?? 0}                                  icon={<FaTrophy />} accent="green" />
            <StatCard title="Rejected"              value={breakdown.REJECTED ?? 0}                               icon={<FaBookmark />} accent="blue" />
          </div>

          {/* Bottom row */}
          <div className="dash-bottom" style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>

            {/* Recent Activity table */}
            <div
              className="dash-activity-panel"
              style={{
                flex: 1,
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                borderRadius: "14px",
                overflow: "hidden",
                minWidth: 0,
              }}
            >
              <div
                style={{
                  padding: "20px 24px",
                  borderBottom: "1px solid var(--color-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <h2 style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "16px", color: "var(--color-white)", margin: 0 }}>
                  Recent Activity
                </h2>
                <Link
                  href="/applications"
                  style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "12px", color: "var(--color-orange)", textDecoration: "none" }}
                >
                  View All →
                </Link>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="activity-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                      {["Job Title", "Company", "Status", "Date"].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: "12px 20px",
                            fontFamily: "var(--font-body)",
                            fontWeight: 700,
                            fontSize: "10px",
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            color: "var(--color-white-40)",
                            textAlign: "left",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={4} style={{ padding: "32px", textAlign: "center", color: "var(--color-white-40)", fontFamily: "var(--font-body)", fontSize: "14px" }}>
                          Loading…
                        </td>
                      </tr>
                    ) : recent.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ padding: "48px", textAlign: "center" }}>
                          <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--color-white-40)", margin: "0 0 8px" }}>
                            No activity yet.
                          </p>
                          <Link
                            href="/jobs"
                            style={{
                              fontFamily: "var(--font-body)",
                              fontWeight: 700,
                              fontSize: "13px",
                              color: "var(--color-orange)",
                            }}
                          >
                            Browse jobs →
                          </Link>
                        </td>
                      </tr>
                    ) : (
                      recent.map((app) => (
                        <tr key={app.id} style={{ borderBottom: "1px solid rgba(46,46,46,0.5)" }}>
                          <td style={{ padding: "14px 20px" }}>
                            <Link
                              href={`/jobs/${app.job?.id}` as Route}
                              style={{
                                fontFamily: "var(--font-body)",
                                fontWeight: 700,
                                fontSize: "14px",
                                color: "var(--color-white)",
                                textDecoration: "none",
                                transition: "color 0.2s",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-orange)")}
                              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-white)")}
                            >
                              {app.job?.title ?? "Unknown Job"}
                            </Link>
                          </td>
                          <td style={{ padding: "14px 20px", fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--color-white-65)" }}>
                            {app.job?.companyName ?? app.job?.company ?? "—"}
                          </td>
                          <td style={{ padding: "14px 20px" }}>
                            <StatusBadge status={app.status} size="sm" />
                          </td>
                          <td style={{ padding: "14px 20px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--color-white-40)" }}>
                            {formatDate(app.createdAt)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick actions panel */}
            <div
              className="dash-saved-panel"
              style={{
                width: "260px",
                flexShrink: 0,
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                borderRadius: "14px",
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "20px", borderBottom: "1px solid var(--color-border)" }}>
                <h2 style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "15px", color: "var(--color-white)", margin: 0 }}>
                  Quick Actions
                </h2>
              </div>
              <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {([
                  { href: "/jobs",        label: "Browse Jobs",        emoji: "🔍" },
                  { href: "/applications",label: "All Applications",   emoji: "📋" },
                  { href: "/saved",       label: "Saved Jobs",         emoji: "🔖" },
                  { href: "/preferences", label: "Job Preferences",    emoji: "⚙️" },
                  { href: "/profile",     label: "My Profile",         emoji: "👤" },
                ] satisfies { href: Route; label: string; emoji: string }[]).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 12px",
                      background: "var(--color-surface-3)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "10px",
                      textDecoration: "none",
                      fontFamily: "var(--font-body)",
                      fontWeight: 700,
                      fontSize: "12px",
                      color: "var(--color-white-65)",
                      transition: "border-color 0.2s, color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--color-orange-border)";
                      e.currentTarget.style.color = "var(--color-white)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--color-border)";
                      e.currentTarget.style.color = "var(--color-white-65)";
                    }}
                  >
                    <span style={{ fontSize: "14px" }}>{item.emoji}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
