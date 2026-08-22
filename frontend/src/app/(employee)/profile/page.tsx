"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { generatePayslip, type SalaryBreakdown } from "@/utils/generatePayslip";
import SalaryEditor from "@/components/admin/SalaryEditor";
import { YuIcon } from "@/components/ui/YuIcons";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfile {
  id: string;
  companyId: string;
  loginId: string;
  name: string;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  maritalStatus: string | null;
  personalEmail: string | null;
  panCode: string | null;
  uanCode: string | null;
  accountNumber: string | null;
  homeAddress: string | null;
  role: "ADMIN" | "EMPLOYEE";
  department: string | null;
  jobTitle: string | null;
  managerId: string | null;
  profilePictureUrl: string | null;
  joiningDate: string;
  about: string | null;
  skills: string[];
  certifications: string[];
  interests: string[];
  mustChangePassword: boolean;
}

interface PrivateFields {
  personalEmail: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  panCode: string;
  uanCode: string;
  accountNumber: string;
  homeAddress: string;
}

const EMPTY_PRIVATE: PrivateFields = {
  personalEmail: "",
  dateOfBirth: "",
  gender: "",
  maritalStatus: "",
  panCode: "",
  uanCode: "",
  accountNumber: "",
  homeAddress: "",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toArray(raw: string): string[] {
  return raw.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
}

function toString(arr: string[]): string {
  return arr.join(", ");
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function extractError(err: unknown): string {
  return (
    (err as { response?: { data?: { error?: string } } })?.response?.data
      ?.error ?? "Something went wrong. Please try again."
  );
}

// ─── Shared micro-components ─────────────────────────────────────────────────

function Spinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const cls = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" }[size];
  return (
    <svg className={`animate-spin ${cls} text-primary`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

function ReadonlyField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-label-caps text-secondary mb-1">
        {label}
      </p>
      <p className="text-body-regular text-primary">{value || "—"}</p>
    </div>
  );
}

function Field({
  label, id, type = "text", value, onChange, placeholder, rows,
}: {
  label: string; id: string; type?: string;
  value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number;
}) {
  const baseClass =
    "w-full px-3 py-2 rounded-[8px] bg-field border border-[var(--border-default)] text-body-regular text-primary " +
    "placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--border-strong)] transition-all";

  return (
    <div>
      <label htmlFor={id} className="block text-body-medium text-secondary mb-1.5">
        {label}
      </label>
      {rows ? (
        <textarea id={id} rows={rows} value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${baseClass} resize-none`} />
      ) : (
        <input id={id} type={type} value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={baseClass} />
      )}
    </div>
  );
}

function SelectField({
  label, id, value, onChange, options,
}: {
  label: string; id: string; value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-body-medium text-secondary mb-1.5">
        {label}
      </label>
      <select
        id={id} value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-[8px] bg-field border border-[var(--border-default)] text-body-regular text-primary focus:outline-none focus:border-[var(--border-strong)] transition-all appearance-none"
      >
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-label-caps text-secondary mb-3 px-1">
        {title}
      </h2>
      <div className="bg-field-on-canvas border border-[var(--border-default)] rounded-[12px] p-6">
        {children}
      </div>
    </section>
  );
}

function Feedback({ error, success }: { error: string | null; success: string | null }) {
  if (error) {
    return (
      <div className="flex items-start gap-2.5 rounded-[8px] px-4 py-3 text-body-regular" style={{ backgroundColor: "var(--red-50)", color: "var(--red-700)" }}>
        <YuIcon name="info-circle" width={16} height={16} className="mt-0.5 shrink-0 text-current" />
        {error}
      </div>
    );
  }
  if (success) {
    return (
      <div className="flex items-center gap-2.5 rounded-[8px] px-4 py-3 text-body-regular" style={{ backgroundColor: "var(--green-50)", color: "var(--green-700)" }}>
        <YuIcon name="check" width={16} height={16} className="shrink-0 text-current" />
        {success}
      </div>
    );
  }
  return null;
}

function SaveBtn({ busy, label = "Save changes" }: { busy: boolean; label?: string }) {
  return (
    <button type="submit" disabled={busy}
      className="px-5 py-2.5 rounded-[10px] text-body-medium font-semibold text-on-primary bg-primary hover:opacity-90 active:opacity-100 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-sm">
      {busy && <Spinner size="sm" />}
      {busy ? "Saving…" : label}
    </button>
  );
}

function strengthOf(pw: string) {
  if (!pw) return { label: "", pct: 0, color: "bg-field" };
  if (pw.length < 6) return { label: "Too short", pct: 15, color: "bg-red-500" };
  if (pw.length < 8)  return { label: "Weak",      pct: 30, color: "bg-amber-400" };
  const score = [/[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  if (score === 3) return { label: "Strong", pct: 100, color: "bg-green-500" };
  if (score === 2) return { label: "Good",   pct: 70,  color: "bg-primary" };
  return               { label: "Fair",   pct: 50,  color: "bg-amber-400" };
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user: authUser, setUser: setAuthUser } = useAuth();

  const [profile, setProfile]         = useState<UserProfile | null>(null);
  const [managerName, setManagerName] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError]     = useState<string | null>(null);
  const [salaryData, setSalaryData]   = useState<SalaryBreakdown | null>(null);

  const isAdmin = authUser?.role === "ADMIN";
  type TabId = "resume" | "private" | "security" | "salary";
  const TABS: { id: TabId; label: string }[] = [
    { id: "resume",  label: "Resume"       },
    { id: "private", label: "Private Info" },
    { id: isAdmin ? "salary" : "security", label: isAdmin ? "Salary Info" : "Security" },
  ];
  const [activeTab, setActiveTab] = useState<TabId>("resume");

  const [about,         setAbout]         = useState("");
  const [skills,        setSkills]        = useState("");
  const [certifications, setCertifications] = useState("");
  const [interests,     setInterests]     = useState("");
  const [resumeBusy,    setResumeBusy]    = useState(false);
  const [resumeErr,     setResumeErr]     = useState<string | null>(null);
  const [resumeOk,      setResumeOk]      = useState<string | null>(null);

  const [phone,             setPhone]             = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [priv, setPriv] = useState<PrivateFields>(EMPTY_PRIVATE);
  const [privateBusy, setPrivateBusy] = useState(false);
  const [privateErr,  setPrivateErr]  = useState<string | null>(null);
  const [privateOk,   setPrivateOk]   = useState<string | null>(null);

  const [curPw,      setCurPw]      = useState("");
  const [newPw,      setNewPw]      = useState("");
  const [confirmPw,  setConfirmPw]  = useState("");
  const [secBusy,    setSecBusy]    = useState(false);
  const [secErr,     setSecErr]     = useState<string | null>(null);
  const [secOk,      setSecOk]      = useState<string | null>(null);
  const strength = strengthOf(newPw);

  useEffect(() => { if (!resumeOk)  return; const t = setTimeout(() => setResumeOk(null),  4000); return () => clearTimeout(t); }, [resumeOk]);
  useEffect(() => { if (!privateOk) return; const t = setTimeout(() => setPrivateOk(null), 4000); return () => clearTimeout(t); }, [privateOk]);
  useEffect(() => { if (!secOk)     return; const t = setTimeout(() => setSecOk(null),     4000); return () => clearTimeout(t); }, [secOk]);

  const fetchProfile = useCallback(async () => {
    setPageLoading(true);
    setPageError(null);
    try {
      const { data } = await api.get<{ user: UserProfile }>("/users/me");
      const p = data.user;
      setProfile(p);

      setAbout(p.about ?? "");
      setSkills(toString(p.skills));
      setCertifications(toString(p.certifications));
      setInterests(toString(p.interests));
      setPhone(p.phone ?? "");
      setProfilePictureUrl(p.profilePictureUrl ?? "");
      setPriv({
        personalEmail: p.personalEmail ?? "",
        dateOfBirth: p.dateOfBirth?.slice(0, 10) ?? "",
        gender: p.gender ?? "",
        maritalStatus: p.maritalStatus ?? "",
        panCode: p.panCode ?? "",
        uanCode: p.uanCode ?? "",
        accountNumber: p.accountNumber ?? "",
        homeAddress: p.homeAddress ?? "",
      });

      if (p.managerId) {
        try {
          const { data: mgr } = await api.get<{ employee: { name: string } }>(`/employees/${p.managerId}`);
          setManagerName(mgr.employee.name);
        } catch {
          setManagerName(null);
        }
      }

      try {
        const { data: salaryRes } = await api.get<{ success: boolean; data: { breakdown: SalaryBreakdown }; }>(`/salary/${p.id}`);
        if (salaryRes.success) {
          setSalaryData(salaryRes.data.breakdown);
        }
      } catch {}
    } catch {
      setPageError("Failed to load profile. Please refresh the page.");
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  async function handleResumeSave(e: React.FormEvent) {
    e.preventDefault();
    setResumeErr(null);
    setResumeBusy(true);
    try {
      const { data } = await api.put<{ user: UserProfile }>("/users/me", {
        about: about.trim() || undefined,
        skills:         toArray(skills),
        certifications: toArray(certifications),
        interests:      toArray(interests),
      });
      const p = data.user;
      setProfile((prev) => (prev ? { ...prev, about: p.about, skills: p.skills, certifications: p.certifications, interests: p.interests } : prev));
      setAbout(p.about ?? "");
      setSkills(toString(p.skills));
      setCertifications(toString(p.certifications));
      setInterests(toString(p.interests));
      setResumeOk("Resume saved.");
    } catch (err) {
      setResumeErr(extractError(err));
    } finally {
      setResumeBusy(false);
    }
  }

  async function handlePrivateSave(e: React.FormEvent) {
    e.preventDefault();
    setPrivateErr(null);
    setPrivateBusy(true);
    try {
      const { data } = await api.put<{ user: UserProfile }>("/users/me", {
        phone:             phone.trim() || undefined,
        profilePictureUrl: profilePictureUrl.trim() || undefined,
        personalEmail: priv.personalEmail.trim() || undefined,
        dateOfBirth: priv.dateOfBirth || undefined,
        gender: priv.gender || undefined,
        maritalStatus: priv.maritalStatus || undefined,
        panCode: priv.panCode.trim() || undefined,
        uanCode: priv.uanCode.trim() || undefined,
        accountNumber: priv.accountNumber.trim() || undefined,
        homeAddress: priv.homeAddress.trim() || undefined,
      });
      const p = data.user;
      setProfile(p);
      setPhone(p.phone ?? "");
      setProfilePictureUrl(p.profilePictureUrl ?? "");
      setPriv({
        personalEmail: p.personalEmail ?? "",
        dateOfBirth: p.dateOfBirth?.slice(0, 10) ?? "",
        gender: p.gender ?? "",
        maritalStatus: p.maritalStatus ?? "",
        panCode: p.panCode ?? "",
        uanCode: p.uanCode ?? "",
        accountNumber: p.accountNumber ?? "",
        homeAddress: p.homeAddress ?? "",
      });
      if (authUser) setAuthUser({ ...authUser, profilePictureUrl: p.profilePictureUrl ?? undefined });
      setPrivateOk("Private info saved.");
    } catch (err) {
      setPrivateErr(extractError(err));
    } finally {
      setPrivateBusy(false);
    }
  }

  async function handleSecuritySave(e: React.FormEvent) {
    e.preventDefault();
    setSecErr(null);
    if (newPw.length < 8)       { setSecErr("New password must be at least 8 characters."); return; }
    if (newPw !== confirmPw)     { setSecErr("Passwords do not match."); return; }
    if (newPw === curPw)         { setSecErr("New password must differ from current."); return; }
    setSecBusy(true);
    try {
      await api.put("/auth/change-password", { currentPassword: curPw, newPassword: newPw });
      setCurPw(""); setNewPw(""); setConfirmPw("");
      setSecOk("Password changed successfully.");
    } catch (err) {
      setSecErr(extractError(err));
    } finally {
      setSecBusy(false);
    }
  }

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (pageError || !profile) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)] px-4">
        <div className="rounded-[8px] px-6 py-4 text-body-regular text-center max-w-sm" style={{ backgroundColor: "var(--red-50)", color: "var(--red-700)" }}>
          {pageError ?? "Profile not found."}
        </div>
      </div>
    );
  }

  const initials = profile.name.charAt(0).toUpperCase();

  return (
    <div className="max-w-4xl mx-auto px-6 sm:px-8 py-10 pb-[100px]">

      {/* ── Profile header ── */}
      <div className="bg-field border border-[var(--border-default)] rounded-[16px] p-8 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 shadow-sm">
        <div className="w-[88px] h-[88px] rounded-[16px] bg-primary flex items-center justify-center overflow-hidden shrink-0 shadow-md">
          {profile.profilePictureUrl ? (
            <Image src={profile.profilePictureUrl} alt={profile.name}
              width={88} height={88} unoptimized
              className="w-full h-full object-cover" />
          ) : (
            <span className="text-[32px] font-bold text-on-primary select-none">{initials}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-3">
              <h1 className="text-[24px] leading-tight font-semibold text-primary truncate">{profile.name}</h1>
              <span className="inline-flex items-center justify-center rounded-[7px] text-label-caps" style={{ height: "23px", padding: "0 8px", backgroundColor: "white", color: "var(--primary)", border: "1px solid var(--border-strong)" }}>
                {profile.role}
              </span>
            </div>
            {salaryData && (
              <button
                onClick={() => generatePayslip(profile, salaryData)}
                className="flex items-center justify-center rounded-[10px] bg-field-on-canvas text-secondary whitespace-nowrap" style={{ height: "36px", padding: "0 12px 0 8px", gap: "8px" }}
                title="Download this month's payslip"
              >
                <YuIcon name="download-cloud-01" width={16} height={16} />
                <span className="text-body-medium font-semibold">Payslip</span>
              </button>
            )}
          </div>
          <p className="text-body-regular text-secondary">
            {[profile.jobTitle, profile.department].filter(Boolean).join(" · ") || "No title set"}
          </p>
          <p className="text-body-regular text-tertiary mt-1 font-mono">{profile.loginId}</p>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-2 mb-8 border-b border-[var(--border-default)] pb-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-[8px] text-body-medium font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-primary text-on-primary shadow-sm"
                : "text-secondary hover:bg-field"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ════════ RESUME TAB ════════ */}
      {activeTab === "resume" && (
        <form onSubmit={handleResumeSave} className="space-y-6 max-w-2xl">
          <SectionCard title="About">
            <Field id="about" label="About" rows={4} value={about} onChange={setAbout} placeholder="Tell your colleagues a bit about yourself…" />
          </SectionCard>
          <SectionCard title="Skills">
            <Field id="skills" label="Skills (comma-separated)" rows={2} value={skills} onChange={setSkills} placeholder="e.g. React, TypeScript, Node.js" />
            {toArray(skills).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {toArray(skills).map((s, i) => (
                  <span key={i} className="inline-flex items-center justify-center rounded-[7px] text-label-score" style={{ height: "26px", padding: "4px 6px", backgroundColor: "var(--bg-canvas)", color: "var(--text-secondary)" }}>
                    {s}
                  </span>
                ))}
              </div>
            )}
          </SectionCard>
          <SectionCard title="Certifications">
            <Field id="certifications" label="Certifications (comma-separated)" rows={2} value={certifications} onChange={setCertifications} placeholder="e.g. AWS Solutions Architect, PMP" />
          </SectionCard>
          <SectionCard title="Interests">
            <Field id="interests" label="What I love about my job / Interests (comma-separated)" rows={2} value={interests} onChange={setInterests} placeholder="e.g. Building products, mentoring, open source" />
          </SectionCard>
          <Feedback error={resumeErr} success={resumeOk} />
          <div className="flex justify-end mt-4">
            <SaveBtn busy={resumeBusy} />
          </div>
        </form>
      )}

      {/* ════════ PRIVATE INFO TAB ════════ */}
      {activeTab === "private" && (
        <form onSubmit={handlePrivateSave} className="space-y-6">
          <SectionCard title="Work Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
              <ReadonlyField label="Employee ID" value={profile.loginId} />
              <ReadonlyField label="Work Email" value={profile.email} />
              <ReadonlyField label="Department" value={profile.department} />
              <ReadonlyField label="Job Title" value={profile.jobTitle} />
              <ReadonlyField label="Date of Joining" value={fmtDate(profile.joiningDate)} />
              <ReadonlyField label="Reporting Manager" value={profile.managerId ? managerName ?? "Loading…" : "—"} />
              <ReadonlyField label="Role" value={profile.role} />
            </div>
          </SectionCard>
          <SectionCard title="Personal Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Field id="phone" label="Phone Number" type="tel" value={phone} onChange={setPhone} placeholder="+91 98765 43210" />
              <Field id="personalEmail" label="Personal Email" type="email" value={priv.personalEmail} onChange={(v) => setPriv((p) => ({ ...p, personalEmail: v }))} placeholder="personal@gmail.com" />
              <Field id="dateOfBirth" label="Date of Birth" type="date" value={priv.dateOfBirth} onChange={(v) => setPriv((p) => ({ ...p, dateOfBirth: v }))} />
              <SelectField id="gender" label="Gender" value={priv.gender} onChange={(v) => setPriv((p) => ({ ...p, gender: v }))} options={[{ value: "Male", label: "Male" }, { value: "Female", label: "Female" }, { value: "Other", label: "Other" }, { value: "Prefer not to say", label: "Prefer not to say" }]} />
              <SelectField id="maritalStatus" label="Marital Status" value={priv.maritalStatus} onChange={(v) => setPriv((p) => ({ ...p, maritalStatus: v }))} options={[{ value: "Single", label: "Single" }, { value: "Married", label: "Married" }, { value: "Other", label: "Other" }]} />
            </div>
          </SectionCard>
          <SectionCard title="Official Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Field id="panCode" label="PAN Code" value={priv.panCode} onChange={(v) => setPriv((p) => ({ ...p, panCode: v.toUpperCase() }))} placeholder="ABCDE1234F" />
              <Field id="uanCode" label="UAN Code" value={priv.uanCode} onChange={(v) => setPriv((p) => ({ ...p, uanCode: v }))} placeholder="100000000000" />
              <Field id="accountNumber" label="Bank Account Number" value={priv.accountNumber} onChange={(v) => setPriv((p) => ({ ...p, accountNumber: v }))} placeholder="XXXX XXXX XXXX XXXX" />
            </div>
          </SectionCard>
          <SectionCard title="Address">
            <Field id="homeAddress" label="Home Address" rows={3} value={priv.homeAddress} onChange={(v) => setPriv((p) => ({ ...p, homeAddress: v }))} placeholder="Street, City, State — PIN Code" />
          </SectionCard>
          <SectionCard title="Profile Picture">
            <Field id="profilePictureUrl" label="Photo URL" value={profilePictureUrl} onChange={setProfilePictureUrl} placeholder="https://example.com/your-photo.jpg" />
            {profilePictureUrl && (
              <div className="mt-4 flex items-center gap-4">
                <Image src={profilePictureUrl} alt="Preview" width={56} height={56} unoptimized className="w-14 h-14 rounded-[12px] object-cover ring-1 ring-[var(--border-default)]" />
                <p className="text-body-regular text-secondary">Preview</p>
              </div>
            )}
          </SectionCard>
          <Feedback error={privateErr} success={privateOk} />
          <div className="flex justify-end mt-4">
            <SaveBtn busy={privateBusy} />
          </div>
        </form>
      )}

      {/* ════════ SECURITY TAB (EMPLOYEE only) ════════ */}
      {activeTab === "security" && !isAdmin && (
        <form onSubmit={handleSecuritySave} className="space-y-6 max-w-md">
          <SectionCard title="Change Password">
            <div className="space-y-6">
              <div>
                <p className="text-body-regular text-secondary">
                  Update your password to keep your account secure. You&apos;ll need your current password to confirm.
                </p>
              </div>
              <Field id="curPw" label="Current Password" type="password" value={curPw} onChange={setCurPw} placeholder="Your current password" />
              <div className="space-y-2">
                <Field id="newPw" label="New Password" type="password" value={newPw} onChange={setNewPw} placeholder="At least 8 characters" />
                {newPw.length > 0 && (
                  <div className="space-y-2 mt-2">
                    <div className="w-full h-1.5 bg-field rounded-full overflow-hidden border border-[var(--border-default)]">
                      <div className={`h-full transition-all duration-300 ${strength.color}`} style={{ width: `${strength.pct}%` }} />
                    </div>
                    <p className="text-body-small text-secondary">
                      Strength: <span className="font-medium text-primary">{strength.label}</span>
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Field id="confirmPw" label="Confirm New Password" type="password" value={confirmPw} onChange={setConfirmPw} placeholder="Re-enter new password" />
                {confirmPw.length > 0 && confirmPw !== newPw && (
                  <p className="text-body-small text-red-500">Passwords do not match</p>
                )}
              </div>
            </div>
          </SectionCard>
          <Feedback error={secErr} success={secOk} />
          <div className="flex justify-end mt-4">
            <SaveBtn busy={secBusy} label="Change Password" />
          </div>
        </form>
      )}

      {/* ════════ SALARY INFO TAB (ADMIN only) ════════ */}
      {activeTab === "salary" && isAdmin && (
        <div className="rounded-[16px] border border-[var(--border-default)] bg-field-on-canvas p-8 shadow-sm">
          <SalaryEditor employeeId={profile.id} />
        </div>
      )}
    </div>
  );
}
