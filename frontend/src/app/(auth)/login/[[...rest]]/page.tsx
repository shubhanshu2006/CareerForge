import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import type { Route } from "next";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log In — CareerForge",
  description: "Log in to your CareerForge account to track jobs and get instant alerts.",
};

export default function LoginPage() {
  return (
    <div className="auth-shell">
      <div style={{ position: "absolute", top: "24px", left: "24px" }}>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontFamily: "var(--font-body)",
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--color-white-65)",
            textDecoration: "none",
            padding: "8px 14px",
            borderRadius: "8px",
            border: "1px solid var(--color-border)",
            background: "var(--color-surface-1)",
            transition: "all 0.2s",
          }}
        >
          <span style={{ fontSize: "16px", lineHeight: 1 }}>←</span>
          Back to home
        </Link>
      </div>

      <div className="auth-split">
        {/* Left panel */}
        <div className="auth-left">
          <div className="auth-left-glow" />

          {/* Logo */}
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 800,
              fontSize: "22px",
              letterSpacing: "-0.02em",
              textDecoration: "none",
              color: "var(--color-white)",
              position: "relative",
            }}
          >
            Career<span style={{ color: "var(--color-orange)" }}>Forge</span>
          </Link>

          {/* Copy */}
          <div style={{ position: "relative" }}>
            <h2
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 800,
                fontSize: "clamp(26px, 3vw, 36px)",
                letterSpacing: "-0.03em",
                color: "var(--color-white)",
                lineHeight: 1.15,
                margin: "0 0 16px",
              }}
            >
              Welcome back.<br />
              <span style={{ color: "var(--color-orange)" }}>Your edge awaits.</span>
            </h2>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                color: "var(--color-white-65)",
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              Log back in to see new job alerts, track your applications, and
              stay ahead of the competition.
            </p>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", position: "relative" }}>
            {[
              { v: "< 5 min", l: "Average alert speed" },
              { v: "500+",    l: "Company sources" },
              { v: "10k+",    l: "Roles tracked daily" },
            ].map((s) => (
              <div key={s.l} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                    fontSize: "16px",
                    color: "var(--color-orange)",
                    minWidth: "52px",
                  }}
                >
                  {s.v}
                </span>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--color-white-40)" }}>
                  {s.l}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Clerk sign in */}
        <div className="auth-right">
          <SignIn
            appearance={{
              variables: {
                colorPrimary: "#f97316",
                colorBackground: "transparent",
                colorText: "#ffffff",
                colorTextSecondary: "rgba(255,255,255,0.65)",
                colorInputBackground: "#1c1c22",
                colorInputText: "#ffffff",
                borderRadius: "10px",
                fontFamily: "inherit",
              },
              elements: {
                rootBox: { width: "100%" },
                card: {
                  background: "transparent",
                  border: "none",
                  boxShadow: "none",
                  padding: 0,
                },
                // Hide Clerk branding footer
                footer: { display: "none" },
                formButtonPrimary: {
                  background: "var(--color-orange)",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "14px",
                  "&:hover": { background: "#ea580c" },
                },
              },
            }}
            redirectUrl="/dashboard"
          />
          {/* Manual nav link replacing Clerk footer */}
          <p
            style={{
              marginTop: "16px",
              textAlign: "center",
              fontSize: "13px",
              fontFamily: "var(--font-body)",
              color: "var(--color-white-40)",
            }}
          >
            Don&apos;t have an account?{" "}
            <Link href={"/register" as Route} style={{ color: "var(--color-orange)", fontWeight: 600 }}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
