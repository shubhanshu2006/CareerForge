"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import {
  FaMapMarkerAlt,
  FaBriefcase,
  FaBookmark,
  FaRegBookmark,
  FaCheck,
  FaChevronDown,
  FaExternalLinkAlt,
} from "react-icons/fa";
import { getStatusStyle } from "./StatusBadge";
import { createApi, unwrap } from "@/lib/api";
import { useAuth } from "@clerk/nextjs";

export interface Job {
  id: number;
  title: string;
  company?: string;
  companyName?: string;
  location?: string;
  employmentType?: string;
  postedAt?: string;
  applyUrl?: string;
  remote?: boolean;
  experience?: string;
  // Injected from applications list:
  applicationId?: number;
  applicationStatus?: string;
  isSaved?: boolean;
  isApplied?: boolean;
}

function formatPostedDate(dateString?: string): string {
  if (!dateString) return "Recently";
  const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 86_400_000);
  if (diff < 1) return "Today";
  if (diff === 1) return "1 day ago";
  if (diff < 7) return `${diff} days ago`;
  if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
  return `${Math.floor(diff / 30)}mo ago`;
}

interface JobCardProps {
  job: Job;
  onStatusChange?: (jobId: number, status: string | null) => void;
}

const STATUS_OPTIONS = [
  { value: "NOT_APPLIED", label: "Not Tracked" },
  { value: "SAVED",       label: "Saved" },
  { value: "APPLIED",     label: "Applied" },
  { value: "PHONE_SCREEN",label: "Phone Screen" },
  { value: "INTERVIEW",   label: "Interview" },
  { value: "OFFER",       label: "Offer" },
  { value: "REJECTED",    label: "Rejected" },
];

export default function JobCard({ job, onStatusChange }: JobCardProps) {
  const { getToken } = useAuth();
  const api = createApi(() => getToken());

  const {
    id,
    title = "Software Engineer",
    company,
    companyName,
    location = "Remote",
    employmentType,
    postedAt,
    applicationStatus,
    applyUrl,
  } = job;

  const companyLabel = companyName || company || "Company";

  const [currentStatus, setCurrentStatus] = useState<string | null>(applicationStatus ?? null);
  const [applicationId, setApplicationId] = useState<number | null>(job.applicationId ?? null);
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    setCurrentStatus(applicationStatus ?? null);
    setApplicationId(job.applicationId ?? null);
  }, [applicationStatus, job.applicationId]);

  const isTracked = !!currentStatus && currentStatus !== "NOT_APPLIED";

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const newStatus = e.target.value;
    if (loading) return;

    setLoading(true);
    try {
      if (newStatus === "NOT_APPLIED") {
        // If there's an applicationId, we just mark it withdrawn
        if (applicationId) {
          await unwrap(await api.updateApplicationStatus(applicationId, "WITHDRAWN"));
        }
        setCurrentStatus(null);
        onStatusChange?.(id, null);
        toast.success("Removed from tracker");
      } else {
        if (!applicationId) {
          // Create application first
          const appData = await unwrap<{ id: number }>(await api.createApplication(id));
          setApplicationId(appData.id);
          const updated = await unwrap(await api.updateApplicationStatus(appData.id, newStatus));
          void updated;
        } else {
          await unwrap(await api.updateApplicationStatus(applicationId, newStatus));
        }
        setCurrentStatus(newStatus);
        onStatusChange?.(id, newStatus);
        toast.success(`Status → ${newStatus.replace(/_/g, " ").toLowerCase()}`);
      }
    } catch (err) {
      toast.error("Failed to update status");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAppliedToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    const newStatus = isTracked ? "NOT_APPLIED" : "APPLIED";
    const syntheticEvent = { target: { value: newStatus }, preventDefault: () => {}, stopPropagation: () => {} } as unknown as React.ChangeEvent<HTMLSelectElement>;
    await handleStatusChange(syntheticEvent);
  };

  const statusStyle = currentStatus ? getStatusStyle(currentStatus) : null;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "var(--color-surface-2)",
        border: hovered ? "1px solid var(--color-orange-border)" : "1px solid var(--color-border)",
        borderRadius: "14px",
        padding: "22px",
        display: "flex",
        flexDirection: "column",
        gap: "0",
        transition: "border-color 0.25s, box-shadow 0.25s, transform 0.2s",
        boxShadow: hovered ? "0 0 32px rgba(249,115,22,0.09)" : "none",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        position: "relative",
      }}
    >
      {/* Top row: company initial + bookmark */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "14px",
        }}
      >
        <div
          style={{
            width: "38px",
            height: "38px",
            background: "var(--color-surface-3)",
            border: "1px solid var(--color-border)",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "16px",
            color: "var(--color-orange)",
          }}
        >
          {companyLabel.charAt(0).toUpperCase()}
        </div>
        <button
          onClick={handleAppliedToggle}
          disabled={loading}
          title={isTracked ? "Remove from tracker" : "Track this job"}
          style={{
            background: "transparent",
            border: "none",
            color: isTracked ? "#c084fc" : "var(--color-white-40)",
            fontSize: "17px",
            cursor: "pointer",
            padding: "8px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
            opacity: loading ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--color-surface-3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          {isTracked ? <FaBookmark /> : <FaRegBookmark />}
        </button>
      </div>

      {/* Title */}
      <h3
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: "15px",
          letterSpacing: "-0.01em",
          color: "var(--color-white)",
          margin: "0 0 4px",
          lineHeight: 1.35,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {title}
      </h3>

      {/* Company */}
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "13px",
          color: "var(--color-orange)",
          margin: "0 0 14px",
          fontWeight: 500,
        }}
      >
        {companyLabel}
      </p>

      {/* Meta */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "5px",
          marginBottom: "16px",
          flex: 1,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <FaMapMarkerAlt style={{ fontSize: "11px", color: "var(--color-white-40)" }} />
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              color: "var(--color-white-65)",
            }}
          >
            {location}
          </span>
        </div>
        {employmentType && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <FaBriefcase style={{ fontSize: "11px", color: "var(--color-white-40)" }} />
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                color: "var(--color-white-65)",
              }}
            >
              {employmentType}
            </span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px solid var(--color-border)", marginBottom: "14px" }} />

      {/* Status row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid var(--color-border)",
          borderRadius: "8px",
          padding: "7px 10px",
          marginBottom: "14px",
        }}
      >
        <div
          onClick={handleAppliedToggle}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            userSelect: "none",
            fontFamily: "var(--font-display)",
            fontSize: "12px",
            fontWeight: 700,
            color: isTracked ? "#60a5fa" : "var(--color-white-40)",
            transition: "color 0.2s",
          }}
        >
          <div
            style={{
              width: "15px",
              height: "15px",
              border: isTracked ? "1px solid rgba(59,130,246,0.6)" : "1px solid var(--color-border)",
              borderRadius: "4px",
              background: isTracked ? "rgba(59,130,246,0.12)" : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#60a5fa",
              fontSize: "9px",
              transition: "all 0.2s",
            }}
          >
            {isTracked && <FaCheck />}
          </div>
          <span>Tracking</span>
        </div>

        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <select
            value={currentStatus ?? "NOT_APPLIED"}
            disabled={loading}
            onChange={handleStatusChange}
            style={{
              appearance: "none",
              background: "var(--color-surface-3)",
              border: "1px solid var(--color-border)",
              borderRadius: "6px",
              padding: "3px 22px 3px 8px",
              color: "var(--color-white-65)",
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: "11px",
              cursor: "pointer",
              outline: "none",
            }}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <FaChevronDown
            style={{
              position: "absolute",
              right: "7px",
              pointerEvents: "none",
              fontSize: "8px",
              color: "var(--color-white-40)",
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          flexWrap: "wrap",
          marginBottom: "12px",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "var(--color-white-40)",
            letterSpacing: "0.04em",
          }}
        >
          {formatPostedDate(postedAt)}
        </span>
        {statusStyle && (
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "10px",
              letterSpacing: "0.06em",
              background: statusStyle.bg,
              color: statusStyle.color,
              border: `1px solid ${statusStyle.border}`,
              padding: "2px 8px",
              borderRadius: "999px",
            }}
          >
            {currentStatus?.replace(/_/g, " ")}
          </span>
        )}
      </div>

      {/* CTA buttons */}
      <div style={{ display: "flex", gap: "8px" }}>
        <Link
          href={`/jobs/${id}`}
          style={{
            flex: 1,
            textAlign: "center",
            padding: "9px",
            borderRadius: "8px",
            background: "transparent",
            border: "1px solid var(--color-border)",
            color: "var(--color-white-65)",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "12px",
            textDecoration: "none",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--color-white-40)";
            e.currentTarget.style.color = "var(--color-white)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--color-border)";
            e.currentTarget.style.color = "var(--color-white-65)";
          }}
        >
          View Details
        </Link>
        {applyUrl && (
          <a
            href={applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1,
              textAlign: "center",
              padding: "9px",
              borderRadius: "8px",
              background: "var(--color-orange)",
              border: "none",
              color: "#000",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "12px",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "5px",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = "var(--color-orange-hover)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = "var(--color-orange)";
            }}
          >
            Apply <FaExternalLinkAlt style={{ fontSize: "10px" }} />
          </a>
        )}
      </div>
    </div>
  );
}
