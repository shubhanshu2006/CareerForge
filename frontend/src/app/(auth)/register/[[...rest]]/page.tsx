import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import type { Route } from "next";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account — CareerForge",
  description: "Join CareerForge and discover jobs before everyone else. Free to start.",
};

export default function RegisterPage() {
  return (
    <div className="auth-shell">

      <div className="auth-split">
        {/* Left panel */}
        <div className="auth-left">
          <div className="auth-left-glow" />

          {/* Logo */}
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-display)",
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
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: "clamp(26px, 3vw, 36px)",
                letterSpacing: "-0.03em",
                color: "var(--color-white)",
                lineHeight: 1.15,
                margin: "0 0 16px",
              }}
            >
              Start before<br />
              <span style={{ color: "var(--color-orange)" }}>the crowd does.</span>
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
              Create your free account and get instant alerts the moment
              matching jobs appear — directly from company career pages.
            </p>
          </div>

          {/* Feature list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", position: "relative" }}>
            {[
              "Instant alerts from 500+ company career pages",
              "AI-powered job search in plain English",
              "Full application tracker with notes",
              "Interview analysis & skill gap insights",
            ].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <span
                  style={{
                    color: "var(--color-orange)",
                    fontSize: "14px",
                    marginTop: "1px",
                    flexShrink: 0,
                  }}
                >
                  ✓
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "13px",
                    color: "var(--color-white-65)",
                    lineHeight: 1.5,
                  }}
                >
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Clerk sign up */}
        <div className="auth-right">
          <SignUp
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
                // Hide email/password form and divider — Google only
                dividerRow: { display: "none" },
                formField__emailAddress: { display: "none" },
                formField__password: { display: "none" },
                formButtonPrimary: { display: "none" },
                // Hide Clerk branding footer
                footer: { display: "none" },
              },
            }}
            redirectUrl="/onboarding"
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
            Already have an account?{" "}
            <Link href={"/login" as Route} style={{ color: "var(--color-orange)", fontWeight: 600 }}>
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
