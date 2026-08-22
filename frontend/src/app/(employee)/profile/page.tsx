"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { generatePayslip, type SalaryBreakdown } from "@/utils/generatePayslip";
import SalaryEditor from "@/components/admin/SalaryEditor";

// ─── Types ────────────────────────────────────────────────────────────────────

// Confirmed from backend/src/utils/userResponse.js (toUserProfile) + schema.prisma
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
  joiningDate: string; // ISO datetime string from Prisma
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

// Comma-separated string ↔ string[] conversions for skills/certifications/interests
function toArray(raw: string): string[] {
  return raw
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
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
    <svg className={`animate-spin ${cls} text-indigo-500`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

function ReadonlyField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <p className="text-sm text-slate-300">{value || "—"}</p>
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
    "w-full px-3 py-2 rounded-lg bg-slate-900/70 border border-slate-600 text-sm text-white " +
    "placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 " +
    "focus:border-transparent transition-all duration-200";

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-slate-400 mb-1.5">
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
      <label htmlFor={id} className="block text-xs font-medium text-slate-400 mb-1.5">
        {label}
      </label>
      <select
        id={id} value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-slate-900/70 border border-slate-600
          text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500
          focus:border-transparent transition-all duration-200"
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
      <h2 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3 px-1">
        {title}
      </h2>
      <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-6">
        {children}
      </div>
    </section>
  );
}

function Feedback({ error, success }: { error: string | null; success: string | null }) {
  if (error) {
    return (
      <div role="alert" className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30
        rounded-xl px-4 py-3 text-red-400 text-sm">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
        {error}
      </div>
    );
  }
  if (success) {
    return (
      <div role="status" className="flex items-center gap-2.5 bg-green-500/10 border border-green-500/30
        rounded-xl px-4 py-3 text-green-400 text-sm">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        {success}
      </div>
    );
  }
  return null;
}

function SaveBtn({ busy, label = "Save changes" }: { busy: boolean; label?: string }) {
  return (
    <button type="submit" disabled={busy}
      className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white
        bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700
        disabled:opacity-60 disabled:cursor-not-allowed
        flex items-center gap-2 transition-all duration-200 shadow-lg shadow-indigo-500/20">
      {busy && <Spinner size="sm" />}
      {busy ? "Saving…" : label}
    </button>
  );
}

// ─── Password strength (reused from /change-password) ────────────────────────
function strengthOf(pw: string) {
  if (!pw) return { label: "", pct: 0, color: "bg-slate-700" };
  if (pw.length < 6) return { label: "Too short", pct: 15, color: "bg-red-500" };
  if (pw.length < 8)  return { label: "Weak",      pct: 30, color: "bg-orange-400" };
  const score = [/[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  if (score === 3) return { label: "Strong", pct: 100, color: "bg-green-500" };
  if (score === 2) return { label: "Good",   pct: 70,  color: "bg-indigo-400" };
  return               { label: "Fair",   pct: 50,  color: "bg-yellow-400" };
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user: authUser, setUser: setAuthUser } = useAuth();

  // ── Data ──────────────────────────────────────────────────────────────────
  const [profile, setProfile]         = useState<UserProfile | null>(null);
  const [managerName, setManagerName] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError]     = useState<string | null>(null);
  const [salaryData, setSalaryData]   = useState<SalaryBreakdown | null>(null);

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const isAdmin = authUser?.role === "ADMIN";
  type TabId = "resume" | "private" | "security" | "salary";
  const TABS: { id: TabId; label: string }[] = [
    { id: "resume",  label: "Resume"       },
    { id: "private", label: "Private Info" },
    { id: isAdmin ? "salary" : "security",
      label: isAdmin ? "Salary Info" : "Security" },
  ];
  const [activeTab, setActiveTab] = useState<TabId>("resume");

  // ── Resume form ───────────────────────────────────────────────────────────
  const [about,         setAbout]         = useState("");
  const [skills,        setSkills]        = useState("");
  const [certifications, setCertifications] = useState("");
  const [interests,     setInterests]     = useState("");
  const [resumeBusy,    setResumeBusy]    = useState(false);
  const [resumeErr,     setResumeErr]     = useState<string | null>(null);
  const [resumeOk,      setResumeOk]      = useState<string | null>(null);

  // ── Private Info form ─────────────────────────────────────────────────────
  const [phone,             setPhone]             = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [priv, setPriv] = useState<PrivateFields>(EMPTY_PRIVATE);
  const [privateBusy, setPrivateBusy] = useState(false);
  const [privateErr,  setPrivateErr]  = useState<string | null>(null);
  const [privateOk,   setPrivateOk]   = useState<string | null>(null);

  // ── Security form (EMPLOYEE only) ─────────────────────────────────────────
  const [curPw,      setCurPw]      = useState("");
  const [newPw,      setNewPw]      = useState("");
  const [confirmPw,  setConfirmPw]  = useState("");
  const [secBusy,    setSecBusy]    = useState(false);
  const [secErr,     setSecErr]     = useState<string | null>(null);
  const [secOk,      setSecOk]      = useState<string | null>(null);
  const strength = strengthOf(newPw);

  // ── Auto-clear feedback after 4 s ─────────────────────────────────────────
  useEffect(() => { if (!resumeOk)  return; const t = setTimeout(() => setResumeOk(null),  4000); return () => clearTimeout(t); }, [resumeOk]);
  useEffect(() => { if (!privateOk) return; const t = setTimeout(() => setPrivateOk(null), 4000); return () => clearTimeout(t); }, [privateOk]);
  useEffect(() => { if (!secOk)     return; const t = setTimeout(() => setSecOk(null),     4000); return () => clearTimeout(t); }, [secOk]);

  // ── Fetch profile on mount ─────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    setPageLoading(true);
    setPageError(null);
    try {
      // Confirmed from backend/src/routes/users.js:
      // GET /api/users/me → { user: toUserProfile(user) }
      const { data } = await api.get<{ user: UserProfile }>("/users/me");
      const p = data.user;
      setProfile(p);

      // Seed form fields from API
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

      // Fetch manager's name if managerId is set.
      // GET /api/employees/:id → { employee: toUserProfile(user) } (confirmed from employees.js)
      if (p.managerId) {
        try {
          const { data: mgr } = await api.get<{ employee: { name: string } }>(
            `/employees/${p.managerId}`
          );
          setManagerName(mgr.employee.name);
        } catch {
          setManagerName(null); // non-fatal: show "—" instead
        }
      }

      // Fetch salary for payslip download
      try {
        const { data: salaryRes } = await api.get<{
          success: boolean;
          data: { breakdown: SalaryBreakdown };
        }>(`/salary/${p.id}`);
        if (salaryRes.success) {
          setSalaryData(salaryRes.data.breakdown);
        }
      } catch {
        // Ignore if no salary is defined yet
      }
    } catch {
      setPageError("Failed to load profile. Please refresh the page.");
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // ── Resume save ────────────────────────────────────────────────────────────
  async function handleResumeSave(e: React.FormEvent) {
    e.preventDefault();
    setResumeErr(null);
    setResumeBusy(true);
    try {
      // Confirmed from selfUpdateSchema: PUT /api/users/me accepts
      // { about?, skills?, certifications?, interests? }
      // Returns: { user: toUserProfile(user) }
      const { data } = await api.put<{ user: UserProfile }>("/users/me", {
        about: about.trim() || undefined,
        skills:         toArray(skills),
        certifications: toArray(certifications),
        interests:      toArray(interests),
      });
      const p = data.user;
      setProfile((prev) => (prev ? { ...prev, about: p.about, skills: p.skills, certifications: p.certifications, interests: p.interests } : prev));
      // Re-sync the displayed form from the response to stay consistent
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

  // ── Private Info save ──────────────────────────────────────────────────────
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

      // Propagate avatar change to nav shell
      if (authUser) {
        setAuthUser({ ...authUser, profilePictureUrl: p.profilePictureUrl ?? undefined });
      }

      setPrivateOk("Private info saved.");
    } catch (err) {
      setPrivateErr(extractError(err));
    } finally {
      setPrivateBusy(false);
    }
  }

  // ── Security (voluntary password change) ──────────────────────────────────
  async function handleSecuritySave(e: React.FormEvent) {
    e.preventDefault();
    setSecErr(null);

    if (newPw.length < 8)       { setSecErr("New password must be at least 8 characters."); return; }
    if (newPw !== confirmPw)     { setSecErr("Passwords do not match."); return; }
    if (newPw === curPw)         { setSecErr("New password must differ from current."); return; }

    setSecBusy(true);
    try {
      // Confirmed from backend/src/routes/auth.js:
      // PUT /api/auth/change-password accepts: { currentPassword, newPassword }
      // Error shape: { error: "..." }
      await api.put("/auth/change-password", {
        currentPassword: curPw,
        newPassword:     newPw,
      });
      setCurPw(""); setNewPw(""); setConfirmPw("");
      setSecOk("Password changed successfully.");
    } catch (err) {
      setSecErr(extractError(err));
    } finally {
      setSecBusy(false);
    }
  }

  // ─── Render: loading / error ─────────────────────────────────────────────
  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-slate-500 text-sm">Loading profile…</p>
        </div>
      </div>
    );
  }

  if (pageError || !profile) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] px-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6
          text-red-400 text-sm max-w-sm text-center">
          {pageError ?? "Profile not found."}
        </div>
      </div>
    );
  }

  const initials = profile.name.charAt(0).toUpperCase();

  // ─── Render: profile page ────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

      {/* ── Profile header ── */}
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-800/40 border border-slate-700/40
        rounded-2xl p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        {/* Avatar */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700
          flex items-center justify-center ring-4 ring-indigo-500/20 overflow-hidden shrink-0">
          {profile.profilePictureUrl ? (
            <Image src={profile.profilePictureUrl} alt={profile.name}
              width={80} height={80} unoptimized
              className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl font-bold text-white select-none">{initials}</span>
          )}
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white truncate">{profile.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border
                ${isAdmin
                  ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                  : "bg-indigo-500/15 text-indigo-400 border-indigo-500/30"
                }`}>
                {profile.role}
              </span>
            </div>
            {salaryData && (
              <button
                onClick={() => generatePayslip(profile, salaryData)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-500/20"
                title="Download this month's payslip"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Payslip
              </button>
            )}
          </div>
          <p className="text-slate-400 text-sm">
            {[profile.jobTitle, profile.department].filter(Boolean).join(" · ") || "No title set"}
          </p>
          <p className="text-slate-600 text-xs mt-1 font-mono">{profile.loginId}</p>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-1 mb-6 bg-slate-900/60 rounded-xl p-1.5 border border-slate-800/80">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200
              ${activeTab === tab.id
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ════════ RESUME TAB ════════ */}
      {activeTab === "resume" && (
        <form onSubmit={handleResumeSave} className="space-y-5">
          <SectionCard title="About">
            <Field id="about" label="About" rows={4} value={about} onChange={setAbout}
              placeholder="Tell your colleagues a bit about yourself…" />
          </SectionCard>

          <SectionCard title="Skills">
            <Field id="skills" label="Skills (comma-separated)" rows={2}
              value={skills} onChange={setSkills}
              placeholder="e.g. React, TypeScript, Node.js" />
            {/* Live tag preview */}
            {toArray(skills).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {toArray(skills).map((s, i) => (
                  <span key={i} className="px-2.5 py-0.5 rounded-full text-xs font-medium
                    bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Certifications">
            <Field id="certifications" label="Certifications (comma-separated)" rows={2}
              value={certifications} onChange={setCertifications}
              placeholder="e.g. AWS Solutions Architect, PMP" />
          </SectionCard>

          <SectionCard title="Interests">
            <Field id="interests" label="What I love about my job / Interests (comma-separated)"
              rows={2} value={interests} onChange={setInterests}
              placeholder="e.g. Building products, mentoring, open source" />
          </SectionCard>

          <Feedback error={resumeErr} success={resumeOk} />
          <div className="flex justify-end">
            <SaveBtn busy={resumeBusy} />
          </div>
        </form>
      )}

      {/* ════════ PRIVATE INFO TAB ════════ */}
      {activeTab === "private" && (
        <form onSubmit={handlePrivateSave} className="space-y-5">

          {/* Work Info — entirely read-only (backend forbids self-update of these) */}
          <SectionCard title="Work Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
              <ReadonlyField label="Employee ID" value={profile.loginId} />
              <ReadonlyField label="Work Email" value={profile.email} />
              <ReadonlyField label="Department" value={profile.department} />
              <ReadonlyField label="Job Title" value={profile.jobTitle} />
              <ReadonlyField label="Date of Joining" value={fmtDate(profile.joiningDate)} />
              <ReadonlyField
                label="Reporting Manager"
                value={
                  profile.managerId
                    ? managerName ?? "Loading…"
                    : "—"
                }
              />
              <ReadonlyField label="Role" value={profile.role} />
            </div>
          </SectionCard>

          {/* Personal information */}
          <SectionCard title="Personal Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field id="phone" label="Phone Number" type="tel"
                value={phone} onChange={setPhone}
                placeholder="+91 98765 43210" />

              <Field id="personalEmail" label="Personal Email" type="email"
                value={priv.personalEmail}
                onChange={(v) => setPriv((p) => ({ ...p, personalEmail: v }))}
                placeholder="personal@gmail.com" />

              <Field id="dateOfBirth" label="Date of Birth" type="date"
                value={priv.dateOfBirth}
                onChange={(v) => setPriv((p) => ({ ...p, dateOfBirth: v }))} />

              <SelectField id="gender" label="Gender"
                value={priv.gender}
                onChange={(v) => setPriv((p) => ({ ...p, gender: v }))}
                options={[
                  { value: "Male",             label: "Male"             },
                  { value: "Female",           label: "Female"           },
                  { value: "Other",            label: "Other"            },
                  { value: "Prefer not to say", label: "Prefer not to say" },
                ]} />

              <SelectField id="maritalStatus" label="Marital Status"
                value={priv.maritalStatus}
                onChange={(v) => setPriv((p) => ({ ...p, maritalStatus: v }))}
                options={[
                  { value: "Single",  label: "Single"  },
                  { value: "Married", label: "Married" },
                  { value: "Other",   label: "Other"   },
                ]} />
            </div>
          </SectionCard>

          {/* Official IDs */}
          <SectionCard title="Official Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field id="panCode" label="PAN Code"
                value={priv.panCode}
                onChange={(v) => setPriv((p) => ({ ...p, panCode: v.toUpperCase() }))}
                placeholder="ABCDE1234F" />
              <Field id="uanCode" label="UAN Code"
                value={priv.uanCode}
                onChange={(v) => setPriv((p) => ({ ...p, uanCode: v }))}
                placeholder="100000000000" />
              <Field id="accountNumber" label="Bank Account Number"
                value={priv.accountNumber}
                onChange={(v) => setPriv((p) => ({ ...p, accountNumber: v }))}
                placeholder="XXXX XXXX XXXX XXXX" />
            </div>
          </SectionCard>

          {/* Address */}
          <SectionCard title="Address">
            <Field id="homeAddress" label="Home Address" rows={3}
              value={priv.homeAddress}
              onChange={(v) => setPriv((p) => ({ ...p, homeAddress: v }))}
              placeholder="Street, City, State — PIN Code" />
          </SectionCard>

          {/* Profile picture — backend-persisted via selfUpdateSchema */}
          <SectionCard title="Profile Picture">
            <Field id="profilePictureUrl" label="Photo URL"
              value={profilePictureUrl} onChange={setProfilePictureUrl}
              placeholder="https://example.com/your-photo.jpg" />
            {profilePictureUrl && (
              <div className="mt-3 flex items-center gap-3">
                <Image src={profilePictureUrl} alt="Preview"
                  width={48} height={48} unoptimized
                  className="w-12 h-12 rounded-xl object-cover ring-2 ring-indigo-500/30" />
                <p className="text-xs text-slate-500">Preview</p>
              </div>
            )}
          </SectionCard>

          <Feedback error={privateErr} success={privateOk} />
          <div className="flex justify-end">
            <SaveBtn busy={privateBusy} />
          </div>
        </form>
      )}

      {/* ════════ SECURITY TAB (EMPLOYEE only) ════════ */}
      {activeTab === "security" && !isAdmin && (
        <form onSubmit={handleSecuritySave} className="space-y-5">
          <SectionCard title="Change Password">
            <div className="space-y-5">
              <div>
                <p className="text-xs text-slate-500 mb-4">
                  Update your password to keep your account secure. You&apos;ll need your current password to confirm.
                </p>
              </div>

              <Field id="curPw" label="Current Password" type="password"
                value={curPw} onChange={setCurPw}
                placeholder="Your current password" />

              <div className="space-y-2">
                <Field id="newPw" label="New Password" type="password"
                  value={newPw} onChange={setNewPw}
                  placeholder="At least 8 characters" />
                {/* Strength bar */}
                {newPw.length > 0 && (
                  <div className="space-y-1">
                    <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                        style={{ width: `${strength.pct}%` }} />
                    </div>
                    <p className="text-xs text-slate-500">
                      Strength: <span className="font-medium text-slate-300">{strength.label}</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <Field id="confirmPw" label="Confirm New Password" type="password"
                  value={confirmPw} onChange={setConfirmPw}
                  placeholder="Re-enter new password" />
                {confirmPw.length > 0 && confirmPw !== newPw && (
                  <p className="text-xs text-red-400">Passwords do not match</p>
                )}
              </div>
            </div>
          </SectionCard>

          <Feedback error={secErr} success={secOk} />
          <div className="flex justify-end">
            <SaveBtn busy={secBusy} label="Change Password" />
          </div>
        </form>
      )}

      {/* ════════ SALARY INFO TAB (ADMIN only) ════════ */}
      {activeTab === "salary" && isAdmin && (
        <div className="rounded-2xl bg-white p-6">
          <SalaryEditor employeeId={profile.id} />
        </div>
      )}
    </div>
  );
}
