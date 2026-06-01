"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { useAuth } from "@clerk/nextjs";
import { createApi, unwrap } from "@/lib/api";
import {
  FaPlus, FaTimes, FaCheckCircle, FaArrowRight, FaArrowLeft,
  FaBriefcase, FaCode, FaRocket,
} from "react-icons/fa";

const SUGGESTED_TITLES = [
  "Software Engineer", "Frontend Developer", "Backend Developer",
  "Full Stack Developer", "Data Scientist", "DevOps Engineer",
  "Product Manager", "UI/UX Designer", "Mobile Developer",
  "Cloud Engineer", "ML Engineer", "QA Engineer",
];

const SUGGESTED_SKILLS = [
  "JavaScript", "Python", "Java", "React", "Node.js",
  "TypeScript", "AWS", "Docker", "SQL", "Git",
  "C++", "Go", "Kubernetes", "MongoDB", "GraphQL",
];

const ROLE_TYPES = [
  "Intern", "Junior", "Mid-level", "Senior", "Lead",
  "Full-time", "Part-time", "Contract", "Freelance",
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--color-surface-3)",
  border: "1px dashed var(--color-border)",
  borderRadius: "10px",
  padding: "11px 16px",
  fontSize: "14px",
  color: "var(--color-white)",
  outline: "none",
  transition: "border-color 0.2s, box-shadow 0.2s",
  boxSizing: "border-box",
};

export default function OnboardingPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const api = createApi(() => getToken());

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [jobTitles, setJobTitles] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [roleTypes, setRoleTypes] = useState<string[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newSkill, setNewSkill] = useState("");

  const totalSteps = 4;
  const stepLabels = ["Welcome", "Job Titles", "Skills", "Role Types"];
  const isLastStep = step === totalSteps - 1;

  const next = () => setStep((s) => Math.min(s + 1, totalSteps - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const addTitle = (t?: string) => {
    const val = (t || newTitle).trim();
    if (val && !jobTitles.includes(val)) { setJobTitles((p) => [...p, val]); setNewTitle(""); }
  };
  const removeTitle = (t: string) => setJobTitles((p) => p.filter((x) => x !== t));

  const addSkill = (s?: string) => {
    const val = (s || newSkill).trim();
    if (val && !skills.includes(val)) { setSkills((p) => [...p, val]); setNewSkill(""); }
  };
  const removeSkill = (s: string) => setSkills((p) => p.filter((x) => x !== s));

  const toggleRole = (r: string) =>
    setRoleTypes((p) => p.includes(r) ? p.filter((x) => x !== r) : [...p, r]);

  const handleFinish = async () => {
    setSaving(true);
    try {
      await unwrap(await api.updatePreferences({
        jobTitles,
        skills,
        roleTypes,
        emailEnabled: true,
      }));
      toast.success("You're all set! Welcome to CareerForge.");
      router.push("/dashboard");
    } catch (e) {
      console.error(e);
      toast.error("Couldn't save preferences. You can set them later in Profile.");
      router.push("/dashboard");
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    toast("You can set your preferences anytime from the Preferences page.", { icon: "💡" });
    router.push("/dashboard");
  };

  const TagButton = ({
    label, active, onClick,
  }: { label: string; active: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      style={{
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: "11px",
        letterSpacing: "0.05em",
        padding: "7px 14px",
        borderRadius: "999px",
        cursor: "pointer",
        transition: "all 0.2s",
        background: active ? "var(--color-orange-dim)" : "var(--color-surface-3)",
        color: active ? "var(--color-orange)" : "var(--color-white-40)",
        border: active ? "1px solid var(--color-orange-border)" : "1px solid var(--color-border)",
        display: "flex",
        alignItems: "center",
        gap: "5px",
      }}
    >
      {active && <FaCheckCircle style={{ fontSize: "9px" }} />}
      {label}
    </button>
  );

  const Tag = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: "11px",
        letterSpacing: "0.06em",
        background: "var(--color-orange-dim)",
        color: "var(--color-orange)",
        border: "1px solid var(--color-orange-border)",
        padding: "4px 10px 4px 12px",
        borderRadius: "999px",
      }}
    >
      {label}
      <button
        onClick={onRemove}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "rgba(249,115,22,0.6)",
          fontSize: "10px",
          display: "flex",
          alignItems: "center",
          padding: 0,
        }}
      >
        <FaTimes />
      </button>
    </span>
  );

  const steps = [
    // Welcome
    <div key="welcome" style={{ textAlign: "center", padding: "20px 0" }}>
      <div
        style={{
          width: "80px",
          height: "80px",
          borderRadius: "20px",
          background: "var(--color-orange-dim)",
          border: "1px solid var(--color-orange-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
          fontSize: "36px",
          animation: "float 3s ease-in-out infinite",
        }}
      >
        🚀
      </div>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: "clamp(26px, 4vw, 34px)",
          letterSpacing: "-0.03em",
          color: "var(--color-white)",
          margin: "0 0 12px",
        }}
      >
        Welcome to <span style={{ color: "var(--color-orange)" }}>CareerForge!</span>
      </h1>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "15px",
          color: "var(--color-white-65)",
          lineHeight: 1.7,
          maxWidth: "440px",
          margin: "0 auto 8px",
        }}
      >
        Let's personalize your experience so you get matched with the right
        opportunities the moment they appear.
      </p>
      <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--color-white-40)" }}>
        Takes less than a minute. You can always edit later.
      </p>
    </div>,

    // Job Titles
    <div key="titles">
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "14px",
            background: "rgba(99,102,241,0.15)",
            border: "1px solid rgba(99,102,241,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            color: "#818cf8",
            fontSize: "18px",
          }}
        >
          <FaBriefcase />
        </div>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "22px",
            color: "var(--color-white)",
            margin: "0 0 8px",
            letterSpacing: "-0.02em",
          }}
        >
          What roles are you looking for?
        </h2>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--color-white-40)", margin: 0 }}>
          We'll alert you whenever these titles appear on company career pages.
        </p>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <p
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "10px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--color-white-40)",
            marginBottom: "10px",
          }}
        >
          Popular picks
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {SUGGESTED_TITLES.map((t) => (
            <TagButton
              key={t}
              label={t}
              active={jobTitles.includes(t)}
              onClick={() => jobTitles.includes(t) ? removeTitle(t) : addTitle(t)}
            />
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTitle()}
          placeholder="Or type a custom title…"
          style={inputStyle}
          onFocus={(e) => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.10)"; }}
          onBlur={(e) => { e.target.style.borderColor = "var(--color-border)"; e.target.style.boxShadow = "none"; }}
        />
        <button
          onClick={() => addTitle()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "10px 18px",
            borderRadius: "10px",
            background: "rgba(99,102,241,0.15)",
            color: "#818cf8",
            border: "1px solid rgba(99,102,241,0.30)",
            cursor: "pointer",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "12px",
            whiteSpace: "nowrap",
          }}
        >
          <FaPlus style={{ fontSize: "10px" }} /> Add
        </button>
      </div>

      {jobTitles.length > 0 && (
        <div style={{ marginTop: "16px" }}>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "10px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--color-white-40)",
              marginBottom: "10px",
            }}
          >
            Selected ({jobTitles.length})
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {jobTitles.map((t) => (
              <Tag key={t} label={t} onRemove={() => removeTitle(t)} />
            ))}
          </div>
        </div>
      )}
    </div>,

    // Skills
    <div key="skills">
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "14px",
            background: "var(--color-orange-dim)",
            border: "1px solid var(--color-orange-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            color: "var(--color-orange)",
            fontSize: "18px",
          }}
        >
          <FaCode />
        </div>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "22px",
            color: "var(--color-white)",
            margin: "0 0 8px",
            letterSpacing: "-0.02em",
          }}
        >
          What are your key skills?
        </h2>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--color-white-40)", margin: 0 }}>
          Jobs matching these skills will rank higher in your alerts.
        </p>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <p
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "10px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--color-white-40)",
            marginBottom: "10px",
          }}
        >
          Popular skills
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {SUGGESTED_SKILLS.map((s) => (
            <TagButton
              key={s}
              label={s}
              active={skills.includes(s)}
              onClick={() => skills.includes(s) ? removeSkill(s) : addSkill(s)}
            />
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <input
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addSkill()}
          placeholder="Or type a custom skill…"
          style={inputStyle}
          onFocus={(e) => { e.target.style.borderColor = "var(--color-orange)"; e.target.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.10)"; }}
          onBlur={(e) => { e.target.style.borderColor = "var(--color-border)"; e.target.style.boxShadow = "none"; }}
        />
        <button
          onClick={() => addSkill()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "10px 18px",
            borderRadius: "10px",
            background: "var(--color-orange-dim)",
            color: "var(--color-orange)",
            border: "1px solid var(--color-orange-border)",
            cursor: "pointer",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "12px",
            whiteSpace: "nowrap",
          }}
        >
          <FaPlus style={{ fontSize: "10px" }} /> Add
        </button>
      </div>

      {skills.length > 0 && (
        <div style={{ marginTop: "16px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {skills.map((s) => <Tag key={s} label={s} onRemove={() => removeSkill(s)} />)}
          </div>
        </div>
      )}
    </div>,

    // Role Types
    <div key="roles">
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "14px",
            background: "rgba(34,197,94,0.12)",
            border: "1px solid rgba(34,197,94,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            color: "#4ade80",
            fontSize: "18px",
          }}
        >
          <FaRocket />
        </div>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "22px",
            color: "var(--color-white)",
            margin: "0 0 8px",
            letterSpacing: "-0.02em",
          }}
        >
          What type of roles suit you?
        </h2>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--color-white-40)", margin: 0 }}>
          We'll filter alerts to match your experience level and work style.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "10px" }}>
        {ROLE_TYPES.map((type) => {
          const active = roleTypes.includes(type);
          return (
            <button
              key={type}
              onClick={() => toggleRole(type)}
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "12px",
                letterSpacing: "0.05em",
                padding: "14px 16px",
                borderRadius: "12px",
                cursor: "pointer",
                transition: "all 0.2s",
                textAlign: "center",
                background: active ? "rgba(34,197,94,0.12)" : "var(--color-surface-3)",
                color: active ? "#4ade80" : "var(--color-white-40)",
                border: active ? "1px solid rgba(34,197,94,0.35)" : "1px solid var(--color-border)",
                boxShadow: active ? "0 0 0 2px rgba(34,197,94,0.08)" : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              {active && <FaCheckCircle style={{ fontSize: "10px" }} />}
              {type}
            </button>
          );
        })}
      </div>

      {roleTypes.length > 0 && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--color-white-40)", textAlign: "center", marginTop: "16px" }}>
          {roleTypes.length} type{roleTypes.length !== 1 ? "s" : ""} selected
        </p>
      )}
    </div>,
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 600px) {
          .onboarding-card { max-width: 100% !important; padding: 28px 20px !important; }
        }
      `}</style>

      {/* Background blobs */}
      <div style={{ position: "fixed", top: "-100px", right: "-100px", width: "360px", height: "360px", background: "radial-gradient(circle, rgba(249,115,22,0.05) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "-80px", left: "-80px", width: "300px", height: "300px", background: "radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />

      <div
        className="onboarding-card"
        style={{
          width: "100%",
          maxWidth: "560px",
          background: "var(--color-surface-1)",
          border: "1px solid var(--color-border)",
          borderRadius: "20px",
          padding: "40px 36px",
          animation: "fadeSlideIn 0.5s ease-out",
        }}
      >
        {/* Logo */}
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "18px",
            letterSpacing: "-0.02em",
            marginBottom: "8px",
            textAlign: "center",
          }}
        >
          Career<span style={{ color: "var(--color-orange)" }}>Forge</span>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "10px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--color-white-40)",
              }}
            >
              Step {step + 1} of {totalSteps}
            </span>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "10px",
                letterSpacing: "0.08em",
                color: "var(--color-orange)",
              }}
            >
              {stepLabels[step]}
            </span>
          </div>
          <div style={{ height: "3px", borderRadius: "999px", background: "var(--color-border)", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                borderRadius: "999px",
                background: "linear-gradient(90deg, var(--color-orange), #f59e0b)",
                width: `${((step + 1) / totalSteps) * 100}%`,
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>

        {/* Step content */}
        <div key={step} style={{ animation: "fadeSlideIn 0.35s ease-out" }}>
          {steps[step]}
        </div>

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "32px", gap: "12px" }}>
          {/* Left */}
          <div>
            {step > 0 ? (
              <button
                onClick={prev}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "13px",
                  color: "var(--color-white-40)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px 0",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-white)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-white-40)")}
              >
                <FaArrowLeft style={{ fontSize: "11px" }} /> Back
              </button>
            ) : (
              <button
                onClick={handleSkip}
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "13px",
                  color: "var(--color-white-40)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px 0",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-white)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-white-40)")}
              >
                Skip for now
              </button>
            )}
          </div>

          {/* Right */}
          <button
            onClick={isLastStep ? handleFinish : next}
            disabled={saving}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "14px",
              color: "#000",
              background: saving ? "var(--color-white-40)" : "var(--color-orange)",
              padding: "12px 28px",
              borderRadius: "10px",
              border: "none",
              cursor: saving ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              boxShadow: "0 2px 12px rgba(249,115,22,0.25)",
            }}
            onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = "var(--color-orange-hover)"; }}
            onMouseLeave={(e) => { if (!saving) e.currentTarget.style.background = "var(--color-orange)"; }}
          >
            {saving
              ? "Saving…"
              : isLastStep
              ? (<>Finish Setup <FaCheckCircle style={{ fontSize: "12px" }} /></>)
              : step === 0
              ? (<>Let&apos;s Go <FaArrowRight style={{ fontSize: "11px" }} /></>)
              : (<>Continue <FaArrowRight style={{ fontSize: "11px" }} /></>)
            }
          </button>
        </div>

        {step > 0 && (
          <div style={{ textAlign: "center", marginTop: "16px" }}>
            <button
              onClick={handleSkip}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "12px",
                color: "var(--color-white-20)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px 0",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-white-40)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-white-20)")}
            >
              Skip and set up later →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
