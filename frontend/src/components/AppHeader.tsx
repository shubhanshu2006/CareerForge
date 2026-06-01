"use client";

import React from "react";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";

interface AppHeaderProps {
  left?: React.ReactNode;
}

export default function AppHeader({ left }: AppHeaderProps) {
  const { user } = useUser();
  const name = user?.fullName || user?.firstName || user?.username || "User";
  const avatarUrl =
    user?.imageUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f97316&color=000&bold=true&size=72`;

  const defaultLeft = (
    <div
      style={{
        fontFamily: "var(--font-display)",
        fontWeight: 800,
        fontSize: "20px",
        color: "var(--color-white)",
        letterSpacing: "-0.02em",
      }}
    >
      Career<span style={{ color: "var(--color-orange)" }}>Forge</span>
    </div>
  );

  return (
    <header
      style={{
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        background: "var(--color-surface-1)",
        borderBottom: "1px solid var(--color-border)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        flexShrink: 0,
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .app-header-inner { padding: 0 16px 0 60px !important; }
          .app-header-username { display: none !important; }
        }
      `}</style>

      {/* Left slot */}
      <div
        className="app-header-inner"
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          padding: "0 24px",
          margin: "0 -24px",
        }}
      >
        {left ?? defaultLeft}
      </div>

      {/* Right — user identity */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexShrink: 0,
          marginLeft: "16px",
        }}
      >
        <p
          className="app-header-username"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "13px",
            color: "var(--color-white)",
            margin: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "120px",
          }}
        >
          {name}
        </p>
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            border: "2px solid var(--color-orange-border)",
            overflow: "hidden",
            flexShrink: 0,
            background: "var(--color-surface-3)",
          }}
        >
          <Image
            src={avatarUrl}
            alt={name}
            width={32}
            height={32}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      </div>
    </header>
  );
}
