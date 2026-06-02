"use client";

import React, { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { toast } from "react-hot-toast";
import AppHeader from "@/components/AppHeader";
import { createApi, unwrap } from "@/lib/api";
import { FaPlus, FaTimes, FaSave, FaGithub, FaLinkedin, FaGlobe, FaTwitter } from "react-icons/fa";

interface Profile {
  firstName?: string;
  lastName?: string;
  bio?: string;
  phone?: string;
  skills?: string[];
  socialLinks?: { github?: string; linkedin?: string; website?: string; twitter?: string };
}

interface ProfileApiResponse {
  profile?: {
    name?: string | null;
    yearsOfExperience?: number | null;
    currentLocation?: string | null;
  };
  socialLinks?: Array<{ platform: string; url: string }>;
  skills?: string[];
}

const SUGGESTED_SKILLS = [
  "JavaScript", "TypeScript", "Python", "React", "Node.js",
  "AWS", "Docker", "SQL", "Git", "Go", "Java", "C++",
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--color-surface-3)",
  border: "1px solid var(--color-border)",
  borderRadius: "10px",
  padding: "11px 16px",
  fontSize: "14px",
  color: "var(--color-white)",
  outline: "none",
  transition: "border-color 0.2s",
  boxSizing: "border-box" as const,
};

export default function ProfilePage() {
  const { getToken, isLoaded } = useAuth();
  const { user } = useUser();

  const [profile, setProfile] = useState<Profile>({
    firstName: "", lastName: "", bio: "", phone: "",
    skills: [],
    socialLinks: { github: "", linkedin: "", website: "", twitter: "" },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingLinks, setSavingLinks] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [addingSkill, setAddingSkill] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    const api = createApi(() => getToken());
    (async () => {
      try {
        const data = await unwrap<ProfileApiResponse>(await api.getProfile());
        if (data) {
          const fullName = (data.profile?.name ?? "").trim();
          const [firstName = "", ...rest] = fullName.split(/\s+/);
          const lastName = rest.join(" ");
          const links = Object.fromEntries(
            (data.socialLinks ?? []).map((item) => [item.platform.toLowerCase(), item.url]),
          ) as Record<string, string>;

          setProfile((p) => ({
            ...p,
            firstName,
            lastName,
            socialLinks: {
              ...p.socialLinks,
              github: links.github ?? p.socialLinks?.github ?? "",
              linkedin: links.linkedin ?? p.socialLinks?.linkedin ?? "",
              website: links.portfolio ?? p.socialLinks?.website ?? "",
              twitter: links.x ?? p.socialLinks?.twitter ?? "",
            },
            skills: data.skills ?? [],
          }));
        }
      } catch { /* first time user */ }
      finally { setLoading(false); }
    })();
  }, [isLoaded]);

  const handleSaveProfile = async () => {
    const api = createApi(() => getToken());
    setSaving(true);
    try {
      const name = `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim();
      if (!name) {
        toast.error("Please add first or last name before saving.");
        return;
      }
      await unwrap(await api.updateProfile({ name }));
      toast.success("Profile saved!");
    } catch { toast.error("Failed to save profile"); }
    finally { setSaving(false); }
  };

  const handleSaveSocialLinks = async () => {
    const api = createApi(() => getToken());
    setSavingLinks(true);
    try {
      const raw = profile.socialLinks ?? {};
      const links = [
        raw.github ? { platform: "GITHUB", url: raw.github.trim() } : null,
        raw.linkedin ? { platform: "LINKEDIN", url: raw.linkedin.trim() } : null,
        raw.website ? { platform: "PORTFOLIO", url: raw.website.trim() } : null,
        raw.twitter ? { platform: "X", url: raw.twitter.trim() } : null,
      ].filter((item): item is { platform: string; url: string } => Boolean(item && item.url));

      await unwrap(await api.updateSocialLinks({ links }));
      toast.success("Social links saved!");
    } catch { toast.error("Failed to save links"); }
    finally { setSavingLinks(false); }
  };

  const handleAddSkill = async () => {
    const v = newSkill.trim();
    if (!v || (profile.skills ?? []).includes(v)) return;
    const api = createApi(() => getToken());
    setAddingSkill(true);
    try {
      await unwrap(await api.addSkill(v));
      setProfile((p) => ({ ...p, skills: [...(p.skills ?? []), v] }));
      setNewSkill("");
      toast.success(`Skill "${v}" added`);
    } catch { toast.error("Failed to add skill"); }
    finally { setAddingSkill(false); }
  };

  const handleRemoveSkill = async (skill: string) => {
    const api = createApi(() => getToken());
    try {
      await unwrap(await api.removeSkill(skill));
      setProfile((p) => ({ ...p, skills: (p.skills ?? []).filter((s) => s !== skill) }));
      toast.success(`Skill "${skill}" removed`);
    } catch { toast.error("Failed to remove skill"); }
  };

  const name = user?.fullName ?? user?.firstName ?? "User";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const avatarUrl = user?.imageUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f97316&color=000&bold=true&size=80`;

  if (loading) return (
    <>
      <AppHeader />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "50%", border: "3px solid var(--color-border)", borderTopColor: "var(--color-orange)", animation: "spin 0.7s linear infinite" }} />
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );

  const SectionCard = ({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) => (
    <div style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: "16px", padding: "24px", marginBottom: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <h2 style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "16px", color: "var(--color-white)", margin: 0, letterSpacing: "-0.015em" }}>{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );

  const FieldLabel = ({ label }: { label: string }) => (
    <label style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-white-40)", display: "block", marginBottom: "6px" }}>
      {label}
    </label>
  );

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <AppHeader left={<span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--color-white-65)" }}>Profile</span>} />

      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto", padding: "32px", boxSizing: "border-box" }}>

          <h1 style={{ fontFamily: "var(--font-body)", fontWeight: 800, fontSize: "clamp(22px, 3vw, 28px)", letterSpacing: "-0.025em", color: "var(--color-white)", margin: "0 0 24px" }}>
            Profile
          </h1>

          {/* Identity card (Clerk managed) */}
          <div style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: "16px", padding: "24px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "20px" }}>
            <img
              src={avatarUrl}
              alt={name}
              style={{ width: "72px", height: "72px", borderRadius: "50%", border: "3px solid var(--color-orange-border)", objectFit: "cover", flexShrink: 0 }}
            />
            <div>
              <p style={{ fontFamily: "var(--font-body)", fontWeight: 800, fontSize: "20px", color: "var(--color-white)", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
                {name}
              </p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--color-white-40)", margin: "0 0 8px" }}>
                {email}
              </p>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.1em", color: "var(--color-white-40)", background: "var(--color-surface-3)", border: "1px solid var(--color-border)", padding: "2px 8px", borderRadius: "999px" }}>
                Managed by Clerk
              </span>
            </div>
          </div>

          {/* Basic info */}
          <SectionCard
            title="Basic Information"
            action={
              <button onClick={handleSaveProfile} disabled={saving} className="btn-primary" style={{ gap: "6px", fontSize: "12px", padding: "8px 16px" }}>
                <FaSave style={{ fontSize: "11px" }} />
                {saving ? "Saving…" : "Save"}
              </button>
            }
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div>
                <FieldLabel label="First Name" />
                <input
                  style={inputStyle}
                  value={profile.firstName ?? ""}
                  onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))}
                  placeholder="First name"
                  onFocus={(e) => (e.target.style.borderColor = "var(--color-orange)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
                />
              </div>
              <div>
                <FieldLabel label="Last Name" />
                <input
                  style={inputStyle}
                  value={profile.lastName ?? ""}
                  onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))}
                  placeholder="Last name"
                  onFocus={(e) => (e.target.style.borderColor = "var(--color-orange)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
                />
              </div>
            </div>
            <div style={{ marginBottom: "16px" }}>
              <FieldLabel label="Phone" />
              <input
                style={inputStyle}
                type="tel"
                value={profile.phone ?? ""}
                onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+1 (555) 000-0000"
                onFocus={(e) => (e.target.style.borderColor = "var(--color-orange)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
              />
            </div>
            <div>
              <FieldLabel label="Bio" />
              <textarea
                style={{ ...inputStyle, resize: "vertical", minHeight: "90px", lineHeight: 1.6 } as React.CSSProperties}
                value={profile.bio ?? ""}
                onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                placeholder="A short bio about yourself…"
                onFocus={(e) => (e.target.style.borderColor = "var(--color-orange)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
              />
            </div>
          </SectionCard>

          {/* Skills */}
          <SectionCard title="Skills">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }}>
              {SUGGESTED_SKILLS.map((s) => (
                <button
                  key={s}
                  onClick={() => (profile.skills ?? []).includes(s) ? handleRemoveSkill(s) : (setNewSkill(s), setTimeout(() => handleAddSkill(), 0))}
                  style={{
                    fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "11px", padding: "5px 12px", borderRadius: "999px", cursor: "pointer", transition: "all 0.2s",
                    background: (profile.skills ?? []).includes(s) ? "var(--color-orange-dim)" : "var(--color-surface-3)",
                    color: (profile.skills ?? []).includes(s) ? "var(--color-orange)" : "var(--color-white-40)",
                    border: (profile.skills ?? []).includes(s) ? "1px solid var(--color-orange-border)" : "1px solid var(--color-border)",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <input
                style={inputStyle}
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddSkill()}
                placeholder="Add a custom skill…"
                onFocus={(e) => (e.target.style.borderColor = "var(--color-orange)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
              />
              <button onClick={handleAddSkill} disabled={addingSkill} className="btn-ghost" style={{ flexShrink: 0, gap: "5px" }}>
                <FaPlus style={{ fontSize: "10px" }} /> Add
              </button>
            </div>

            {(profile.skills ?? []).length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {(profile.skills ?? []).map((s) => (
                  <span key={s} style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "11px", background: "var(--color-orange-dim)", color: "var(--color-orange)", border: "1px solid var(--color-orange-border)", padding: "4px 10px 4px 12px", borderRadius: "999px" }}>
                    {s}
                    <button onClick={() => handleRemoveSkill(s)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(249,115,22,0.6)", fontSize: "10px", display: "flex", alignItems: "center", padding: 0 }}>
                      <FaTimes />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Social Links */}
          <SectionCard
            title="Social Links"
            action={
              <button onClick={handleSaveSocialLinks} disabled={savingLinks} className="btn-primary" style={{ gap: "6px", fontSize: "12px", padding: "8px 16px" }}>
                <FaSave style={{ fontSize: "11px" }} />
                {savingLinks ? "Saving…" : "Save"}
              </button>
            }
          >
            {[
              { key: "github",   label: "GitHub",   icon: <FaGithub />,   placeholder: "https://github.com/username" },
              { key: "linkedin", label: "LinkedIn",  icon: <FaLinkedin />, placeholder: "https://linkedin.com/in/username" },
              { key: "website",  label: "Website",  icon: <FaGlobe />,    placeholder: "https://yourwebsite.com" },
              { key: "twitter",  label: "Twitter",  icon: <FaTwitter />,  placeholder: "https://twitter.com/username" },
            ].map((link) => (
              <div key={link.key} style={{ marginBottom: "14px" }}>
                <FieldLabel label={link.label} />
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--color-white-40)", fontSize: "14px" }}>
                    {link.icon}
                  </span>
                  <input
                    style={{ ...inputStyle, paddingLeft: "42px" }}
                    type="url"
                    value={(profile.socialLinks as Record<string, string>)?.[link.key] ?? ""}
                    onChange={(e) => setProfile((p) => ({ ...p, socialLinks: { ...p.socialLinks, [link.key]: e.target.value } }))}
                    placeholder={link.placeholder}
                    onFocus={(e) => (e.target.style.borderColor = "var(--color-orange)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
                  />
                </div>
              </div>
            ))}
          </SectionCard>
        </div>
      </div>
    </>
  );
}
