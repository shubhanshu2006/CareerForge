"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "react-hot-toast";
import AppHeader from "@/components/AppHeader";
import { createApi, unwrap } from "@/lib/api";
import { FaPlus, FaTimes, FaSave } from "react-icons/fa";

const EXPERIENCE_OPTIONS = ["ENTRY", "JUNIOR", "MID", "SENIOR", "LEAD", "EXECUTIVE"];
const LOCATION_PREFS = ["Remote", "Hybrid", "On-site"];

const SUGGESTED_TITLES = [
  "Software Engineer", "Frontend Developer", "Backend Developer",
  "Full Stack Developer", "Data Scientist", "DevOps Engineer",
  "Product Manager", "UI/UX Designer", "Mobile Developer",
];
const SUGGESTED_SKILLS = [
  "JavaScript", "TypeScript", "Python", "React", "Node.js",
  "AWS", "Docker", "SQL", "Git", "Go", "Kubernetes",
];

interface Preferences {
  jobTitles?: string[];
  skills?: string[];
  roleTypes?: string[];
  locations?: string[];
  experienceLevel?: string;
  remoteOnly?: boolean;
  emailEnabled?: boolean;
  alertFrequency?: string;
}

interface PreferencesApiResponse {
  titles?: string[];
  skills?: string[];
  roles?: string[];
  companies?: string[];
  emailEnabled?: boolean;
}

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontWeight: 700,
  fontSize: "10px",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--color-white-40)",
  marginBottom: "10px",
  display: "block",
};

const inputStyle: React.CSSProperties = {
  background: "var(--color-surface-3)",
  border: "1px solid var(--color-border)",
  borderRadius: "10px",
  padding: "11px 16px",
  fontSize: "14px",
  color: "var(--color-white)",
  outline: "none",
  transition: "border-color 0.2s",
  width: "100%",
  boxSizing: "border-box" as const,
};

export default function PreferencesPage() {
  const { getToken, isLoaded } = useAuth();
  const [prefs, setPrefs] = useState<Preferences>({
    jobTitles: [],
    skills: [],
    roleTypes: [],
    locations: [],
    experienceLevel: "",
    remoteOnly: false,
    emailEnabled: true,
    alertFrequency: "INSTANT",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSkill, setNewSkill] = useState("");

  useEffect(() => {
    if (!isLoaded) return;
    const api = createApi(() => getToken());
    (async () => {
      try {
        const data = await unwrap<PreferencesApiResponse>(await api.getPreferences());
        if (data) {
          setPrefs((p) => ({
            ...p,
            jobTitles: data.titles ?? [],
            skills: data.skills ?? [],
            roleTypes: data.roles ?? [],
            emailEnabled: data.emailEnabled ?? p.emailEnabled,
          }));
        }
      } catch { /* user may not have prefs yet */ }
      finally { setLoading(false); }
    })();
  }, [isLoaded]);

  const handleSave = async () => {
    const api = createApi(() => getToken());
    setSaving(true);
    try {
      await unwrap(await api.updatePreferences({
        titles: prefs.jobTitles ?? [],
        skills: prefs.skills ?? [],
        roles: prefs.roleTypes ?? [],
        emailEnabled: prefs.emailEnabled ?? true,
      }));
      toast.success("Preferences saved!");
    } catch {
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const addTitle = (t?: string) => {
    const v = (t ?? newTitle).trim();
    if (v && !prefs.jobTitles?.includes(v)) {
      setPrefs((p) => ({ ...p, jobTitles: [...(p.jobTitles ?? []), v] }));
      setNewTitle("");
    }
  };
  const removeTitle = (t: string) => setPrefs((p) => ({ ...p, jobTitles: (p.jobTitles ?? []).filter((x) => x !== t) }));

  const addSkill = (s?: string) => {
    const v = (s ?? newSkill).trim();
    if (v && !prefs.skills?.includes(v)) {
      setPrefs((p) => ({ ...p, skills: [...(p.skills ?? []), v] }));
      setNewSkill("");
    }
  };
  const removeSkill = (s: string) => setPrefs((p) => ({ ...p, skills: (p.skills ?? []).filter((x) => x !== s) }));

  const toggleLocation = (l: string) =>
    setPrefs((p) => ({
      ...p,
      locations: (p.locations ?? []).includes(l)
        ? (p.locations ?? []).filter((x) => x !== l)
        : [...(p.locations ?? []), l],
    }));

  const Tag = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
    <span style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "11px", letterSpacing: "0.06em", background: "var(--color-orange-dim)", color: "var(--color-orange)", border: "1px solid var(--color-orange-border)", padding: "4px 10px 4px 12px", borderRadius: "999px" }}>
      {label}
      <button onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(249,115,22,0.6)", fontSize: "10px", display: "flex", alignItems: "center", padding: 0 }}><FaTimes /></button>
    </span>
  );

  const SuggestTag = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button onClick={onClick} style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "11px", padding: "5px 12px", borderRadius: "999px", cursor: "pointer", transition: "all 0.2s", background: active ? "var(--color-orange-dim)" : "var(--color-surface-3)", color: active ? "var(--color-orange)" : "var(--color-white-40)", border: active ? "1px solid var(--color-orange-border)" : "1px solid var(--color-border)" }}>
      {label}
    </button>
  );

  if (loading) return (
    <>
      <AppHeader />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "50%", border: "3px solid var(--color-border)", borderTopColor: "var(--color-orange)", animation: "spin 0.7s linear infinite" }} />
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );

  const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: "16px", padding: "24px", marginBottom: "20px" }}>
      <h2 style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "16px", color: "var(--color-white)", margin: "0 0 20px", letterSpacing: "-0.015em" }}>{title}</h2>
      {children}
    </div>
  );

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <AppHeader left={<span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--color-white-65)" }}>Preferences</span>} />

      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto", padding: "32px", boxSizing: "border-box" }}>

          <div style={{ marginBottom: "28px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h1 style={{ fontFamily: "var(--font-body)", fontWeight: 800, fontSize: "clamp(22px, 3vw, 28px)", letterSpacing: "-0.025em", color: "var(--color-white)", margin: "0 0 6px" }}>Job Preferences</h1>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--color-white-40)", margin: 0 }}>Tell us what you're looking for to get better alerts.</p>
            </div>
            <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ gap: "8px" }}>
              <FaSave style={{ fontSize: "12px" }} />
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>

          {/* Job Titles */}
          <SectionCard title="Preferred Job Titles">
            <span style={labelStyle}>Suggestions</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }}>
              {SUGGESTED_TITLES.map((t) => (
                <SuggestTag
                  key={t} label={t}
                  active={(prefs.jobTitles ?? []).includes(t)}
                  onClick={() => (prefs.jobTitles ?? []).includes(t) ? removeTitle(t) : addTitle(t)}
                />
              ))}
            </div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
              <input
                style={inputStyle}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTitle()}
                placeholder="Add custom title…"
                onFocus={(e) => (e.target.style.borderColor = "var(--color-orange)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
              />
              <button onClick={() => addTitle()} className="btn-ghost" style={{ flexShrink: 0, gap: "5px" }}>
                <FaPlus style={{ fontSize: "10px" }} /> Add
              </button>
            </div>
            {(prefs.jobTitles ?? []).length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {(prefs.jobTitles ?? []).map((t) => <Tag key={t} label={t} onRemove={() => removeTitle(t)} />)}
              </div>
            )}
          </SectionCard>

          {/* Skills */}
          <SectionCard title="Key Skills">
            <span style={labelStyle}>Suggestions</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }}>
              {SUGGESTED_SKILLS.map((s) => (
                <SuggestTag
                  key={s} label={s}
                  active={(prefs.skills ?? []).includes(s)}
                  onClick={() => (prefs.skills ?? []).includes(s) ? removeSkill(s) : addSkill(s)}
                />
              ))}
            </div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
              <input
                style={inputStyle}
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSkill()}
                placeholder="Add custom skill…"
                onFocus={(e) => (e.target.style.borderColor = "var(--color-orange)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
              />
              <button onClick={() => addSkill()} className="btn-ghost" style={{ flexShrink: 0, gap: "5px" }}>
                <FaPlus style={{ fontSize: "10px" }} /> Add
              </button>
            </div>
            {(prefs.skills ?? []).length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {(prefs.skills ?? []).map((s) => <Tag key={s} label={s} onRemove={() => removeSkill(s)} />)}
              </div>
            )}
          </SectionCard>

          {/* Location only — experience level removed */}
          <SectionCard title="Work Style">
            <div>
              <span style={labelStyle}>Preferred Locations</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                {LOCATION_PREFS.map((loc) => (
                  <label key={loc} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={(prefs.locations ?? []).includes(loc)}
                      onChange={() => toggleLocation(loc)}
                      style={{ accentColor: "var(--color-orange)", width: "16px", height: "16px" }}
                    />
                    <span style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: "13px", color: "var(--color-white-65)" }}>
                      {loc}
                    </span>
                  </label>
                ))}
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={prefs.remoteOnly ?? false}
                  onChange={(e) => setPrefs((p) => ({ ...p, remoteOnly: e.target.checked }))}
                  style={{ accentColor: "var(--color-orange)", width: "16px", height: "16px" }}
                />
                <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "13px", color: "var(--color-white-65)" }}>
                  Show remote positions only
                </span>
              </label>
            </div>
          </SectionCard>

          {/* Notifications */}
          <SectionCard title="Alert Settings">
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                <div>
                  <p style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "14px", color: "var(--color-white)", margin: 0 }}>
                    Email Alerts
                  </p>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--color-white-40)", margin: "3px 0 0" }}>
                    Receive email notifications for matching job alerts
                  </p>
                </div>
                <div
                  onClick={() => setPrefs((p) => ({ ...p, emailEnabled: !p.emailEnabled }))}
                  style={{
                    width: "44px", height: "24px", borderRadius: "999px",
                    background: prefs.emailEnabled ? "var(--color-orange)" : "var(--color-surface-3)",
                    border: "1px solid var(--color-border)",
                    cursor: "pointer",
                    position: "relative",
                    transition: "background 0.2s",
                    flexShrink: 0,
                  }}
                >
                  <div style={{ position: "absolute", top: "2px", left: prefs.emailEnabled ? "22px" : "2px", width: "18px", height: "18px", borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
                </div>
              </label>

              <div>
                <span style={labelStyle}>Alert Frequency</span>
                <div style={{ display: "flex", gap: "8px" }}>
                  {["INSTANT", "DAILY", "WEEKLY"].map((freq) => (
                    <button
                      key={freq}
                      onClick={() => setPrefs((p) => ({ ...p, alertFrequency: freq }))}
                      style={{
                        fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "12px",
                        padding: "9px 16px", borderRadius: "8px", cursor: "pointer", transition: "all 0.2s",
                        background: prefs.alertFrequency === freq ? "var(--color-orange-dim)" : "var(--color-surface-3)",
                        color: prefs.alertFrequency === freq ? "var(--color-orange)" : "var(--color-white-40)",
                        border: prefs.alertFrequency === freq ? "1px solid var(--color-orange-border)" : "1px solid var(--color-border)",
                      }}
                    >
                      {freq.charAt(0) + freq.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Save button footer */}
          <div style={{ textAlign: "right" }}>
            <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ gap: "8px" }}>
              <FaSave style={{ fontSize: "12px" }} />
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
