"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { toast } from "react-hot-toast";
import AppHeader from "@/components/AppHeader";
import StatusBadge from "@/components/StatusBadge";
import { createApi, unwrap } from "@/lib/api";
import {
  FaMapMarkerAlt, FaBriefcase, FaArrowLeft, FaExternalLinkAlt,
  FaBookmark, FaRegBookmark, FaCheckCircle, FaChevronDown,
} from "react-icons/fa";

interface JobDetail {
  id: number;
  title: string;
  company?: string;
  companyName?: string;
  location?: string;
  remote?: boolean;
  employmentType?: string;
  experience?: string;
  salaryMin?: number;
  salaryMax?: number;
  description?: string;
  requirements?: string[];
  postedAt?: string;
  applyUrl?: string;
  applicationId?: number;
  applicationStatus?: string;
}

const STATUS_OPTIONS = [
  { value: "NOT_APPLIED",  label: "Not Tracked" },
  { value: "SAVED",        label: "Saved" },
  { value: "APPLIED",      label: "Applied" },
  { value: "PHONE_SCREEN", label: "Phone Screen" },
  { value: "INTERVIEW",    label: "Interview" },
  { value: "OFFER",        label: "Offer" },
  { value: "REJECTED",     label: "Rejected" },
];

function formatSalary(min?: number, max?: number): string {
  if (!min && !max) return "";
  const fmt = (n: number) => `$${(n / 1000).toFixed(0)}k`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

function formatDate(d?: string) {
  if (!d) return "Recently";
  return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const { getToken, isLoaded } = useAuth();

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
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
        setStatus(null);
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
        toast.success(`Status → ${newStatus.replace(/_/g, " ").toLowerCase()}`);
      }
    } catch (err) {
      toast.error("Failed to update");
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const companyLabel = job?.companyName ?? job?.company ?? "Company";

  if (loading) {
    return (
      <>
        <AppHeader />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "3px solid var(--color-border)", borderTopColor: "var(--color-orange)", animation: "spin 0.7s linear infinite" }} />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </>
    );
  }

  if (!job) {
    return (
      <>
        <AppHeader />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 24px" }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "48px", marginBottom: "16px" }}>😕</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "24px", color: "var(--color-white)", margin: "0 0 12px" }}>
              Job not found
            </h2>
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
          <Link
            href="/jobs"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "13px",
              color: "var(--color-white-65)",
              textDecoration: "none",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-white)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-white-65)")}
          >
            <FaArrowLeft style={{ fontSize: "11px" }} /> Back to Jobs
          </Link>
        }
      />

      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "32px", boxSizing: "border-box" }}>

          {/* Header card */}
          <div
            style={{
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              borderRadius: "16px",
              padding: "28px",
              marginBottom: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
              {/* Company logo placeholder */}
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "14px",
                  background: "var(--color-surface-3)",
                  border: "1px solid var(--color-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "22px",
                  color: "var(--color-orange)",
                  flexShrink: 0,
                }}
              >
                {companyLabel.charAt(0).toUpperCase()}
              </div>

              {/* Status + salary */}
              <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                {status && <StatusBadge status={status} />}
                {formatSalary(job.salaryMin, job.salaryMax) && (
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "12px",
                      color: "#4ade80",
                      background: "rgba(34,197,94,0.1)",
                      border: "1px solid rgba(34,197,94,0.2)",
                      padding: "3px 10px",
                      borderRadius: "999px",
                    }}
                  >
                    {formatSalary(job.salaryMin, job.salaryMax)}
                  </span>
                )}
              </div>
            </div>

            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: "clamp(22px, 3vw, 30px)",
                letterSpacing: "-0.025em",
                color: "var(--color-white)",
                margin: "16px 0 6px",
              }}
            >
              {job.title}
            </h1>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "15px", color: "var(--color-orange)", fontWeight: 500, margin: "0 0 16px" }}>
              {companyLabel}
            </p>

            {/* Meta tags */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
              {job.location && (
                <span style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--color-white-65)" }}>
                  <FaMapMarkerAlt style={{ color: "var(--color-white-40)" }} />
                  {job.location}
                  {job.remote && " (Remote)"}
                </span>
              )}
              {job.employmentType && (
                <span style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--color-white-65)" }}>
                  <FaBriefcase style={{ color: "var(--color-white-40)" }} />
                  {job.employmentType}
                </span>
              )}
              {job.experience && (
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: "11px",
                    background: "var(--color-surface-3)",
                    border: "1px solid var(--color-border)",
                    padding: "3px 10px",
                    borderRadius: "999px",
                    color: "var(--color-white-65)",
                  }}
                >
                  {job.experience}
                </span>
              )}
            </div>

            {/* Posted date */}
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--color-white-40)", letterSpacing: "0.08em", marginBottom: "20px" }}>
              Posted {formatDate(job.postedAt)}
            </p>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {job.applyUrl && (
                <a
                  href={job.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                  style={{ gap: "8px" }}
                >
                  Apply Now <FaExternalLinkAlt style={{ fontSize: "11px" }} />
                </a>
              )}

              {/* Status dropdown */}
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <select
                  value={status ?? "NOT_APPLIED"}
                  disabled={actionLoading}
                  onChange={handleStatusChange}
                  style={{
                    appearance: "none",
                    background: "var(--color-surface-3)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "10px",
                    padding: "11px 36px 11px 16px",
                    color: "var(--color-white-65)",
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer",
                    outline: "none",
                    opacity: actionLoading ? 0.5 : 1,
                  }}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <FaChevronDown style={{ position: "absolute", right: "14px", pointerEvents: "none", fontSize: "10px", color: "var(--color-white-40)" }} />
              </div>
            </div>
          </div>

          {/* Description card */}
          {job.description && (
            <div
              style={{
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                borderRadius: "16px",
                padding: "28px",
                marginBottom: "20px",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "18px",
                  color: "var(--color-white)",
                  margin: "0 0 16px",
                  letterSpacing: "-0.02em",
                }}
              >
                Job Description
              </h2>
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  color: "var(--color-white-65)",
                  lineHeight: "1.8",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {job.description}
              </div>
            </div>
          )}

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <div
              style={{
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                borderRadius: "16px",
                padding: "28px",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "18px",
                  color: "var(--color-white)",
                  margin: "0 0 16px",
                  letterSpacing: "-0.02em",
                }}
              >
                Requirements
              </h2>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                {job.requirements.map((req, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <FaCheckCircle style={{ fontSize: "12px", color: "var(--color-orange)", marginTop: "3px", flexShrink: 0 }} />
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--color-white-65)", lineHeight: 1.6 }}>
                      {req}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
