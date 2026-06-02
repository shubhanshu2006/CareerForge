"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { toast } from "react-hot-toast";
import AppHeader from "@/components/AppHeader";
import JobCard, { type Job } from "@/components/JobCard";
import { createApi, extractItems, unwrap } from "@/lib/api";
import { FaHeart, FaSlidersH } from "react-icons/fa";

interface Prefs {
  titles?: string[];
  skills?: string[];
  companies?: string[];
  emailEnabled?: boolean;
}

interface JobsResult {
  items?: Job[];
  total?: number;
  page?: number;
  limit?: number;
}

export default function ForYouPage() {
  const { getToken, isLoaded } = useAuth();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [noPrefs, setNoPrefs] = useState(false);
  const [prefs, setPrefs] = useState<Prefs | null>(null);

  // Fire one search per term in parallel, dedupe and merge results
  const fetchForYou = useCallback(async (userPrefs: Prefs) => {
    const api = createApi(() => getToken());
    setLoading(true);

    const terms = [...(userPrefs.titles ?? []), ...(userPrefs.skills ?? [])];
    if (terms.length === 0) {
      setNoPrefs(true);
      setLoading(false);
      return;
    }

    try {
      const responses = await Promise.allSettled(
        terms.map((term) =>
          api.searchJobs({ q: term, limit: 100, sort: "latest" })
            .then((r) => unwrap<JobsResult>(r))
            .then((data) => extractItems(data))
        )
      );

      const seen = new Set<number>();
      const merged: Job[] = [];
      for (const res of responses) {
        if (res.status === "fulfilled") {
          for (const job of res.value) {
            if (!seen.has(job.id)) {
              seen.add(job.id);
              merged.push(job);
            }
          }
        }
      }

      // Sort newest first
      merged.sort((a, b) => {
        const da = a.postedAt ? new Date(a.postedAt).getTime() : 0;
        const db = b.postedAt ? new Date(b.postedAt).getTime() : 0;
        return db - da;
      });

      setJobs(merged);
    } catch {
      toast.error("Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    const api = createApi(() => getToken());
    (async () => {
      try {
        const data = await unwrap<Prefs>(await api.getPreferences());
        setPrefs(data);
        const hasPrefs = (data.titles?.length ?? 0) + (data.skills?.length ?? 0) > 0;
        if (!hasPrefs) { setNoPrefs(true); setLoading(false); return; }
        fetchForYou(data);
      } catch {
        setNoPrefs(true);
        setLoading(false);
      }
    })();
  }, [isLoaded]);

  const activeTitles = prefs?.titles ?? [];
  const activeSkills = prefs?.skills ?? [];

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .foryou-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        @media (max-width: 1200px) { .foryou-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 768px) { .foryou-grid { grid-template-columns: 1fr; } }
      `}</style>

      <AppHeader
        left={
          <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--color-white-65)" }}>
            For You
          </span>
        }
      />

      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px", boxSizing: "border-box" }}>

          {/* Header */}
          <div style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h1 style={{ fontFamily: "var(--font-body)", fontWeight: 800, fontSize: "clamp(22px, 3vw, 28px)", letterSpacing: "-0.025em", color: "var(--color-white)", margin: "0 0 6px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <FaHeart style={{ color: "var(--color-orange)", fontSize: "22px" }} /> For You
                </h1>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--color-white-40)", margin: 0 }}>
                  {!loading && jobs.length > 0
                    ? `${jobs.length} jobs matched to your preferences`
                    : "Jobs matched to your preferences"}
                </p>
              </div>
              <Link href="/preferences" className="btn-ghost" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
                <FaSlidersH style={{ fontSize: "12px" }} /> Edit Preferences
              </Link>
            </div>

            {(activeTitles.length > 0 || activeSkills.length > 0) && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "16px" }}>
                {activeTitles.map((t) => (
                  <span key={t} style={{ padding: "4px 12px", borderRadius: "999px", background: "var(--color-orange-dim)", border: "1px solid var(--color-orange-border)", color: "var(--color-orange)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "11px" }}>
                    🎯 {t}
                  </span>
                ))}
                {activeSkills.map((s) => (
                  <span key={s} style={{ padding: "4px 12px", borderRadius: "999px", background: "var(--color-surface-2)", border: "1px solid var(--color-border)", color: "var(--color-white-65)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "11px" }}>
                    🔧 {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* No preferences */}
          {noPrefs && (
            <div style={{ textAlign: "center", padding: "80px 0", background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: "16px" }}>
              <p style={{ fontSize: "48px", marginBottom: "16px" }}>🎯</p>
              <h3 style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "18px", color: "var(--color-white)", margin: "0 0 8px" }}>No preferences set</h3>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--color-white-40)", marginBottom: "24px" }}>
                Add your preferred job titles and skills to get personalised recommendations.
              </p>
              <Link href="/preferences" className="btn-primary" style={{ textDecoration: "none" }}>Set Up Preferences</Link>
            </div>
          )}

          {/* Loading */}
          {loading && !noPrefs && (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "3px solid var(--color-border)", borderTopColor: "var(--color-orange)", animation: "spin 0.7s linear infinite", margin: "0 auto 16px" }} />
              <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--color-white-40)" }}>Finding jobs for you…</p>
            </div>
          )}

          {/* Empty */}
          {!loading && !noPrefs && jobs.length === 0 && (
            <div style={{ textAlign: "center", padding: "80px 0", background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: "16px" }}>
              <p style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</p>
              <h3 style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "18px", color: "var(--color-white)", margin: "0 0 8px" }}>No matches yet</h3>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--color-white-40)" }}>
                New jobs matching your preferences will appear here as they're ingested.
              </p>
            </div>
          )}

          {/* Jobs */}
          {!loading && jobs.length > 0 && (
            <div className="foryou-grid">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  );
}
