"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { toast } from "react-hot-toast";
import AppHeader from "@/components/AppHeader";
import { createApi, unwrap } from "@/lib/api";
import {
  FaCheckCircle,
  FaCircle,
  FaShieldAlt,
  FaExclamationTriangle,
  FaCheck,
  FaBriefcase,
  FaSearch,
} from "react-icons/fa";

interface WeaknessNote {
  id: number;
  round?: string | null;
  notes?: string | null;
  feedback?: string | null;
  category?: string | null;
  overcome: boolean;
  createdAt: string;
  application: {
    id: number;
    job: {
      id: number;
      title: string;
      company: string;
    };
  };
}

interface WeaknessStats {
  total: number;
  open: number;
  overcome: number;
}

interface PagePayload {
  notes: WeaknessNote[];
  stats: WeaknessStats;
}

const CATEGORY_COLORS: Record<string, { bg: string; border: string; color: string }> = {
  DSA:            { bg: "rgba(248,113,113,0.10)", border: "rgba(248,113,113,0.30)", color: "rgb(252,165,165)" },
  Coding:         { bg: "rgba(248,113,113,0.10)", border: "rgba(248,113,113,0.30)", color: "rgb(252,165,165)" },
  "System Design":{ bg: "rgba(167,139,250,0.10)", border: "rgba(167,139,250,0.30)", color: "rgb(196,181,253)" },
  Communication:  { bg: "rgba(96,165,250,0.10)",  border: "rgba(96,165,250,0.30)",  color: "rgb(147,197,253)" },
  Behavioral:     { bg: "rgba(251,191,36,0.10)",  border: "rgba(251,191,36,0.30)",  color: "rgb(253,224,71)" },
  Aptitude:       { bg: "rgba(45,212,191,0.10)",  border: "rgba(45,212,191,0.30)",  color: "rgb(94,234,212)" },
  Other:          { bg: "var(--color-surface-3)", border: "var(--color-border)",     color: "var(--color-white-65)" },
};

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function WeaknessesPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [payload, setPayload] = useState<PagePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showOvercome, setShowOvercome] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    const api = createApi(() => getToken());
    (async () => {
      try {
        const data = await unwrap<PagePayload>(await api.listAllNotes());
        setPayload(data);
        if (data?.notes?.length && data.notes[0]) {
          setSelectedId(data.notes[0].id);
        }
      } catch {
        toast.error("Failed to load weaknesses");
      } finally {
        setLoading(false);
      }
    })();
  }, [isLoaded, isSignedIn, getToken]);

  const notes = payload?.notes ?? [];
  const stats = payload?.stats ?? { total: 0, open: 0, overcome: 0 };

  const filtered = useMemo(() => {
    let list = notes;
    if (!showOvercome) list = list.filter((n) => !n.overcome);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (n) =>
          (n.notes ?? "").toLowerCase().includes(q) ||
          (n.feedback ?? "").toLowerCase().includes(q) ||
          (n.application?.job?.company ?? "").toLowerCase().includes(q) ||
          (n.application?.job?.title ?? "").toLowerCase().includes(q) ||
          (n.category ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [notes, showOvercome, query]);

  const selected = notes.find((n) => n.id === selectedId) ?? filtered[0] ?? null;

  const handleToggle = async (note: WeaknessNote) => {
    const api = createApi(() => getToken());
    try {
      await unwrap(await api.updateNoteOvercome(note.id, !note.overcome));
      setPayload((p) => {
        if (!p) return p;
        return {
          ...p,
          stats: {
            total: p.stats.total,
            open: p.stats.open + (note.overcome ? 1 : -1),
            overcome: p.stats.overcome + (note.overcome ? -1 : 1),
          },
          notes: p.notes.map((n) =>
            n.id === note.id ? { ...n, overcome: !note.overcome } : n
          ),
        };
      });
      toast.success(note.overcome ? "Marked as still a weakness" : "Marked as overcome 🎉");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
    }
  };

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .cat-pill { font-family: var(--font-mono); font-size: 10px; padding: 3px 8px; border-radius: 4px; letter-spacing: 0.02em; }
      `}</style>

      <AppHeader
        left={
          <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--color-white-65)" }}>
            Growth Tracker
          </span>
        }
      />

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Sidebar (inner) — list of notes grouped by company */}
        <aside
          style={{
            width: "420px",
            flexShrink: 0,
            borderRight: "1px solid var(--color-border)",
            background: "var(--color-surface-1)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Stats header */}
          <div style={{ padding: "20px", borderBottom: "1px solid var(--color-border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <FaShieldAlt style={{ color: "var(--color-orange)", fontSize: "16px" }} />
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "15px", color: "var(--color-white)", margin: 0 }}>
                Skill Gap
              </h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "12px" }}>
              <div style={{ padding: "8px 6px", background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: "8px", textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "18px", color: "var(--color-white)" }}>{stats.total}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--color-white-40)", letterSpacing: "0.05em" }}>TOTAL</div>
              </div>
              <div style={{ padding: "8px 6px", background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.20)", borderRadius: "8px", textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "18px", color: "rgb(252,165,165)" }}>{stats.open}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--color-white-40)", letterSpacing: "0.05em" }}>OPEN</div>
              </div>
              <div style={{ padding: "8px 6px", background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.20)", borderRadius: "8px", textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "18px", color: "rgb(74,222,128)" }}>{stats.overcome}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--color-white-40)", letterSpacing: "0.05em" }}>DONE</div>
              </div>
            </div>

            {/* Search */}
            <div style={{ position: "relative", marginBottom: "10px" }}>
              <FaSearch style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "11px", color: "var(--color-white-40)" }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search weaknesses…"
                style={{
                  width: "100%",
                  background: "var(--color-surface-3)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  padding: "8px 10px 8px 30px",
                  fontSize: "12px",
                  color: "var(--color-white)",
                  fontFamily: "var(--font-body)",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Filter toggle */}
            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--color-white-65)" }}>
              <input
                type="checkbox"
                checked={showOvercome}
                onChange={(e) => setShowOvercome(e.target.checked)}
                style={{ cursor: "pointer" }}
              />
              Show overcome
            </label>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", border: "3px solid var(--color-border)", borderTopColor: "var(--color-orange)", animation: "spin 0.7s linear infinite", margin: "0 auto" }} />
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center" }}>
                <p style={{ fontSize: "28px", marginBottom: "8px" }}>{showOvercome ? "🎉" : "🛡️"}</p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--color-white-40)", margin: 0 }}>
                  {showOvercome ? "No notes yet." : "No open weaknesses. Great work!"}
                </p>
              </div>
            ) : (
              filtered.map((n) => {
                const active = n.id === selectedId;
                const cc = n.category ? CATEGORY_COLORS[n.category] : null;
                return (
                  <button
                    key={n.id}
                    onClick={() => setSelectedId(n.id)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "12px 16px",
                      background: active ? "var(--color-orange-dim)" : "transparent",
                      border: "none",
                      borderLeft: active ? "3px solid var(--color-orange)" : "3px solid transparent",
                      borderBottom: "1px solid var(--color-border)",
                      cursor: "pointer",
                      opacity: n.overcome ? 0.55 : 1,
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px", marginBottom: "4px" }}>
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "12px", color: "var(--color-white)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {n.application?.job?.company ?? "Unknown"}
                      </span>
                      {n.overcome ? (
                        <FaCheck style={{ fontSize: "10px", color: "rgb(74,222,128)", flexShrink: 0 }} />
                      ) : (
                        <FaExclamationTriangle style={{ fontSize: "10px", color: "rgb(252,165,165)", flexShrink: 0 }} />
                      )}
                    </div>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--color-white-65)", margin: "0 0 6px", lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {n.notes ?? n.feedback ?? ""}
                    </p>
                    <div style={{ display: "flex", gap: "4px", alignItems: "center", flexWrap: "wrap" }}>
                      {n.category && cc && (
                        <span className="cat-pill" style={{ background: cc.bg, border: `1px solid ${cc.border}`, color: cc.color }}>{n.category}</span>
                      )}
                      {n.round && (
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--color-white-40)" }}>{n.round}</span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Main detail */}
        <main style={{ flex: 1, overflowY: "auto", padding: "32px 40px" }}>
          {loading ? null : !selected ? (
            <div style={{ maxWidth: "600px", margin: "60px auto", textAlign: "center", background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: "16px", padding: "60px 32px" }}>
              <FaShieldAlt style={{ fontSize: "40px", color: "var(--color-orange)", marginBottom: "16px" }} />
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "20px", color: "var(--color-white)", margin: "0 0 8px" }}>
                No weaknesses tracked yet
              </h2>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--color-white-40)", margin: "0 0 20px" }}>
                Add notes on the Applications page describing what went wrong in your interviews. They will appear here so you can track and overcome them.
              </p>
              <Link
                href="/applications"
                style={{
                  display: "inline-block",
                  padding: "10px 20px",
                  background: "var(--color-orange-dim)",
                  border: "1px solid var(--color-orange-border)",
                  borderRadius: "8px",
                  color: "var(--color-orange)",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "13px",
                  textDecoration: "none",
                }}
              >
                Go to Applications →
              </Link>
            </div>
          ) : (
            <div style={{ maxWidth: "720px", margin: "0 auto" }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <FaBriefcase style={{ fontSize: "12px", color: "var(--color-white-40)" }} />
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--color-white-65)" }}>
                      {selected.application?.job?.company ?? "Unknown Company"}
                    </span>
                    {selected.round && (
                      <>
                        <span style={{ color: "var(--color-white-40)" }}>·</span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--color-orange)" }}>{selected.round}</span>
                      </>
                    )}
                  </div>
                  <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(22px, 3vw, 28px)", color: "var(--color-white)", margin: 0, letterSpacing: "-0.02em" }}>
                    <Link
                      href={`/jobs/${selected.application?.job?.id}`}
                      style={{ color: "inherit", textDecoration: "none" }}
                    >
                      {selected.application?.job?.title ?? "Unknown role"}
                    </Link>
                  </h1>
                </div>
                <button
                  onClick={() => handleToggle(selected)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 18px",
                    background: selected.overcome ? "rgba(74,222,128,0.10)" : "var(--color-orange-dim)",
                    border: selected.overcome ? "1px solid rgba(74,222,128,0.30)" : "1px solid var(--color-orange-border)",
                    borderRadius: "10px",
                    color: selected.overcome ? "rgb(74,222,128)" : "var(--color-orange)",
                    cursor: "pointer",
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: "13px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {selected.overcome ? <FaCheckCircle /> : <FaCircle />}
                  {selected.overcome ? "Overcome" : "Mark overcome"}
                </button>
              </div>

              {/* Pills */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "24px" }}>
                {selected.category && (() => {
                  const cc = CATEGORY_COLORS[selected.category] ?? CATEGORY_COLORS.Other;
                  return (
                    <span className="cat-pill" style={{ background: cc.bg, border: `1px solid ${cc.border}`, color: cc.color, fontSize: "11px", padding: "4px 10px" }}>
                      {selected.category}
                    </span>
                  );
                })()}
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", padding: "4px 10px", borderRadius: "4px", background: "var(--color-surface-2)", color: "var(--color-white-40)", border: "1px solid var(--color-border)" }}>
                  {formatDate(selected.createdAt)}
                </span>
              </div>

              {/* Notes body */}
              <div style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: "14px", padding: "24px", marginBottom: "20px" }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--color-white-40)", letterSpacing: "0.08em", margin: "0 0 10px" }}>
                  WHAT WENT WRONG
                </p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "15px", color: "var(--color-white-65)", margin: 0, lineHeight: 1.7, whiteSpace: "pre-wrap", textDecoration: selected.overcome ? "line-through" : "none" }}>
                  {selected.notes ?? selected.feedback ?? "(empty)"}
                </p>
              </div>

              {selected.feedback && selected.notes && (
                <div style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: "14px", padding: "24px", marginBottom: "20px" }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--color-white-40)", letterSpacing: "0.08em", margin: "0 0 10px" }}>
                    INTERVIEWER FEEDBACK
                  </p>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--color-white-65)", margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {selected.feedback}
                  </p>
                </div>
              )}

              {/* Linked application */}
              <div style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: "14px", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--color-white-40)", letterSpacing: "0.08em", margin: "0 0 4px" }}>
                    APPLICATION
                  </p>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--color-white-65)", margin: 0 }}>
                    {selected.application?.job?.company ?? "—"} · {selected.application?.job?.title ?? "—"}
                  </p>
                </div>
                <Link
                  href="/applications"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: "12px",
                    color: "var(--color-orange)",
                    textDecoration: "none",
                    padding: "6px 12px",
                    background: "var(--color-orange-dim)",
                    border: "1px solid var(--color-orange-border)",
                    borderRadius: "6px",
                  }}
                >
                  View all notes →
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
