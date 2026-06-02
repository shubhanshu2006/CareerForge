"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { toast } from "react-hot-toast";
import AppHeader from "@/components/AppHeader";
import StatusBadge, { getStatusStyle } from "@/components/StatusBadge";
import { createApi, extractItems, unwrap } from "@/lib/api";
import {
  FaChevronDown,
  FaPlus,
  FaStickyNote,
  FaTimes,
  FaCheckCircle,
  FaCircle,
  FaRedo,
} from "react-icons/fa";

const STATUS_OPTIONS = [
  "SAVED", "APPLIED", "PHONE_SCREEN", "INTERVIEW", "OFFER", "REJECTED", "WITHDRAWN",
];

const CATEGORY_OPTIONS = [
  "DSA",
  "System Design",
  "Coding",
  "Communication",
  "Behavioral",
  "Aptitude",
  "Other",
];

interface ApplicationNote {
  id: number;
  round?: string | null;
  notes?: string | null;
  feedback?: string | null;
  category?: string | null;
  overcome: boolean;
  createdAt: string;
}
interface Application {
  id: number;
  status: string;
  createdAt: string;
  job?: {
    id: number;
    title?: string;
    company?: string;
    companyName?: string;
    location?: string;
    applyUrl?: string;
  };
  notes?: ApplicationNote[];
}

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ApplicationsPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number, ApplicationNote[]>>({});
  const [noteLoading, setNoteLoading] = useState<Record<number, boolean>>({});
  const [newNote, setNewNote] = useState<Record<number, string>>({});
  const [newNoteRound, setNewNoteRound] = useState<Record<number, string>>({});
  const [newNoteCategory, setNewNoteCategory] = useState<Record<number, string>>({});
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    const api = createApi(() => getToken());
    (async () => {
      try {
        const data = await unwrap<{ items?: Application[]; applications?: Application[] }>(
          await api.listApplications({ limit: 100 })
        );
        setApplications(extractItems(data));
      } catch {
        toast.error("Failed to load applications");
      } finally {
        setLoading(false);
      }
    })();
  }, [isLoaded, isSignedIn, getToken]);

  const handleStatusChange = async (appId: number, newStatus: string) => {
    const api = createApi(() => getToken());
    try {
      await unwrap(await api.updateApplicationStatus(appId, newStatus));
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
      );
      toast.success(`Status → ${newStatus.replace(/_/g, " ").toLowerCase()}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const loadNotes = async (appId: number) => {
    if (notes[appId]) return;
    const api = createApi(() => getToken());
    setNoteLoading((p) => ({ ...p, [appId]: true }));
    try {
      const data = await unwrap<ApplicationNote[]>(await api.listNotes(appId));
      setNotes((p) => ({ ...p, [appId]: Array.isArray(data) ? data : [] }));
    } catch { /* ignore */ } finally {
      setNoteLoading((p) => ({ ...p, [appId]: false }));
    }
  };

  const handleToggleExpand = async (appId: number) => {
    if (expandedId === appId) {
      setExpandedId(null);
    } else {
      setExpandedId(appId);
      await loadNotes(appId);
    }
  };

  const handleAddNote = async (appId: number) => {
    const content = newNote[appId]?.trim();
    if (!content) return;
    const round = newNoteRound[appId]?.trim() || undefined;
    const category = newNoteCategory[appId]?.trim() || undefined;
    const api = createApi(() => getToken());
    try {
      const list = await unwrap<ApplicationNote[]>(
        await api.createNote(appId, { notes: content, round, category })
      );
      setNotes((p) => ({ ...p, [appId]: Array.isArray(list) ? list : [] }));
      setNewNote((p) => ({ ...p, [appId]: "" }));
      setNewNoteRound((p) => ({ ...p, [appId]: "" }));
      setNewNoteCategory((p) => ({ ...p, [appId]: "" }));
      toast.success("Note added");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add note");
    }
  };

  const handleToggleOvercome = async (appId: number, noteId: number, current: boolean) => {
    const api = createApi(() => getToken());
    try {
      await unwrap(
        await api.updateNoteOvercome(noteId, !current)
      );
      setNotes((p) => ({
        ...p,
        [appId]: (p[appId] ?? []).map((n) =>
          n.id === noteId ? { ...n, overcome: !current } : n
        ),
      }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
    }
  };

  const filtered = statusFilter === "ALL"
    ? applications
    : applications.filter((a) => a.status === statusFilter);

  const counts: Record<string, number> = { ALL: applications.length };
  STATUS_OPTIONS.forEach((s) => {
    counts[s] = applications.filter((a) => a.status === s).length;
  });

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .status-tab { background: none; border: none; cursor: pointer; padding: 8px 14px; border-radius: 8px; font-family: var(--font-body); font-weight: 700; font-size: 12px; letter-spacing: 0.04em; transition: all 0.2s; white-space: nowrap; }
        .note-input { width: 100%; background: var(--color-surface-3); border: 1px solid var(--color-border); border-radius: 8px; padding: 9px 12px; font-size: 13px; color: var(--color-white); font-family: var(--font-body); outline: none; resize: none; transition: border-color 0.2s; box-sizing: border-box; }
        .note-input:focus { border-color: var(--color-orange); }
      `}</style>

      <AppHeader
        left={
          <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--color-white-65)" }}>
            Applications
          </span>
        }
      />

      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "32px", boxSizing: "border-box" }}>

          <h1 style={{ fontFamily: "var(--font-body)", fontWeight: 800, fontSize: "clamp(22px, 3vw, 28px)", letterSpacing: "-0.025em", color: "var(--color-white)", margin: "0 0 6px" }}>
            Applications
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--color-white-40)", margin: "0 0 24px" }}>
            {applications.length} total applications tracked
          </p>

          {/* Status tabs */}
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "24px", overflowX: "auto", padding: "2px" }}>
            {["ALL", ...STATUS_OPTIONS].map((s) => {
              const active = statusFilter === s;
              const count = counts[s] ?? 0;
              const style = s !== "ALL" ? getStatusStyle(s) : null;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className="status-tab"
                  style={{
                    color: active ? (style ? style.color : "var(--color-white)") : "var(--color-white-40)",
                    background: active ? (style ? style.bg : "var(--color-surface-3)") : "transparent",
                    border: active ? `1px solid ${style ? style.border : "var(--color-border)"}` : "1px solid transparent",
                  }}
                >
                  {s.replace(/_/g, " ")} {count > 0 && <span style={{ opacity: 0.7 }}>({count})</span>}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "64px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", border: "3px solid var(--color-border)", borderTopColor: "var(--color-orange)", animation: "spin 0.7s linear infinite", margin: "0 auto" }} />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px", background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: "16px" }}>
              <p style={{ fontSize: "40px", marginBottom: "12px" }}>📋</p>
              <p style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "16px", color: "var(--color-white)", margin: "0 0 8px" }}>
                No applications {statusFilter !== "ALL" ? `with status "${statusFilter.replace(/_/g, " ")}"` : "yet"}
              </p>
              <Link href="/jobs" style={{ color: "var(--color-orange)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "13px" }}>
                Browse jobs →
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {filtered.map((app) => {
                const expanded = expandedId === app.id;
                const appNotes = notes[app.id] ?? [];
                return (
                  <div
                    key={app.id}
                    style={{
                      background: "var(--color-surface-2)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "14px",
                      overflow: "hidden",
                      transition: "border-color 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-orange-border)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
                  >
                    {/* Main row */}
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "18px 20px", flexWrap: "wrap" }}>
                      {/* Company initial */}
                      <div style={{
                        width: "40px", height: "40px", borderRadius: "10px",
                        background: "var(--color-surface-3)", border: "1px solid var(--color-border)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "16px", color: "var(--color-orange)",
                        flexShrink: 0,
                      }}>
                        {(app.job?.companyName ?? app.job?.company ?? "?").charAt(0).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Link
                          href={`/jobs/${app.job?.id}`}
                          style={{
                            fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "15px",
                            color: "var(--color-white)", textDecoration: "none", display: "block",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            transition: "color 0.2s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-orange)")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-white)")}
                        >
                          {app.job?.title ?? "Unknown Job"}
                        </Link>
                        <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--color-white-40)", margin: "2px 0 0" }}>
                          {app.job?.companyName ?? app.job?.company ?? "—"} {app.job?.location ? `· ${app.job.location}` : ""}
                        </p>
                      </div>

                      {/* Status */}
                      <StatusBadge status={app.status} size="sm" />

                      {/* Status change */}
                      <div style={{ position: "relative" }}>
                        <select
                          value={app.status}
                          onChange={(e) => handleStatusChange(app.id, e.target.value)}
                          style={{
                            appearance: "none",
                            background: "var(--color-surface-3)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "8px",
                            padding: "7px 28px 7px 10px",
                            color: "var(--color-white-65)",
                            fontFamily: "var(--font-body)",
                            fontWeight: 600,
                            fontSize: "11px",
                            cursor: "pointer",
                            outline: "none",
                          }}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                          ))}
                        </select>
                        <FaChevronDown style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "9px", color: "var(--color-white-40)", pointerEvents: "none" }} />
                      </div>

                      {/* Date */}
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--color-white-40)", whiteSpace: "nowrap" }}>
                        {formatDate(app.createdAt)}
                      </span>

                      {/* Notes toggle */}
                      <button
                        onClick={() => handleToggleExpand(app.id)}
                        style={{
                          background: expanded ? "var(--color-orange-dim)" : "var(--color-surface-3)",
                          border: expanded ? "1px solid var(--color-orange-border)" : "1px solid var(--color-border)",
                          borderRadius: "8px",
                          padding: "7px 10px",
                          cursor: "pointer",
                          color: expanded ? "var(--color-orange)" : "var(--color-white-40)",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          fontFamily: "var(--font-body)",
                          fontWeight: 700,
                          fontSize: "11px",
                          transition: "all 0.2s",
                          flexShrink: 0,
                        }}
                      >
                        <FaStickyNote style={{ fontSize: "11px" }} />
                        Notes {appNotes.length > 0 && `(${appNotes.length})`}
                      </button>
                    </div>

                    {/* Notes panel */}
                    {expanded && (
                      <div style={{ borderTop: "1px solid var(--color-border)", padding: "20px", background: "rgba(255,255,255,0.01)" }}>
                        {noteLoading[app.id] ? (
                          <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--color-white-40)", textAlign: "center" }}>
                            Loading notes…
                          </p>
                        ) : (
                          <>
                            {appNotes.length === 0 && (
                              <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--color-white-40)", marginBottom: "12px" }}>
                                No notes yet. Capture what went wrong — track and overcome your weaknesses.
                              </p>
                            )}
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                              {appNotes.map((n) => (
                                <div
                                  key={n.id}
                                  style={{
                                    padding: "12px 14px",
                                    background: "var(--color-surface-3)",
                                    border: n.overcome ? "1px solid rgba(74,222,128,0.25)" : "1px solid var(--color-border)",
                                    borderRadius: "10px",
                                    opacity: n.overcome ? 0.7 : 1,
                                  }}
                                >
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "6px" }}>
                                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                      {n.round && (
                                        <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "10px", letterSpacing: "0.04em", padding: "2px 8px", borderRadius: "4px", background: "var(--color-orange-dim)", color: "var(--color-orange)", border: "1px solid var(--color-orange-border)" }}>
                                          {n.round}
                                        </span>
                                      )}
                                      {n.category && (
                                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", padding: "2px 8px", borderRadius: "4px", background: "var(--color-surface-2)", color: "var(--color-white-65)", border: "1px solid var(--color-border)" }}>
                                          {n.category}
                                        </span>
                                      )}
                                      {n.overcome && (
                                        <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "10px", letterSpacing: "0.04em", padding: "2px 8px", borderRadius: "4px", background: "rgba(74,222,128,0.12)", color: "rgb(74,222,128)", border: "1px solid rgba(74,222,128,0.3)" }}>
                                          OVERCOME
                                        </span>
                                      )}
                                    </div>
                                    <button
                                      onClick={() => handleToggleOvercome(app.id, n.id, n.overcome)}
                                      title={n.overcome ? "Mark as still a weakness" : "Mark as overcome"}
                                      style={{
                                        background: "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                        color: n.overcome ? "rgb(74,222,128)" : "var(--color-white-40)",
                                        fontSize: "14px",
                                        padding: "2px 4px",
                                        flexShrink: 0,
                                      }}
                                    >
                                      {n.overcome ? <FaCheckCircle /> : <FaCircle />}
                                    </button>
                                  </div>
                                  <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--color-white-65)", margin: "0 0 6px", lineHeight: 1.5, textDecoration: n.overcome ? "line-through" : "none" }}>
                                    {n.notes ?? n.feedback ?? ""}
                                  </p>
                                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--color-white-40)" }}>
                                    {formatDate(n.createdAt)}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                              <div style={{ display: "flex", gap: "8px" }}>
                                <input
                                  className="note-input"
                                  type="text"
                                  placeholder="Round (e.g. Phone Screen, Onsite R1)"
                                  value={newNoteRound[app.id] ?? ""}
                                  onChange={(e) => setNewNoteRound((p) => ({ ...p, [app.id]: e.target.value }))}
                                  style={{ flex: 1 }}
                                />
                                <select
                                  className="note-input"
                                  value={newNoteCategory[app.id] ?? ""}
                                  onChange={(e) => setNewNoteCategory((p) => ({ ...p, [app.id]: e.target.value }))}
                                  style={{ flex: 1, cursor: "pointer" }}
                                >
                                  <option value="">Category (optional)</option>
                                  {CATEGORY_OPTIONS.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                  ))}
                                </select>
                              </div>
                              <div style={{ display: "flex", gap: "8px" }}>
                                <textarea
                                  className="note-input"
                                  rows={2}
                                  placeholder="What went wrong? What was the weakness?"
                                  value={newNote[app.id] ?? ""}
                                  onChange={(e) => setNewNote((p) => ({ ...p, [app.id]: e.target.value }))}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddNote(app.id); }
                                  }}
                                />
                                <button
                                  onClick={() => handleAddNote(app.id)}
                                  style={{
                                    flexShrink: 0,
                                    padding: "0 16px",
                                    background: "var(--color-orange-dim)",
                                    border: "1px solid var(--color-orange-border)",
                                    borderRadius: "8px",
                                    color: "var(--color-orange)",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    fontFamily: "var(--font-body)",
                                    fontWeight: 700,
                                    fontSize: "12px",
                                  }}
                                >
                                  <FaPlus style={{ fontSize: "10px" }} /> Add
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
