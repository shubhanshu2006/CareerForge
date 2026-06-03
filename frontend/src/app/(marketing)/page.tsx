import Link from "next/link";
import type { Route } from "next";
import type { Metadata } from "next";
import SplineHero from "@/components/SplineHero";

export const metadata: Metadata = {
  title: "CareerForge — Discover Jobs Before Everyone Else",
  description:
    "CareerForge discovers opportunities directly from company career pages, alerts you instantly, and helps you stay ahead of the crowd.",
};

const STEPS = [
  "Create your profile.",
  "Set your preferences.",
  "Receive instant job alerts.",
  "Track your applications.",
  "Improve continuously.",
];


const USP_CARDS = [
  {
    icon: "⚡",
    title: "Early Discovery",
    desc: "We monitor company career pages directly — before opportunities hit job boards.",
  },
  {
    icon: "🔔",
    title: "Instant Alerts",
    desc: "Get notified within minutes of a matching role going live.",
  },
  {
    icon: "📊",
    title: "Unified Tracker",
    desc: "Manage every application, note, and status change in one place.",
  },
];

const MARQUEE_ITEMS = [
  "Google",
  "Meta",
  "Stripe",
  "Figma",
  "Notion",
  "Linear",
  "Vercel",
  "Anthropic",
  "OpenAI",
  "Shopify",
  "Airbnb",
  "Databricks",
  "Snowflake",
  "Rippling",
  "Scale AI",
];

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh" }}>
      <style>{`
        /* ── Layout grids ── */
        .hero-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          align-items: center;
        }
        .usp-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .ai-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .flow-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
          text-align: center;
        }
        .timeline-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }
        .howto-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          align-items: center;
        }

        /* ── Hero card ── */
        .hero-stat-card {
          background: linear-gradient(145deg, rgba(249,115,22,0.10), rgba(15,16,20,0.95));
          border: 1px solid rgba(249,115,22,0.22);
          border-radius: 20px;
          padding: 28px;
          box-shadow: var(--shadow-soft);
          position: relative;
          overflow: hidden;
        }
        .hero-glow {
          position: absolute;
          top: -60px;
          right: -60px;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(249,115,22,0.18), transparent 70%);
          animation: pulse 6s ease-in-out infinite;
        }

        /* ── Cards ── */
        .cf-card {
          background: var(--color-surface-2);
          border: 1px solid var(--color-border);
          border-radius: 16px;
          padding: 22px;
          transition: border-color 0.25s, box-shadow 0.25s, transform 0.2s;
        }
        .cf-card:hover {
          border-color: var(--color-orange-border);
          box-shadow: 0 0 30px rgba(249,115,22,0.08);
          transform: translateY(-2px);
        }

        /* ── Timeline step ── */
        .timeline-step {
          background: var(--color-surface-3);
          border: 1px dashed rgba(255,255,255,0.12);
          border-radius: 12px;
          padding: 16px;
          text-align: center;
          font-family: var(--font-body);
          font-weight: 900;
          font-size: 12px;
          color: var(--color-white-65);
        }
        .timeline-step.bad {
          border-color: rgba(239,68,68,0.25);
          background: rgba(239,68,68,0.05);
          color: #f87171;
        }

        /* ── Flow pill ── */
        .flow-pill {
          padding: 12px 10px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.02);
          font-family: var(--font-body);
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: var(--color-white-50);
          transition: all 0.2s;
        }
        .flow-pill.good {
          border-color: rgba(249,115,22,0.20);
          background: rgba(249,115,22,0.05);
          color: var(--color-orange);
        }

        /* ── Cursor blob ── */
        .cursor-blob {
          position: fixed;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
          animation: blobMove 12s ease-in-out infinite;
          top: 10%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        /* ── Stat mini ── */
        .hero-stat-mini {
          background: var(--color-surface-2);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          padding: 16px;
          flex: 1;
        }

        /* ── Responsive ── */
        @media (max-width: 960px) {
          .hero-grid, .howto-grid, .ai-grid { grid-template-columns: 1fr !important; }
          .usp-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .flow-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .timeline-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .section { padding: 120px 24px !important; }
          .hero-stat-card { display: none !important; }
          .hero-grid { padding: 0 24px !important; gap: 32px !important; }
        }
        @media (max-width: 600px) {
          .usp-grid { grid-template-columns: 1fr !important; }
          .flow-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .section { padding: 80px 20px !important; }
          .hero-grid h1 { font-size: 40px !important; }
          .landing-header { padding: 14px 20px !important; }
          .landing-logo { font-size: 17px !important; }
          .landing-nav { gap: 6px !important; }
          .landing-nav .btn-ghost { font-size: 12px !important; padding: 8px 10px !important; }
          .landing-nav .btn-primary { font-size: 12px !important; padding: 8px 14px !important; }
        }
      `}</style>

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header
        className="landing-header"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: "transparent",
          boxSizing: "border-box",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 40px",
        }}
      >
          <Link
            className="landing-logo"
            href="/"
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 900,
              fontSize: "20px",
              letterSpacing: "-0.02em",
              color: "var(--color-white)",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            Career<span style={{ color: "var(--color-orange)" }}>Forge</span>
          </Link>
          <div className="landing-nav" style={{ display: "flex", gap: "10px", alignItems: "center", flexShrink: 0 }}>
            <Link
              className="btn-ghost"
              href={"/login" as Route}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                fontWeight: 900,
              }}
            >
              Log in
            </Link>
            <Link
              className="btn-primary"
              href={"/register" as Route}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                fontWeight: 900,
              }}
            >
              Start free
            </Link>
          </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section
        style={{
          position: "relative",
          width: "100%",
          height: "100vh",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Spline fills the entire 100vh section */}
        <SplineHero />

        {/* Hero content sits on top */}
        <div
          className="hero-grid"
          style={{
            position: "relative",
            zIndex: 2,
            width: "100%",
            maxWidth: "1120px",
            padding: "0 40px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "48px",
            alignItems: "center",
          }}
        >
          {/* Left copy */}
          <div style={{ position: "relative" }}>
            <span className="section-label">CareerForge</span>
            <h1
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 900,
                fontSize: "60px",
                lineHeight: 1.03,
                letterSpacing: "-0.035em",
                marginBottom: "20px",
                color: "var(--color-white)",
              }}
            >
              The best jobs are filled before you ever{" "}
              <span style={{ color: "var(--color-orange)" }}>see them.</span>
            </h1>
            <p
              style={{
                fontSize: "17px",
                color: "var(--color-white-65)",
                lineHeight: 1.7,
                maxWidth: "500px",
                marginBottom: "32px",
              }}
            >
              CareerForge discovers opportunities directly from company career
              pages, alerts you instantly, and helps you stay ahead of the
              crowd.
            </p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Link
                className="btn-primary"
                href={"/register" as Route}
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "16px",
                  fontWeight: 900,
                }}
              >
                Start tracking free
              </Link>
              <Link
                className="btn-ghost"
                href="#how-it-works"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  fontWeight: 900,
                }}
              >
                See how it works
              </Link>
            </div>

            {/* Social proof */}
            <p
              style={{
                marginTop: "20px",
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--color-white-40)",
                letterSpacing: "0.08em",
              }}
            >
              &lt;5 MIN ALERT SPEED · 500+ SOURCES · 10K+ ROLES/DAY
            </p>
          </div>

          {/* Right — live window card */}
          <div
            className="hero-stat-card"
            style={{ animationDelay: "0.15s" }}
          >
            <div className="hero-glow" />
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 900,
                fontSize: "13px",
                color: "var(--color-white-65)",
                marginBottom: "20px",
                position: "relative",
                zIndex: 1,
              }}
            >
              ⚡ Live Advantage Window
            </p>

            <div
              style={{
                display: "flex",
                gap: "12px",
                marginBottom: "16px",
                position: "relative",
                zIndex: 1,
              }}
            >
              {[
                { v: "< 5 min", l: "Alert Speed" },
                { v: "500+", l: "Sources" },
                { v: "10k+", l: "Roles/Day" },
              ].map((s) => (
                <div key={s.l} className="hero-stat-mini">
                  <p
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "22px",
                      fontWeight: 700,
                      margin: 0,
                      color: "var(--color-white)",
                    }}
                  >
                    {s.v}
                  </p>
                  <p
                    style={{
                      margin: "5px 0 0",
                      fontSize: "11px",
                      color: "var(--color-white-50)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    {s.l}
                  </p>
                </div>
              ))}
            </div>

            <div
              style={{
                padding: "14px",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
                fontSize: "13px",
                color: "var(--color-white-65)",
                lineHeight: 1.6,
                position: "relative",
                zIndex: 1,
              }}
            >
              We detect new roles within minutes and route them to your exact
              preferences — while most seekers still don't know the job exists.
            </div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE STRIP ─────────────────────────────────────── */}
      <div className="marquee-outer" style={{ padding: "14px 0" }}>
        <div className="marquee-inner">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span
              key={i}
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 900,
                fontSize: "13px",
                color: "var(--color-white-40)",
                padding: "0 28px",
                letterSpacing: "0.04em",
                whiteSpace: "nowrap",
              }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── PROBLEM ───────────────────────────────────────────── */}
      <section className="section" id="problem">
        <div className="section-inner">
          <span className="section-label">The Problem</span>
          <h2
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 900,
              fontSize: "60px",
              letterSpacing: "-0.025em",
              marginBottom: "12px",
              color: "var(--color-white)",
            }}
          >
            Most job seekers are{" "}
            <span style={{ color: "#f87171" }}>already too late.</span>
          </h2>
          <p
            style={{
              color: "var(--color-white-65)",
              fontSize: "20px",
              maxWidth: "600px",
              lineHeight: 1.7,
              marginBottom: "36px",
            }}
          >
            Most opportunities are discovered after the early application window
            is already gone. By the time a job appears on a major board,
            hundreds of candidates have already applied.
          </p>

          <div className="timeline-grid" style={{ fontSize: "54px" }}>
            {[
              { label: "Job Posted", bad: false },
              { label: "Indexed Days Later", bad: true },
              { label: "Hundreds Apply", bad: true },
              { label: "You Apply", bad: true },
            ].map((s, i) => (
              <div
                key={s.label}
                className={`timeline-step${s.bad ? " bad" : ""}`}
                style={{ "--reveal-delay": i * 80 } as React.CSSProperties}
              >
                {s.bad && (
                  <div style={{ fontSize: "18px", marginBottom: "8px" }}>
                    ⚠️
                  </div>
                )}
                {!s.bad && (
                  <div style={{ fontSize: "18px", marginBottom: "8px" }}>
                    📋
                  </div>
                )}
                {s.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOLUTION ──────────────────────────────────────────── */}
      <section
        className="section"
        id="solution"
        style={{ background: "rgba(249,115,22,0.02)" }}
      >
        <div className="section-inner">
          <span className="section-label">The Solution</span>
          <h2
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 900,
              fontSize: "60px",
              letterSpacing: "-0.025em",
              marginBottom: "12px",
              color: "var(--color-white)",
            }}
          >
            We go{" "}
            <span style={{ color: "var(--color-orange)" }}>
              directly to the source.
            </span>
          </h2>
          <p
            style={{
              color: "var(--color-white-65)",
              fontSize: "20px",
              maxWidth: "600px",
              lineHeight: 1.7,
              marginBottom: "36px",
            }}
          >
            CareerForge watches company career pages 24/7, detects new postings
            the moment they appear, and routes them to you — before they reach
            any job board.
          </p>

          <div className="flow-grid">
            {[
              { label: "Company Career Page", good: false },
              { label: "CareerForge Detects Job", good: true },
              { label: "Matches Your Preferences", good: true },
              { label: "Instant Alert", good: true },
              { label: "Early Application", good: true },
            ].map((s, i) => (
              <div
                key={s.label}
                className={`flow-pill${s.good ? " good" : ""}`}
                style={{ "--reveal-delay": i * 70 } as React.CSSProperties}
              >
                {s.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── USP ───────────────────────────────────────────────── */}
      <section className="section" id="usp">
        <div className="section-inner">
          <span className="section-label">Why CareerForge</span>
          <h2
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 900,
              fontSize: "60px",
              letterSpacing: "-0.025em",
              marginBottom: "8px",
              color: "var(--color-white)",
            }}
          >
            Minutes matter.
          </h2>
          <p
            style={{
              color: "var(--color-white-65)",
              fontSize: "20px",
              marginBottom: "32px",
            }}
          >
            Early applicants are 4x more likely to get an interview.
          </p>

          <div className="usp-grid">
            {USP_CARDS.map((c, i) => (
              <div
                key={c.title}
                className="cf-card"
                style={{ "--reveal-delay": i * 100 } as React.CSSProperties}
              >
                <div style={{ fontSize: "28px", marginBottom: "14px" }}>
                  {c.icon}
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: 900,
                    fontSize: "16px",
                    color: "var(--color-white)",
                    margin: "0 0 8px",
                  }}
                >
                  {c.title}
                </h3>
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--color-white-65)",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {c.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────── */}
      <section className="section" id="how-it-works">
        <div className="section-inner howto-grid">
          <div>
            <span className="section-label">How It Works</span>
            <h2
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 900,
                fontSize: "60px",
                letterSpacing: "-0.025em",
                marginBottom: "16px",
                color: "var(--color-white)",
              }}
            >
              Five steps.{" "}
              <span style={{ color: "var(--color-orange)" }}>No waste.</span>
            </h2>
            <p
              style={{
                color: "var(--color-white-65)",
                fontSize: "20px",
                lineHeight: 1.7,
              }}
            >
              Build your profile once, then let CareerForge do the chasing. You
              focus on preparing — we handle the discovery.
            </p>
          </div>

          <div className="cf-card" style={{ display: "grid", gap: "14px" }}>
            {STEPS.map((step, i) => (
              <div
                key={step}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  fontFamily: "var(--font-body)",
                  fontWeight: 900,
                  fontSize: "14px",
                  color: "var(--color-white-65)",
                }}
              >
                <span
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "999px",
                    background: "var(--color-orange-dim)",
                    border: "1px solid var(--color-orange-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-orange)",
                    fontSize: "12px",
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </span>
                {step}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────── */}
      <section className="section" id="cta">
        <div className="section-inner">
          <div
            style={{
              textAlign: "center",
              padding: "64px 32px",
              background:
                "linear-gradient(135deg, rgba(249,115,22,0.18), rgba(15,16,20,0.95))",
              border: "1px solid rgba(249,115,22,0.25)",
              borderRadius: "24px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Glow */}
            <div
              style={{
                position: "absolute",
                top: "-80px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "400px",
                height: "400px",
                background:
                  "radial-gradient(circle, rgba(249,115,22,0.15), transparent 70%)",
                pointerEvents: "none",
              }}
            />
            <h2
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 900,
                fontSize: "clamp(36px, 4vw, 44px)",
                letterSpacing: "0.025em",
                marginBottom: "16px",
                color: "var(--color-white)",
                position: "relative",
              }}
            >
              The next opportunity you miss could have{" "}
              <span style={{ color: "var(--color-orange)" }}>
                changed everything.
              </span>
            </h2>
            <p
              style={{
                color: "var(--color-white-65)",
                maxWidth: "560px",
                margin: "0 auto 28px",
                fontSize: "16px",
                lineHeight: 1.7,
                position: "relative",
              }}
            >
              Start tracking now and be first in line for the roles that matter.
              Free to start. No credit card required.
            </p>
            <Link
              className="btn-primary"
              href={"/register" as Route}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "20px",
                fontWeight: 900,
              }}
            >
              Create your profile →
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: "1px solid var(--color-border)",
          padding: "32px 24px",
        }}
      >
        <div
          style={{
            maxWidth: "1120px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "15px",
              color: "var(--color-white-40)",
              margin: 0,
            }}
          >
            © {new Date().getFullYear()} CareerForge. Built to get you hired.
          </p>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "15px",
              color: "var(--color-white-65)",
              margin: 0,
            }}
          >
            Made with <span style={{ color: "#ef4444" }}>♥</span> by{" "}
            <span style={{ color: "var(--color-white)", fontWeight: 700 }}>
              Shubhanshu Singh
            </span>
          </p>
        </div>
      </footer>
    </div>
  );
}
