"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import {
  FaTh,
  FaSearch,
  FaPaperPlane,
  FaBookmark,
  FaUser,
  FaPowerOff,
  FaBars,
  FaChevronLeft,
  FaChevronRight,
  FaSlidersH,
  FaHeartbeat,
  FaHeart,
} from "react-icons/fa";

const NAV_ITEMS: { label: string; path: Route; icon: React.ReactNode }[] = [
  { label: "Dashboard",   path: "/dashboard",    icon: <FaTh /> },
  { label: "Browse Jobs", path: "/jobs",          icon: <FaSearch /> },
  { label: "For You",     path: "/for-you",       icon: <FaHeart /> },
  { label: "Applications",path: "/applications",  icon: <FaPaperPlane /> },
  { label: "Saved Jobs",  path: "/saved",         icon: <FaBookmark /> },
  { label: "Preferences", path: "/preferences",   icon: <FaSlidersH /> },
  { label: "Profile",     path: "/profile",        icon: <FaUser /> },
  { label: "Monitoring",  path: "/monitoring",    icon: <FaHeartbeat /> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");
  const sidebarWidth = collapsed ? "64px" : "240px";

  const handleSignOut = async () => {
    await signOut({ redirectUrl: "/" });
  };

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
        className="sidebar-mobile-btn"
        style={{
          display: "none",
          position: "fixed",
          top: "14px",
          left: "14px",
          zIndex: 200,
          background: "var(--color-surface-2)",
          border: "1px solid var(--color-border)",
          borderRadius: "8px",
          width: "40px",
          height: "40px",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "var(--color-white-65)",
          fontSize: "18px",
        }}
      >
        <FaBars />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            zIndex: 199,
            backdropFilter: "blur(4px)",
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        className="cf-sidebar"
        style={{
          width: sidebarWidth,
          minHeight: "100vh",
          background: "var(--color-surface-1)",
          borderRight: "1px solid var(--color-border)",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
          transition: "width 0.25s cubic-bezier(0.4,0,0.2,1)",
          zIndex: 100,
        }}
      >
        {/* Logo + collapse toggle */}
        <div
          style={{
            padding: collapsed ? "20px 0" : "20px 16px",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            gap: "8px",
            height: "64px",
            flexShrink: 0,
          }}
        >
          {!collapsed && (
            <Link
              href="/"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: "19px",
                color: "var(--color-white)",
                textDecoration: "none",
                letterSpacing: "-0.02em",
                whiteSpace: "nowrap",
              }}
            >
              Career<span style={{ color: "var(--color-orange)" }}>Forge</span>
            </Link>
          )}
          <button
            onClick={() => {
              if (typeof window !== "undefined" && window.innerWidth <= 768) {
                setMobileOpen(false);
              } else {
                setCollapsed((c) => !c);
              }
            }}
            aria-label="Toggle sidebar"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--color-white-40)",
              fontSize: "15px",
              padding: "4px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "color 0.2s",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-white)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-white-40)")}
          >
            {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
        </div>

        {/* Nav items */}
        <nav
          style={{
            flex: 1,
            padding: "10px 8px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          {NAV_ITEMS.map(({ label, path, icon }) => {
            const active = isActive(path);
            return (
              <Link
                key={path}
                href={path}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? label : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: collapsed ? "10px 0" : "10px 12px",
                  justifyContent: collapsed ? "center" : "flex-start",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  fontSize: "13px",
                  color: active ? "var(--color-orange)" : "var(--color-white-65)",
                  background: active ? "var(--color-orange-dim)" : "transparent",
                  border: active
                    ? "1px solid var(--color-orange-border)"
                    : "1px solid transparent",
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "var(--color-surface-3)";
                    e.currentTarget.style.color = "var(--color-white)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--color-white-65)";
                  }
                }}
              >
                <span style={{ fontSize: "15px", flexShrink: 0 }}>{icon}</span>
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sign Out */}
        <div style={{ padding: "8px", borderTop: "1px solid var(--color-border)", flexShrink: 0 }}>
          <button
            onClick={handleSignOut}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: collapsed ? "10px 0" : "10px 12px",
              justifyContent: collapsed ? "center" : "flex-start",
              width: "100%",
              borderRadius: "8px",
              background: "transparent",
              border: "1px solid transparent",
              cursor: "pointer",
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: "13px",
              color: "rgba(248,113,113,0.8)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239,68,68,0.08)";
              e.currentTarget.style.borderColor = "rgba(239,68,68,0.15)";
              e.currentTarget.style.color = "#f87171";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "transparent";
              e.currentTarget.style.color = "rgba(248,113,113,0.8)";
            }}
          >
            <span style={{ fontSize: "15px", flexShrink: 0 }}>
              <FaPowerOff />
            </span>
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      <style>{`
        @media (max-width: 768px) {
          .cf-sidebar {
            position: fixed !important;
            top: 0;
            left: ${mobileOpen ? "0" : "-260px"} !important;
            width: 260px !important;
            z-index: 1000 !important;
            transition: left 0.3s cubic-bezier(0.4,0,0.2,1) !important;
            box-shadow: ${mobileOpen ? "4px 0 40px rgba(0,0,0,0.8)" : "none"};
          }
          .sidebar-mobile-btn {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
}
