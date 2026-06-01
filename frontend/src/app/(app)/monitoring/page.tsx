"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import AppHeader from "@/components/AppHeader";
import { unwrap } from "@/lib/api";
import { FaHeartbeat, FaSync, FaCheckCircle, FaTimesCircle, FaExclamationTriangle } from "react-icons/fa";

interface HealthData {
  status?: string;
  uptime?: number;
  timestamp?: string;
}

interface RunData {
  runId?: string;
  id?: string;
  source?: string;
  status?: string;
  jobsFound?: number;
  jobsNew?: number;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  errorMessage?: string;
}

interface AggregateData {
  totalRuns?: number;
  successfulRuns?: number;
  failedRuns?: number;
  totalJobsFound?: number;
  totalJobsNew?: number;
  sources?: Array<{ source: string; runs: number; jobsFound: number }>;
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
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <StatusIcon status={health?.status ?? "unknown"} />
                  <div>
                    <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "16px", color: health?.status?.toLowerCase() === "ok" || health?.status?.toLowerCase() === "healthy" ? "#4ade80" : "#f87171", margin: 0 }}>
                      {health?.status ?? "Unknown"}
                    </p>
                    {health?.uptime !== undefined && (
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--color-white-40)", margin: "3px 0 0" }}>
                        Uptime: {Math.floor((health.uptime ?? 0) / 3600)}h {Math.floor(((health.uptime ?? 0) % 3600) / 60)}m
                      </p>
                    )}
                    {health?.timestamp && (
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--color-white-40)", margin: "2px 0 0" }}>
                        Last checked: {formatDate(health.timestamp)}
                      </p>
                    )}
                  </div>
                </div>
              </SectionCard>

              {/* Aggregates */}
              {aggs && (
                <SectionCard title="Summary">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "14px", marginBottom: "20px" }}>
                    {[
                      { label: "Total Runs", value: aggs.totalRuns ?? 0, color: "#60a5fa" },
                      { label: "Successful", value: aggs.successfulRuns ?? 0, color: "#4ade80" },
                      { label: "Failed", value: aggs.failedRuns ?? 0, color: "#f87171" },
                      { label: "Jobs Found", value: aggs.totalJobsFound ?? 0, color: "var(--color-orange)" },
                      { label: "Jobs New", value: aggs.totalJobsNew ?? 0, color: "#c084fc" },
                    ].map((s) => (
                      <div key={s.label} style={{ background: "var(--color-surface-3)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "16px" }}>
                        <p style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "26px", color: s.color, margin: "0 0 4px" }}>
                          {s.value.toLocaleString()}
                        </p>
                        <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-white-40)", margin: 0 }}>
                          {s.label}
                        </p>
                      </div>
                    ))}
                  </div>

                  {aggs.sources && aggs.sources.length > 0 && (
                    <>
                      <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-white-40)", marginBottom: "10px" }}>
                        By Source
                      </p>
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                              {["Source", "Runs", "Jobs Found"].map((h) => (
                                <th key={h} style={{ padding: "8px 12px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-white-40)", textAlign: "left" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {aggs.sources.map((s) => (
                              <tr key={s.source} style={{ borderBottom: "1px solid rgba(46,46,46,0.5)" }}>
                                <td style={{ padding: "10px 12px", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "13px", color: "var(--color-white)" }}>{s.source}</td>
                                <td style={{ padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--color-white-65)" }}>{s.runs}</td>
                                <td style={{ padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--color-orange)" }}>{s.jobsFound}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
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
                        {runs.slice(0, 50).map((run, i) => (
                          <tr key={run.runId ?? run.id ?? i} className="run-row">
                            <td style={{ padding: "12px 14px", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "13px", color: "var(--color-white)", whiteSpace: "nowrap" }}>
                              {run.source ?? "—"}
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <StatusIcon status={run.status} />
                                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "11px", color: run.status?.toLowerCase() === "success" ? "#4ade80" : run.status?.toLowerCase() === "failed" ? "#f87171" : "var(--color-white-40)" }}>
                                  {run.status ?? "—"}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--color-white-65)" }}>
                              {run.jobsFound ?? "—"}
                            </td>
                            <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", fontSize: "13px", color: run.jobsNew ? "var(--color-orange)" : "var(--color-white-40)" }}>
                              {run.jobsNew ?? "—"}
                            </td>
                            <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--color-white-40)", whiteSpace: "nowrap" }}>
                              {formatDuration(run.durationMs)}
                            </td>
                            <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--color-white-40)", whiteSpace: "nowrap" }}>
                              {formatDate(run.startedAt)}
                            </td>
                          </tr>
                        ))}
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
