"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { toast } from "react-hot-toast";
import AppHeader from "@/components/AppHeader";
import JobCard, { type Job } from "@/components/JobCard";
import { createApi, extractItems, unwrap } from "@/lib/api";
import { FaSearch, FaFilter, FaTimes } from "react-icons/fa";

const EXPERIENCE_OPTIONS = ["", "ENTRY", "JUNIOR", "MID", "SENIOR", "LEAD", "EXECUTIVE"];
const SORT_OPTIONS = [
  { value: "latest",    label: "Latest" },
  { value: "relevance", label: "Relevance" },
  { value: "salary",    label: "Salary" },
];

interface JobsResult {
  items?: Job[];
  jobs?: Job[];
  total?: number;
  page?: number;
  limit?: number;
}

export default function JobsPage() {
  const { getToken, isLoaded } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  // Filters
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [location, setLocation] = useState(searchParams.get("location") ?? "");
  const [experience, setExperience] = useState(searchParams.get("experience") ?? "");
  const [remote, setRemote] = useState(searchParams.get("remote") === "true");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "latest");
  const [showFilters, setShowFilters] = useState(false);

  const loaderRef = useRef<HTMLDivElement>(null);

  const fetchJobs = useCallback(async (pg: number, replace: boolean) => {
    if (!isLoaded) return;
    const api = createApi(() => getToken());
    replace ? setLoading(true) : setLoadingMore(true);
    try {
      const normalizedQuery = query.trim();
      const params: Record<string, string | number | boolean | undefined> = {
        page: pg, limit: 20, sort,
        ...(normalizedQuery ? { q: normalizedQuery } : {}),
        ...(location ? { location } : {}),
        ...(experience ? { experience } : {}),
        ...(remote ? { remote: true } : {}),
      };
      const raw = await api.searchJobs(params);
      const data = await unwrap<JobsResult>(raw);
      const list = extractItems(data);
      if (replace) {
        setJobs(list);
      } else {
        setJobs((prev) => [...prev, ...list]);
      }
      setHasMore(list.length >= 20);
      setPage(pg);
    } catch (e) {
      toast.error("Failed to load jobs");
      console.error(e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [isLoaded, sort, query, location, experience, remote]);

  // Initial load
  useEffect(() => {
    fetchJobs(1, true);
  }, [fetchJobs]);

  // Infinite scroll
  useEffect(() => {
    if (!loaderRef.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          fetchJobs(page + 1, false);
        }
      },
      { rootMargin: "200px" }
    );
    obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [hasMore, loading, loadingMore, page, fetchJobs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs(1, true);
  };

  const clearFilters = () => {
    setQuery(""); setLocation(""); setExperience(""); setRemote(false); setSort("latest");
  };
  const hasActiveFilters = query || location || experience || remote || sort !== "latest";

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .jobs-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        @media (max-width: 1200px) { .jobs-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 768px) { .jobs-grid { grid-template-columns: 1fr; } }
        .filter-chip {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 12px; border-radius: 999px;
          background: var(--color-orange-dim);
          border: 1px solid var(--color-orange-border);
          color: var(--color-orange);
          font-family: var(--font-display); font-weight: 700; font-size: 11px;
          cursor: pointer; transition: all 0.2s;
        }
      `}</style>

      <AppHeader
        left={
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--color-white-65)" }}>
              Browse Jobs
            </span>
          </div>
        }
      />

      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px", boxSizing: "border-box" }}>

          {/* Header */}
          <div style={{ marginBottom: "24px" }}>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: "clamp(22px, 3vw, 28px)",
                letterSpacing: "-0.025em",
                color: "var(--color-white)",
                margin: "0 0 6px",
              }}
            >
              Browse Jobs
            </h1>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--color-white-40)", margin: 0 }}>
              Fresh opportunities scraped directly from company career pages.
            </p>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch}>
            <div
              style={{
                display: "flex",
                gap: "10px",
                marginBottom: "16px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ position: "relative", flex: "1 1 280px" }}>
                <FaSearch
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--color-white-40)",
                    fontSize: "13px",
                    pointerEvents: "none",
                  }}
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search jobs, skills, companies…"
                  style={{
                    width: "100%",
                    background: "var(--color-surface-2)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "10px",
                    padding: "11px 14px 11px 40px",
                    fontSize: "14px",
                    color: "var(--color-white)",
                    outline: "none",
                    transition: "border-color 0.2s",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--color-orange)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
                />
              </div>

              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location…"
                style={{
                  flex: "0 0 160px",
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "10px",
                  padding: "11px 14px",
                  fontSize: "14px",
                  color: "var(--color-white)",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--color-orange)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
              />

              <button type="submit" className="btn-primary" style={{ flexShrink: 0 }}>
                Search
              </button>

              <button
                type="button"
                onClick={() => setShowFilters((f) => !f)}
                className="btn-ghost"
                style={{ flexShrink: 0, gap: "6px" }}
              >
                <FaFilter style={{ fontSize: "11px" }} />
                Filters
              </button>
            </div>

            {/* Expanded filters */}
            {showFilters && (
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                  padding: "16px",
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "12px",
                  marginBottom: "16px",
                  alignItems: "center",
                }}
              >
                {/* Experience */}
                <select
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  style={{
                    background: "var(--color-surface-3)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    padding: "9px 14px",
                    fontSize: "13px",
                    color: "var(--color-white-65)",
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="">Any experience</option>
                  {EXPERIENCE_OPTIONS.filter(Boolean).map((o) => (
                    <option key={o} value={o}>{o.charAt(0) + o.slice(1).toLowerCase()}</option>
                  ))}
                </select>

                {/* Sort */}
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  style={{
                    background: "var(--color-surface-3)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    padding: "9px 14px",
                    fontSize: "13px",
                    color: "var(--color-white-65)",
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>

                {/* Remote */}
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: "13px",
                    color: "var(--color-white-65)",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={remote}
                    onChange={(e) => setRemote(e.target.checked)}
                    style={{ accentColor: "var(--color-orange)" }}
                  />
                  Remote only
                </label>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#f87171",
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      fontSize: "12px",
                    }}
                  >
                    <FaTimes style={{ fontSize: "10px" }} />
                    Clear
                  </button>
                )}
              </div>
            )}
          </form>

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
              {query && (
                <span className="filter-chip" onClick={() => setQuery("")}>
                  &ldquo;{query}&rdquo; <FaTimes style={{ fontSize: "9px" }} />
                </span>
              )}
              {location && (
                <span className="filter-chip" onClick={() => setLocation("")}>
                  📍 {location} <FaTimes style={{ fontSize: "9px" }} />
                </span>
              )}
              {experience && (
                <span className="filter-chip" onClick={() => setExperience("")}>
                  {experience} <FaTimes style={{ fontSize: "9px" }} />
                </span>
              )}
              {remote && (
                <span className="filter-chip" onClick={() => setRemote(false)}>
                  Remote <FaTimes style={{ fontSize: "9px" }} />
                </span>
              )}
            </div>
          )}

          {/* Loading state */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  border: "3px solid var(--color-border)",
                  borderTopColor: "var(--color-orange)",
                  animation: "spin 0.7s linear infinite",
                  margin: "0 auto 16px",
                }}
              />
              <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--color-white-40)" }}>
                Loading jobs…
              </p>
            </div>
          ) : jobs.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "80px 0",
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                borderRadius: "16px",
              }}
            >
              <p style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</p>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "18px", color: "var(--color-white)", margin: "0 0 8px" }}>
                No jobs found
              </h3>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--color-white-40)" }}>
                Try adjusting your filters or search terms.
              </p>
            </div>
          ) : (
            <>
              <div className="jobs-grid">
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>

              {/* Infinite scroll loader */}
              <div ref={loaderRef} style={{ textAlign: "center", padding: "32px 0" }}>
                {loadingMore && (
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      border: "2px solid var(--color-border)",
                      borderTopColor: "var(--color-orange)",
                      animation: "spin 0.7s linear infinite",
                      margin: "0 auto",
                    }}
                  />
                )}
                {!hasMore && jobs.length > 0 && (
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--color-white-40)", letterSpacing: "0.1em" }}>
                    — All caught up —
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
