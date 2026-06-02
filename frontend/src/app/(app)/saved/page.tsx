"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { toast } from "react-hot-toast";
import AppHeader from "@/components/AppHeader";
import { createApi, extractItems, unwrap } from "@/lib/api";
import { FaBookmark, FaMapMarkerAlt, FaExternalLinkAlt } from "react-icons/fa";

interface SavedApplication {
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
    employmentType?: string;
  };
}

function formatPostedDate(d?: string): string {
  if (!d) return "Recently";
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000);
  if (diff < 1) return "Today";
  if (diff === 1) return "1 day ago";
  if (diff < 7) return `${diff} days ago`;
  if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
  return `${Math.floor(diff / 30)}mo ago`;
}

export default function SavedPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [saved, setSaved] = useState<SavedApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    const api = createApi(() => getToken());
    (async () => {
      try {
        const data = await unwrap<{ items?: SavedApplication[]; applications?: SavedApplication[] }>(
          await api.listApplications({ limit: 100 })
        );
        const all = extractItems(data);
        // Filter for saved status only
        setSaved(all.filter((a) => a.status === "SAVED" || a.status === "saved"));
      } catch {
        toast.error("Failed to load saved jobs");
      } finally {
        setLoading(false);
      }
    })();
  }, [isLoaded, isSignedIn, getToken]);

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .saved-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        @media (max-width: 1100px) { .saved-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px)  { .saved-grid { grid-template-columns: 1fr; } }
      `}</style>

      <AppHeader
        left={<span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--color-white-65)" }}>Saved Jobs</span>}
      />

      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px", boxSizing: "border-box" }}>

          <div style={{ marginBottom: "24px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h1 style={{ fontFamily: "var(--font-body)", fontWeight: 800, fontSize: "clamp(22px, 3vw, 28px)", letterSpacing: "-0.025em", color: "var(--color-white)", margin: "0 0 6px" }}>
                Saved Jobs
              </h1>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--color-white-40)", margin: 0 }}>
                {saved.length} job{saved.length !== 1 ? "s" : ""} saved for later
              </p>
            </div>
            <Link href="/jobs" className="btn-ghost" style={{ fontSize: "13px" }}>
              Browse More Jobs →
            </Link>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "64px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", border: "3px solid var(--color-border)", borderTopColor: "var(--color-orange)", animation: "spin 0.7s linear infinite", margin: "0 auto" }} />
            </div>
          ) : saved.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 24px", background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: "16px" }}>
              <FaBookmark style={{ fontSize: "48px", color: "var(--color-white-20)", marginBottom: "16px" }} />
              <h2 style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "20px", color: "var(--color-white)", margin: "0 0 8px" }}>
                No saved jobs yet
              </h2>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--color-white-40)", marginBottom: "20px" }}>
                Browse jobs and save the ones you&apos;re interested in for later.
              </p>
              <Link href="/jobs" className="btn-primary">Browse Jobs</Link>
            </div>
          ) : (
            <div className="saved-grid">
              {saved.map((app) => {
                const j = app.job;
                const company = j?.companyName ?? j?.company ?? "Company";
                return (
                  <div
                    key={app.id}
                    style={{
                      background: "var(--color-surface-2)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "14px",
                      padding: "22px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      transition: "border-color 0.25s, box-shadow 0.25s, transform 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--color-orange-border)";
                      e.currentTarget.style.boxShadow = "0 0 28px rgba(249,115,22,0.08)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--color-border)";
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.transform = "none";
                    }}
                  >
                    {/* Company initial + bookmark icon */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{
                        width: "38px", height: "38px", borderRadius: "10px",
                        background: "var(--color-surface-3)", border: "1px solid var(--color-border)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "16px", color: "var(--color-orange)",
                      }}>
                        {company.charAt(0).toUpperCase()}
                      </div>
                      <FaBookmark style={{ fontSize: "15px", color: "#c084fc" }} />
                    </div>

                    {/* Title + company */}
                    <div>
                      <Link
                        href={`/jobs/${j?.id}`}
                        style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "15px", color: "var(--color-white)", textDecoration: "none", display: "block", lineHeight: 1.35, transition: "color 0.2s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-orange)")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-white)")}
                      >
                        {j?.title ?? "Unknown Job"}
                      </Link>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--color-orange)", fontWeight: 500, margin: "3px 0 0" }}>
                        {company}
                      </p>
                    </div>

                    {/* Location */}
                    {j?.location && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <FaMapMarkerAlt style={{ fontSize: "11px", color: "var(--color-white-40)" }} />
                        <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--color-white-65)" }}>{j.location}</span>
                      </div>
                    )}

                    {/* Posted date */}
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--color-white-40)", letterSpacing: "0.04em" }}>
                      Saved {formatPostedDate(app.createdAt)}
                    </span>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: "8px", marginTop: "auto" }}>
                      <Link
                        href={`/jobs/${j?.id}`}
                        style={{ flex: 1, textAlign: "center", padding: "9px", borderRadius: "8px", background: "transparent", border: "1px solid var(--color-border)", color: "var(--color-white-65)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "12px", textDecoration: "none", transition: "all 0.2s" }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-white-40)"; e.currentTarget.style.color = "var(--color-white)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-white-65)"; }}
                      >
                        View Details
                      </Link>
                      {j?.applyUrl && (
                        <a
                          href={j.applyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ flex: 1, textAlign: "center", padding: "9px", borderRadius: "8px", background: "var(--color-orange)", color: "#000", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "12px", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", transition: "background 0.2s" }}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "var(--color-orange-hover)")}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "var(--color-orange)")}
                        >
                          Apply <FaExternalLinkAlt style={{ fontSize: "10px" }} />
                        </a>
                      )}
                    </div>
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
