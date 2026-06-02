import React from "react";

export type ApplicationStatus =
  | "SAVED"
  | "APPLIED"
  | "PHONE_SCREEN"
  | "INTERVIEW"
  | "OFFER"
  | "REJECTED"
  | "WITHDRAWN";

const STATUS_STYLES: Record<ApplicationStatus, { bg: string; color: string; border: string; label: string }> = {
  SAVED:        { bg: "rgba(168,85,247,0.12)",  color: "#c084fc", border: "rgba(168,85,247,0.20)",  label: "Saved" },
  APPLIED:      { bg: "rgba(59,130,246,0.12)",   color: "#60a5fa", border: "rgba(59,130,246,0.20)",   label: "Applied" },
  PHONE_SCREEN: { bg: "rgba(20,184,166,0.12)",   color: "#2dd4bf", border: "rgba(20,184,166,0.20)",   label: "Phone Screen" },
  INTERVIEW:    { bg: "rgba(249,115,22,0.12)",   color: "#f97316", border: "rgba(249,115,22,0.22)",   label: "Interview" },
  OFFER:        { bg: "rgba(34,197,94,0.12)",    color: "#4ade80", border: "rgba(34,197,94,0.20)",    label: "Offer" },
  REJECTED:     { bg: "rgba(239,68,68,0.10)",    color: "#f87171", border: "rgba(239,68,68,0.18)",    label: "Rejected" },
  WITHDRAWN:    { bg: "rgba(100,116,139,0.12)",  color: "#94a3b8", border: "rgba(100,116,139,0.20)",  label: "Withdrawn" },
};

interface StatusBadgeProps {
  status: ApplicationStatus | string;
  size?: "sm" | "md";
}

export function getStatusStyle(status: string) {
  const key = status.toUpperCase().replace(/\s+/g, "_") as ApplicationStatus;
  return STATUS_STYLES[key] ?? STATUS_STYLES.APPLIED;
}

export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const s = getStatusStyle(status);
  return (
    <span
      style={{
        fontFamily: "var(--font-body)",
        fontWeight: 700,
        fontSize: size === "sm" ? "10px" : "11px",
        letterSpacing: "0.06em",
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        padding: size === "sm" ? "2px 8px" : "3px 10px",
        borderRadius: "999px",
        whiteSpace: "nowrap",
        display: "inline-block",
      }}
    >
      {s.label}
    </span>
  );
}
