"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { toast } from "react-hot-toast";
import AppHeader from "@/components/AppHeader";
import { createApi, unwrap } from "@/lib/api";
import {
  FaMapMarkerAlt, FaBriefcase, FaArrowLeft, FaExternalLinkAlt,
  FaCalendarAlt, FaLayerGroup, FaLink, FaChevronDown, FaBookmark,
} from "react-icons/fa";

interface JobDetail {
  id: number;
  title: string;
  company?: string;
  companyName?: string;
  location?: string;
  department?: string;
  isRemote?: boolean;
  employmentType?: string;
  experienceLevel?: string;
  salaryMin?: number;
  salaryMax?: number;
  description?: string;
  postedAt?: string;
  fetchedAt?: string;
  applyUrl?: string;
  source?: string;
  applicationId?: number;
  applicationStatus?: string;
}

const STATUS_OPTIONS = [
  { value: "NOT_APPLIED", label: "Not Applied" },
  { value: "SAVED",       label: "Saved" },
  { value: "APPLIED",     label: "Applied" },
  { value: "INTERVIEW",   label: "Interview" },
  { value: "OFFER",       label: "Offer" },
  { value: "REJECTED",    label: "Rejected" },
];

function formatDate(d?: string) {
  if (!d) return "Recently";
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function OverviewRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "12px 0", borderBottom: "1px solid var(--color-border)" }}>
      <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--color-surface-3)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-orange)", flexShrink: 0, fontSize: "13px" }}>
        {icon}
      </div>
      <div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-white-40)", marginBottom: "2px" }}>
          {label}
        </div>
        <div style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--color-white-65)" }}>
          {value}
        </div>
      </div>
    </div>
  );
}

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const { getToken, isLoaded } = useAuth();

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("NOT_APPLIED");
  const [appId, setAppId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!isLoaded || !params?.id) return;
    const api = createApi(() => getToken());
    (async () => {
      try {
        const data = await unwrap<JobDetail>(await api.getJob(params.id));
        setJob(data);
        if (data.applicationStatus) setStatus(data.applicationStatus);
        if (data.applicationId) setAppId(data.applicationId);
      } catch {
        toast.error("Could not load job");
      } finally {
        setLoading(false);
      }
    })();
  }, [isLoaded, params?.id]);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    if (actionLoading || !job) return;
    setActionLoading(true);
    const api = createApi(() => getToken());
    try {
      if (newStatus === "NOT_APPLIED") {
        if (appId) await unwrap(await api.updateApplicationStatus(appId, "WITHDRAWN"));
        setStatus("NOT_APPLIED");
        setAppId(null);
        toast.success("Removed from tracker");
      } else {
        if (!appId) {
          const app = await unwrap<{ id: number }>(await api.createApplication(job.id));
          setAppId(app.id);
          await unwrap(await api.updateApplicationStatus(app.id, newStatus));
        } else {
          await unwrap(await api.updateApplicationStatus(appId, newStatus));
        }
        setStatus(newStatus);
        toast.success(`Status updated`);
      }
    } catch {
      toast.error("Failed to update");
    } finally {
      setActionLoading(false);
    }
  };

  const companyLabel = job?.companyName ?? job?.company ?? "Company";

  if (loading) {
    return (
      <>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <AppHeader />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "3px solid var(--color-border)", borderTopColor: "var(--color-orange)", animation: "spin 0.7s linear infinite" }} />
        </div>
      </>
    );
  }

  if (!job) {
    return (
      <>
        <AppHeader />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 24px" }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "48px" }}>😕</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "24px", color: "var(--color-white)", margin: "0 0 12px" }}>Job not found</h2>
            <Link className="btn-ghost" href="/jobs">← Back to Jobs</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <AppHeader
        left={
          <Link href="/jobs" style={{ display: "flex", alignItems: "center", gap: "8px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "13px", color: "var(--color-white-65)", textDecoration: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-white)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-white-65)")}
          >
            <FaArrowLeft style={{ fontSize: "11px" }} /> Back to Jobs
          </Link>
        }
      />

      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "32px", boxSizing: "border-box" }}>

          {/* ── Header card ── */}
          <div style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: "16px", padding: "24px 28px", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
              {/* Logo + title */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "var(--color-surface-3)", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "22px", color: "var(--color-orange)", flexShrink: 0 }}>
                  {companyLabel.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(18px, 2.5vw, 24px)", letterSpacing: "-0.025em", color: "var(--color-white)", margin: "0 0 4px" }}>
                    {job.title}
                  </h1>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--color-orange)", fontWeight: 500, margin: 0 }}>
                    {companyLabel}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                <button style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--color-surface-3)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "10px 16px", color: "var(--color-white-65)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>
                  <FaBookmark style={{ fontSize: "11px" }} /> Save Job
                </button>

                {/* Status dropdown */}
                <div style={{ position: "relative" }}>
                  <select
                    value={status}
                    disabled={actionLoading}
                    onChange={handleStatusChange}
                    style={{ appearance: "none", background: "var(--color-surface-3)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "10px 36px 10px 16px", color: "var(--color-white-65)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "13px", cursor: "pointer", outline: "none", opacity: actionLoading ? 0.5 : 1 }}
                  >
                    {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <FaChevronDown style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: "10px", color: "var(--color-white-40)" }} />
                </div>

                {job.applyUrl && (
                  <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ gap: "8px", textDecoration: "none" }}>
                    Apply on Site <FaExternalLinkAlt style={{ fontSize: "11px" }} />
                  </a>
                )}
              </div>
            </div>

            {/* Meta tags */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "16px" }}>
              {job.location && (
                <span style={{ display: "flex", alignItems: "center", gap: "5px", fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--color-white-65)", background: "var(--color-surface-3)", border: "1px solid var(--color-border)", padding: "4px 10px", borderRadius: "999px" }}>
                  <FaMapMarkerAlt style={{ fontSize: "10px", color: "var(--color-white-40)" }} /> {job.location}
                </span>
              )}
              {job.employmentType && (
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "11px", background: "var(--color-surface-3)", border: "1px solid var(--color-border)", padding: "4px 10px", borderRadius: "999px", color: "var(--color-white-65)", letterSpacing: "0.04em" }}>
                  {job.employmentType.replace(/_/g, " ")}
                </span>
              )}
              {job.source && (
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "11px", background: "var(--color-surface-3)", border: "1px solid var(--color-border)", padding: "4px 10px", borderRadius: "999px", color: "var(--color-white-65)", letterSpacing: "0.04em" }}>
                  {job.source}
                </span>
              )}
              {job.postedAt && (
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--color-white-40)", background: "var(--color-surface-3)", border: "1px solid var(--color-border)", padding: "4px 10px", borderRadius: "999px", letterSpacing: "0.04em" }}>
                  {formatDate(job.postedAt).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* ── Two-column body ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "20px", alignItems: "start" }}>

            {/* Left — description */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: "16px", padding: "28px" }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "17px", color: "var(--color-white)", margin: "0 0 16px", letterSpacing: "-0.02em" }}>
                  Job Description
                </h2>
                {job.description ? (
                  <div style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--color-white-65)", lineHeight: "1.8", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {job.description}
                  </div>
                ) : (
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--color-white-40)", fontStyle: "italic" }}>
                    No description available for this job.
                  </p>
                )}
              </div>
            </div>

            {/* Right — overview sidebar */}
            <div style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: "16px", padding: "24px" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "17px", color: "var(--color-white)", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
                Job Overview
              </h2>
              <div style={{ borderTop: "1px solid var(--color-border)", marginTop: "8px" }}>
                <OverviewRow icon={<FaCalendarAlt />} label="Posted" value={formatDate(job.postedAt)} />
                <OverviewRow icon={<FaBriefcase />} label="Job Type" value={job.employmentType?.replace(/_/g, " ")} />
                <OverviewRow icon={<FaMapMarkerAlt />} label="Location" value={job.location ?? (job.isRemote ? "Remote" : undefined)} />
                <OverviewRow icon={<FaLayerGroup />} label="Department" value={job.department} />
                <OverviewRow icon={<FaLayerGroup />} label="Experience" value={job.experienceLevel} />
                <OverviewRow icon={<FaLink />} label="Source" value={job.source} />
              </div>

              {job.applyUrl && (
                <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="btn-primary"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", textDecoration: "none", marginTop: "20px", width: "100%", boxSizing: "border-box" }}
                >
                  Apply Now <FaExternalLinkAlt style={{ fontSize: "11px" }} />
                </a>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
