"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "react-hot-toast";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import { createApi, extractItems, unwrap } from "@/lib/api";
import { FaRobot, FaPaperPlane, FaSearch, FaMapMarkerAlt, FaBriefcase } from "react-icons/fa";

interface SearchResult {
  id: number;
  title?: string;
  company?: string;
  companyName?: string;
  location?: string;
  remote?: boolean;
  employmentType?: string;
  postedAt?: string;
  applyUrl?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  jobs?: SearchResult[];
}

function formatPostedDate(d?: string) {
  if (!d) return "Recently";
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000);
  if (diff < 1) return "Today";
  if (diff === 1) return "1d ago";
  if (diff < 7) return `${diff}d ago`;
  return `${Math.floor(diff / 7)}w ago`;
}

const EXAMPLE_QUERIES = [
  "Find me senior React developer roles in London",
  "Remote Python backend engineer positions",
  "Show me fintech product manager jobs",
  "Entry level data scientist roles, no experience required",
];

export default function AiSearchPage() {
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (query?: string) => {
    const text = (query ?? input).trim();
    if (!text || loading) return;

    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setLoading(true);

    const api = createApi(() => getToken());
    try {
      const data = await unwrap<{ items?: SearchResult[]; jobs?: SearchResult[]; message?: string }>(
        await api.chatSearch(text)
      );
      const jobs = extractItems(data);
      const msg = (data as { message?: string }).message;
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: msg ?? (jobs.length > 0
            ? `Found ${jobs.length} matching role${jobs.length !== 1 ? "s" : ""} for "${text}"`
            : `No results found for "${text}". Try adjusting your search.`),
          jobs: jobs.length > 0 ? jobs : undefined,
        },
      ]);
    } catch (e) {
      console.error(e);
      toast.error("Search failed. Please try again.");
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Sorry, I couldn't process that search. Please try again." },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .msg-bubble { animation: fadeUp 0.3s ease-out; }
        .job-result-card { background: var(--color-surface-3); border: 1px solid var(--color-border); border-radius: 12px; padding: 14px 16px; transition: border-color 0.2s; }
        .job-result-card:hover { border-color: var(--color-orange-border); }
      `}</style>

      <AppHeader left={<span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--color-white-65)" }}>AI Job Search</span>} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Chat area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>

            {messages.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 0 32px" }}>
                <div style={{ width: "64px", height: "64px", borderRadius: "18px", background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: "26px", color: "#c084fc" }}>
                  <FaRobot />
                </div>
                <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(20px, 3vw, 28px)", letterSpacing: "-0.025em", color: "var(--color-white)", margin: "0 0 10px" }}>
                  AI Job Search
                </h1>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "15px", color: "var(--color-white-40)", maxWidth: "440px", margin: "0 auto 32px", lineHeight: 1.7 }}>
                  Search jobs using natural language. Ask me anything about roles, locations, companies, or requirements.
                </p>

                {/* Example queries */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
                  {EXAMPLE_QUERIES.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSend(q)}
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "13px",
                        color: "var(--color-white-65)",
                        background: "var(--color-surface-2)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "999px",
                        padding: "8px 16px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-orange-border)"; e.currentTarget.style.color = "var(--color-white)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-white-65)"; }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className="msg-bubble"
                style={{
                  marginBottom: "20px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                {msg.role === "user" ? (
                  <div
                    style={{
                      maxWidth: "75%",
                      background: "var(--color-orange)",
                      color: "#000",
                      borderRadius: "16px 16px 4px 16px",
                      padding: "12px 18px",
                      fontFamily: "var(--font-body)",
                      fontSize: "14px",
                      fontWeight: 600,
                      lineHeight: 1.5,
                    }}
                  >
                    {msg.content}
                  </div>
                ) : (
                  <div style={{ width: "100%" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                      <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: "#c084fc", fontSize: "12px" }}>
                        <FaRobot />
                      </div>
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "12px", color: "var(--color-white-40)" }}>CareerForge AI</span>
                    </div>
                    <div
                      style={{
                        background: "var(--color-surface-2)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "4px 16px 16px 16px",
                        padding: "14px 18px",
                        fontFamily: "var(--font-body)",
                        fontSize: "14px",
                        color: "var(--color-white-65)",
                        lineHeight: 1.6,
                        marginBottom: msg.jobs ? "12px" : 0,
                      }}
                    >
                      {msg.content}
                    </div>

                    {/* Job results */}
                    {msg.jobs && msg.jobs.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {msg.jobs.map((job) => {
                          const company = job.companyName ?? job.company ?? "Company";
                          return (
                            <div key={job.id} className="job-result-card">
                              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <Link
                                    href={`/jobs/${job.id}`}
                                    style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "14px", color: "var(--color-white)", textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", transition: "color 0.2s" }}
                                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-orange)")}
                                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-white)")}
                                  >
                                    {job.title}
                                  </Link>
                                  <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--color-orange)", fontWeight: 500, margin: "2px 0 6px" }}>
                                    {company}
                                  </p>
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                                    {job.location && (
                                      <span style={{ display: "flex", alignItems: "center", gap: "4px", fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--color-white-40)" }}>
                                        <FaMapMarkerAlt style={{ fontSize: "10px" }} />
                                        {job.location}
                                        {job.remote && " (Remote)"}
                                      </span>
                                    )}
                                    {job.employmentType && (
                                      <span style={{ display: "flex", alignItems: "center", gap: "4px", fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--color-white-40)" }}>
                                        <FaBriefcase style={{ fontSize: "10px" }} />
                                        {job.employmentType}
                                      </span>
                                    )}
                                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--color-white-40)" }}>
                                      {formatPostedDate(job.postedAt)}
                                    </span>
                                  </div>
                                </div>
                                <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                                  <Link
                                    href={`/jobs/${job.id}`}
                                    style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "11px", padding: "6px 12px", borderRadius: "8px", background: "transparent", border: "1px solid var(--color-border)", color: "var(--color-white-65)", textDecoration: "none", transition: "all 0.2s" }}
                                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-white-40)"; e.currentTarget.style.color = "var(--color-white)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-white-65)"; }}
                                  >
                                    View
                                  </Link>
                                  {job.applyUrl && (
                                    <a
                                      href={job.applyUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "11px", padding: "6px 12px", borderRadius: "8px", background: "var(--color-orange)", color: "#000", textDecoration: "none", transition: "background 0.2s" }}
                                      onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "var(--color-orange-hover)")}
                                      onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "var(--color-orange)")}
                                    >
                                      Apply
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="msg-bubble" style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: "#c084fc", fontSize: "12px" }}>
                    <FaRobot />
                  </div>
                  <div style={{ display: "flex", gap: "4px" }}>
                    {[0, 1, 2].map((i) => (
                      <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--color-white-40)", animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input bar */}
        <div style={{ borderTop: "1px solid var(--color-border)", padding: "16px 24px", background: "var(--color-surface-1)", flexShrink: 0 }}>
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <FaSearch style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--color-white-40)", fontSize: "13px", pointerEvents: "none" }} />
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder='Ask for jobs in natural language, e.g. "Senior React developer in Berlin"'
                  disabled={loading}
                  style={{
                    width: "100%",
                    background: "var(--color-surface-2)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "12px",
                    padding: "13px 16px 13px 42px",
                    fontSize: "14px",
                    color: "var(--color-white)",
                    outline: "none",
                    transition: "border-color 0.2s",
                    boxSizing: "border-box",
                    opacity: loading ? 0.7 : 1,
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#c084fc")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
                />
              </div>
              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                style={{
                  width: "46px",
                  height: "46px",
                  borderRadius: "12px",
                  background: input.trim() && !loading ? "#c084fc" : "var(--color-surface-3)",
                  border: "1px solid rgba(168,85,247,0.25)",
                  color: input.trim() && !loading ? "#fff" : "var(--color-white-40)",
                  cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "15px",
                  transition: "all 0.2s",
                  flexShrink: 0,
                }}
              >
                <FaPaperPlane />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
