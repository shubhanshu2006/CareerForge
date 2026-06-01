import React from "react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  accent?: "orange" | "blue" | "green" | "purple";
}

const ACCENT_MAP: Record<string, { rgb: string; icon: string }> = {
  orange: { rgb: "249,115,22", icon: "249,115,22" },
  blue:   { rgb: "59,130,246", icon: "59,130,246" },
  green:  { rgb: "34,197,94",  icon: "34,197,94" },
  purple: { rgb: "168,85,247", icon: "168,85,247" },
};

export default function StatCard({ title, value, icon, accent = "orange" }: StatCardProps) {
  const a = ACCENT_MAP[accent] || ACCENT_MAP.orange;

  return (
    <div
      style={{
        background: "var(--color-surface-2)",
        border: "1px solid var(--color-border)",
        borderRadius: "14px",
        padding: "22px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = `rgba(${a.rgb},0.25)`;
        (e.currentTarget as HTMLElement).style.boxShadow = `0 0 24px rgba(${a.rgb},0.07)`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "10px",
            letterSpacing: "0.13em",
            textTransform: "uppercase",
            color: "var(--color-white-40)",
            margin: 0,
          }}
        >
          {title}
        </p>
        {icon && (
          <div
            style={{
              width: "32px",
              height: "32px",
              background: `rgba(${a.icon},0.10)`,
              border: `1px solid rgba(${a.icon},0.18)`,
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              color: `rgb(${a.icon})`,
            }}
          >
            {icon}
          </div>
        )}
      </div>
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontWeight: 700,
          fontSize: "34px",
          letterSpacing: "-0.02em",
          lineHeight: 1,
          color: "var(--color-white)",
          margin: 0,
        }}
      >
        {value ?? 0}
      </p>
    </div>
  );
}
