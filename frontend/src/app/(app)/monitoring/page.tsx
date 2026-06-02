"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import AppHeader from "@/components/AppHeader";
import { unwrap } from "@/lib/api";
import { FaHeartbeat, FaSync, FaCheckCircle, FaTimesCircle, FaExclamationTriangle } from "react-icons/fa";

interface HealthData {
  latestRuns?: Array<{ source: string; startedAt: string; completedAt?: string; totalFetched: number; totalInserted: number }>;
  last24Hours?: { runCount: number; totalFetched: number; totalInserted: number; totalSkipped: number; totalFailed: number };
}

interface RunData {
  runId?: string;
  id?: string;
  source?: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  totalFetched?: number;
  totalInserted?: number;
  totalSkipped?: number;
  totalFailed?: number;
  alertsGenerated?: number;
  emailsEnqueued?: number;
}

interface AggregateData {
  runCount?: number;
  totalFetched?: number;
  totalInserted?: number;
  totalSkipped?: number;
  totalFailed?: number;
  avgDurationMs?: number;
}

function formatDuration(ms?: number): string {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

function formatDate(d?: string): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function StatusIcon({ status }: { status?: string }) {
  if (!status) return null;
  const s = status.toLowerCase();
  if (s === "success" || s === "healthy" || s === "ok")
    return <FaCheckCircle style={{ color: "#4ade80", fontSize: "14px" }} />;
  if (s === "failed" || s === "error")
    return <FaTimesCircle style={{ color: "#f87171", fontSize: "14px" }} />;
  return <FaExclamationTriangle style={{ color: "#fbbf24", fontSize: "14px" }} />;
}

export default function MonitoringPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [runs, setRuns] = useState<RunData[]>([]);
  const [aggs, setAggs] = useState<AggregateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    setRefreshing(true);
    try {
      const [healthRes, runsRes, aggsRes] = await Promise.all([
        unwrap<HealthData>(await fetch("/api/v1/monitoring/health").then(async (r) => { if (!r.ok) throw new Error(""); return r; })).catch(() => null),
        unwrap<RunData[] | { runs?: RunData[] }>(await fetch("/api/v1/monitoring/runs").then(async (r) => { if (!r.ok) throw new Error(""); return r; })).catch(() => null),
        unwrap<AggregateData>(await fetch("/api/v1/monitoring/aggregates").then(async (r) => { if (!r.ok) throw new Error(""); return r; })).catch(() => null),
      ]);
      if (healthRes) setHealth(healthRes as HealthData);
      if (runsRes) {
        const list = Array.isArray(runsRes) ? runsRes : (runsRes as { runs?: RunData[] }).runs ?? [];
        setRuns(list as RunData[]);
      }
      if (aggsRes) setAggs(aggsRes as AggregateData);
    } catch {
      toast.error("Failed to load monitoring data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: "16px", padding: "24px", marginBottom: "20px" }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "16px", color: "var(--color-white)", margin: "0 0 20px", letterSpacing: "-0.015em" }}>{title}</h2>
      {children}
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .run-row { border-bottom: 1px solid rgba(46,46,46,0.5); }
        .run-row:last-child { border-bottom: none; }
      `}</style>

      <AppHeader left={<span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--color-white-65)" }}>Monitoring</span>} />

      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "32px", boxSizing: "border-box" }}>

          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "28px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <FaHeartbeat style={{ fontSize: "18px", color: "#4ade80" }} />
                <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(22px, 3vw, 28px)", letterSpacing: "-0.025em", color: "var(--color-white)", margin: 0 }}>
                  Monitoring
                </h1>
              </div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--color-white-40)", margin: 0 }}>
                Scraper health and job discovery statistics.
              </p>
            </div>
            <button
              onClick={loadData}
              disabled={refreshing}
              className="btn-ghost"
              style={{ gap: "7px" }}
            >
              <FaSync style={{ fontSize: "11px", animation: refreshing ? "spin 0.7s linear infinite" : "none" }} />
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "80px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", border: "3px solid var(--color-border)", borderTopColor: "#4ade80", animation: "spin 0.7s linear infinite", margin: "0 auto" }} />
            </div>
          ) : (
            <>
              {/* Health status */}
              <SectionCard title="System Health">
                {health ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <FaCheckCircle style={{ color: "#4ade80", fontSize: "16px" }} />
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "15px", color: "#4ade80" }}>Healthy</span>
                    </div>
                    {health.last24Hours && (
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--color-white-40)", margin: 0 }}>
                        Last 24h: {health.last24Hours.runCount} runs · {health.last24Hours.totalFetched.toLocaleString()} fetched · {health.last24Hours.totalInserted.toLocaleString()} new jobs
                      </p>
                    )}
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <FaExclamationTriangle style={{ color: "#fbbf24", fontSize: "14px" }} />
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "15px", color: "#fbbf24" }}>Unknown</span>
                  </div>
                )}
              </SectionCard>

              {/* Aggregates */}
              {aggs && (
                <SectionCard title="Summary">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "14px" }}>
                    {[
                      { label: "Total Runs",  value: aggs.runCount ?? 0,        color: "#60a5fa" },
                      { label: "Jobs Found",  value: aggs.totalFetched ?? 0,    color: "var(--color-orange)" },
                      { label: "Jobs New",    value: aggs.totalInserted ?? 0,   color: "#4ade80" },
                      { label: "Duplicates",  value: aggs.totalSkipped ?? 0,    color: "#c084fc" },
                      { label: "Avg Duration",value: aggs.avgDurationMs ? `${(aggs.avgDurationMs / 1000).toFixed(1)}s` : "—", color: "#fbbf24", raw: true },
                    ].map((s) => (
                      <div key={s.label} style={{ background: "var(--color-surface-3)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "16px" }}>
                        <p style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "22px", color: s.color, margin: "0 0 4px" }}>
                          {s.raw ? s.value : typeof s.value === "number" ? s.value.toLocaleString() : s.value}
                        </p>
                        <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-white-40)", margin: 0 }}>
                          {s.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              )}

              {/* Recent runs */}
              <SectionCard title={`Recent Runs ${runs.length > 0 ? `(${runs.length})` : ""}`}>
                {runs.length === 0 ? (
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--color-white-40)", textAlign: "center", padding: "32px 0" }}>
                    No scraper runs found.
                  </p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                          {["Source", "Status", "Jobs Found", "New Jobs", "Duration", "Started"].map((h) => (
                            <th key={h} style={{ padding: "10px 14px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-white-40)", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {runs.slice(0, 50).map((run, i) => {
                          const status = run.completedAt
                            ? (run.totalFailed ?? 0) > 0 ? "partial" : "success"
                            : "running";
                          const statusColor = status === "success" ? "#4ade80" : status === "partial" ? "#fbbf24" : "#60a5fa";
                          return (
                          <tr key={run.runId ?? run.id ?? i} className="run-row">
                            <td style={{ padding: "12px 14px", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "13px", color: "var(--color-white)", whiteSpace: "nowrap" }}>
                              {run.source ?? "—"}
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "11px", color: statusColor, background: `${statusColor}18`, padding: "3px 8px", borderRadius: "999px", border: `1px solid ${statusColor}40` }}>
                                {status.toUpperCase()}
                              </span>
                            </td>
                            <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--color-white-65)" }}>
                              {run.totalFetched?.toLocaleString() ?? "—"}
                            </td>
                            <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", fontSize: "13px", color: (run.totalInserted ?? 0) > 0 ? "var(--color-orange)" : "var(--color-white-40)" }}>
                              {run.totalInserted?.toLocaleString() ?? "—"}
                            </td>
                            <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--color-white-40)", whiteSpace: "nowrap" }}>
                              {formatDuration(run.durationMs)}
                            </td>
                            <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--color-white-40)", whiteSpace: "nowrap" }}>
                              {formatDate(run.startedAt)}
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </SectionCard>
            </>
          )}
        </div>
      </div>
    </>
  );
}
