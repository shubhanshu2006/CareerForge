"use client";

import React, { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "react-hot-toast";
import AppHeader from "@/components/AppHeader";
import { createApi, unwrap } from "@/lib/api";
import { FaRobot, FaBrain, FaChartBar, FaRoute, FaSearch } from "react-icons/fa";

type InsightTab = "failures" | "patterns" | "skills" | "roadmap";

interface TabConfig {
  id: InsightTab;
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
  border: string;
  bg: string;
}

const TABS: TabConfig[] = [
  {
    id: "failures",
    icon: <FaBrain />,
    label: "Interview Failures",
    description: "Understand why interviews didn't progress and how to improve.",
    color: "#f87171",
    border: "rgba(239,68,68,0.20)",
    bg: "rgba(239,68,68,0.08)",
  },
  {
    id: "patterns",
    icon: <FaChartBar />,
    label: "Application Patterns",
    description: "AI analysis of your application patterns and what's working.",
    color: "#60a5fa",
    border: "rgba(59,130,246,0.20)",
    bg: "rgba(59,130,246,0.08)",
  },
  {
    id: "skills",
    icon: <FaSearch />,
    label: "Skill Gaps",
    description: "Identify the skills you're missing for your target role.",
    color: "var(--color-orange)",
    border: "var(--color-orange-border)",
    bg: "var(--color-orange-dim)",
  },
  {
    id: "roadmap",
    icon: <FaRoute />,
    label: "Preparation Roadmap",
    description: "Get a personalized week-by-week plan to land your next role.",
    color: "#4ade80",
    border: "rgba(74,222,128,0.20)",
    bg: "rgba(74,222,128,0.08)",
  },
];

function ResultBlock({ content }: { content: string | Record<string, unknown> | null }) {
  if (!content) return null;
  const text = typeof content === "string" ? content : JSON.stringify(content, null, 2);
  return (
    <div
      style={{
        background: "var(--color-surface-3)",
        border: "1px solid var(--color-border)",
        borderRadius: "12px",
        padding: "20px",
        marginTop: "16px",
        fontFamily: "var(--font-body)",
        fontSize: "14px",
        color: "var(--color-white-65)",
        lineHeight: 1.8,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}
    >
      {text}
    </div>
  );
}

export default function AiInsightsPage() {
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState<InsightTab>("failures");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<InsightTab, unknown>>({
    failures: null, patterns: null, skills: null, roadmap: null,
  });

  // Form states
  const [targetRole, setTargetRole] = useState("");
  const [targetSkills, setTargetSkills] = useState("");
  const [weeks, setWeeks] = useState("8");

  const tab = TABS.find((t) => t.id === activeTab)!;

  const handleRun = async () => {
    const api = createApi(() => getToken());
    setLoading(true);
    try {
      let res: Response;
      if (activeTab === "failures") {
        res = await api.interviewFailures();
      } else if (activeTab === "patterns") {
        res = await api.patternInsights();
      } else if (activeTab === "skills") {
        if (!targetRole.trim()) { toast.error("Please enter a target role"); setLoading(false); return; }
        res = await api.skillGaps({
          targetRole: targetRole.trim(),
          targetSkills: targetSkills ? targetSkills.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
        });
      } else {
        if (!targetRole.trim()) { toast.error("Please enter a target role"); setLoading(false); return; }
        res = await api.roadmap({ targetRole: targetRole.trim(), weeks: parseInt(weeks) || 8 });
      }
      const data = await unwrap(res);
      setResults((r) => ({ ...r, [activeTab]: data }));
    } catch (e) {
      console.error(e);
      toast.error("Failed to run analysis. Make sure you have applications tracked.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <AppHeader left={<span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--color-white-65)" }}>AI Insights</span>} />

      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "32px", boxSizing: "border-box" }}>

          {/* Page header */}
          <div style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: "#c084fc", fontSize: "18px" }}>
                <FaRobot />
              </div>
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(22px, 3vw, 28px)", letterSpacing: "-0.025em", color: "var(--color-white)", margin: 0 }}>
                AI Insights
              </h1>
            </div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--color-white-40)", margin: 0 }}>
              AI-powered analysis of your career data to help you land your target role faster.
            </p>
          </div>

          {/* Tab grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "24px" }}>
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  background: activeTab === t.id ? t.bg : "var(--color-surface-2)",
                  border: `1px solid ${activeTab === t.id ? t.border : "var(--color-border)"}`,
                  borderRadius: "14px",
                  padding: "18px 20px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => { if (activeTab !== t.id) { (e.currentTarget as HTMLElement).style.borderColor = t.border; (e.currentTarget as HTMLElement).style.background = t.bg; } }}
                onMouseLeave={(e) => { if (activeTab !== t.id) { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)"; (e.currentTarget as HTMLElement).style.background = "var(--color-surface-2)"; } }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "16px", color: t.color }}>{t.icon}</span>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "14px", color: "var(--color-white)" }}>
                    {t.label}
                  </span>
                </div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--color-white-40)", margin: 0, lineHeight: 1.5 }}>
                  {t.description}
                </p>
              </button>
            ))}
          </div>

          {/* Active panel */}
          <div
            style={{
              background: "var(--color-surface-2)",
              border: `1px solid ${tab.border}`,
              borderRadius: "16px",
              padding: "28px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <span style={{ fontSize: "18px", color: tab.color }}>{tab.icon}</span>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "18px", color: "var(--color-white)", margin: 0 }}>
                {tab.label}
              </h2>
            </div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--color-white-40)", marginBottom: "20px" }}>
              {tab.description}
            </p>

            {/* Role input for skills + roadmap */}
            {(activeTab === "skills" || activeTab === "roadmap") && (
              <div style={{ marginBottom: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div>
                  <label style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-white-40)", display: "block", marginBottom: "6px" }}>
                    Target Role *
                  </label>
                  <input
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g., Senior Frontend Engineer"
                    style={{ width: "100%", background: "var(--color-surface-3)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "11px 16px", fontSize: "14px", color: "var(--color-white)", outline: "none", transition: "border-color 0.2s", boxSizing: "border-box" }}
                    onFocus={(e) => (e.target.style.borderColor = tab.color)}
                    onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
                  />
                </div>
                {activeTab === "skills" && (
                  <div>
                    <label style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-white-40)", display: "block", marginBottom: "6px" }}>
                      Target Skills (comma-separated, optional)
                    </label>
                    <input
                      value={targetSkills}
                      onChange={(e) => setTargetSkills(e.target.value)}
                      placeholder="React, Node.js, TypeScript…"
                      style={{ width: "100%", background: "var(--color-surface-3)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "11px 16px", fontSize: "14px", color: "var(--color-white)", outline: "none", transition: "border-color 0.2s", boxSizing: "border-box" }}
                      onFocus={(e) => (e.target.style.borderColor = tab.color)}
                      onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
                    />
                  </div>
                )}
                {activeTab === "roadmap" && (
                  <div>
                    <label style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-white-40)", display: "block", marginBottom: "6px" }}>
                      Preparation Weeks
                    </label>
                    <select
                      value={weeks}
                      onChange={(e) => setWeeks(e.target.value)}
                      style={{ background: "var(--color-surface-3)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "11px 16px", fontSize: "14px", color: "var(--color-white-65)", outline: "none", cursor: "pointer" }}
                    >
                      {[2, 4, 6, 8, 12, 16].map((w) => (
                        <option key={w} value={w}>{w} weeks</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleRun}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "14px",
                padding: "12px 24px",
                borderRadius: "10px",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                background: loading ? "var(--color-surface-3)" : tab.color === "var(--color-orange)" ? "var(--color-orange)" : tab.bg,
                color: loading ? "var(--color-white-40)" : tab.color === "var(--color-orange)" ? "#000" : tab.color,
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: tab.border,
                transition: "all 0.2s",
              }}
            >
              {loading ? (
                <>
                  <div style={{ width: "14px", height: "14px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "currentColor", animation: "spin 0.7s linear infinite" }} />
                  Analyzing…
                </>
              ) : (
                <>{tab.icon} Run Analysis</>
              )}
            </button>

            {/* Result */}
            {results[activeTab] !== null && (
              <ResultBlock content={results[activeTab] as string | Record<string, unknown>} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
