// ProfileView — tabbed profile display.
// Accepts `readOnly` to hide edit controls (used on /employees/[id]).
// Accepts `isAdmin` to show the Salary Info tab (Step 7 placeholder).
//
// Member 3 can reuse this component for /profile with readOnly=false,
// or import their own edit form and swap — the interface is intentionally
// kept simple: { employee, readOnly, isAdmin }.

"use client";

import { useState } from "react";
import Avatar from "@/components/ui/Avatar";
import StatusBadge from "@/components/directory/StatusBadge";
import SalaryEditor from "@/components/admin/SalaryEditor";
import type { EmployeeStatus, UserProfile } from "@/types/employee";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProfileViewProps {
  employee: UserProfile;
  /** true when viewing someone else's profile */
  readOnly: boolean;
  /** true when the logged-in user is an Admin */
  isAdmin: boolean;
  /** Live status from the directory (optional — shown in header) */
  status?: EmployeeStatus;
}

// ─── Tab definitions ──────────────────────────────────────────────────────────

type TabId = "profile" | "salary";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-1 border-b border-white/5 py-3 last:border-0 sm:flex-row sm:items-start">
      <span className="shrink-0 text-xs font-bold uppercase tracking-wide text-slate-400 sm:w-40">
        {label}
      </span>
      <span className="text-sm font-medium text-gray-200">{value || "—"}</span>
    </div>
  );
}

function TagList({ items, label }: { items: string[]; label: string }) {
  if (!items || items.length === 0) return <span className="text-sm text-gray-400">—</span>;
  return (
    <div className="flex flex-wrap gap-2" aria-label={label}>
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProfileView({
  employee,
  readOnly,
  isAdmin,
  status,
}: ProfileViewProps) {
  const tabs: { id: TabId; label: string }[] = [
    { id: "profile", label: "Profile" },
    // Salary tab visible only to admins (Step 7 will flesh this out)
    ...(isAdmin ? [{ id: "salary" as TabId, label: "Salary Info" }] : []),
  ];

  const [activeTab, setActiveTab] = useState<TabId>("profile");

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-white/10 bg-[#050505] p-6 shadow-2xl sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <Avatar name={employee.name} src={employee.profilePictureUrl} size="xl" />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-white">{employee.name}</h1>
            {employee.role === "ADMIN" && (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
                Admin
              </span>
            )}
            {status && <StatusBadge status={status} showLabel />}
          </div>
          <p className="mt-2 text-sm font-medium text-slate-500">
            {[employee.jobTitle, employee.department].filter(Boolean).join(" · ")}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Login ID: <span className="font-mono">{employee.loginId}</span>
          </p>
        </div>

        {/* Edit button — shown only when not readOnly and on profile owner's view */}
        {!readOnly && (
          <button
            className="shrink-0 rounded-full bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800"
            onClick={() => {
              // Member 3 wires this to their edit form
              // For now it's a no-op placeholder
            }}
          >
            Edit Profile
          </button>
        )}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#050505] p-2 shadow-2xl">
        <nav className="flex gap-2" aria-label="Profile tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                activeTab === tab.id
                  ? "bg-emerald-700 text-white"
                  : "text-slate-500 hover:bg-white/5 hover:text-white"
              }`}
              aria-selected={activeTab === tab.id}
              role="tab"
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Tab panels ───────────────────────────────────────────────── */}
      {activeTab === "profile" && (
        <div className="space-y-6 rounded-[28px] border border-white/10 bg-[#050505] p-6 shadow-2xl sm:p-8" role="tabpanel" aria-labelledby="tab-profile">
          {/* Personal & contact */}
          <section>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
              Personal Information
            </h2>
            <InfoRow label="Full Name" value={employee.name} />
            <InfoRow label="Email" value={employee.email} />
            <InfoRow label="Phone" value={employee.phone} />
            <InfoRow label="Joining Date" value={formatDate(employee.joiningDate)} />
          </section>

          {/* Job info */}
          <section>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
              Job Details
            </h2>
            <InfoRow label="Department" value={employee.department} />
            <InfoRow label="Job Title" value={employee.jobTitle} />
          </section>

          {/* About */}
          {employee.about && (
            <section>
              <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                About
              </h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
                {employee.about}
              </p>
            </section>
          )}

          {/* Skills, certifications, interests */}
          <section>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
              Skills & Interests
            </h2>
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold text-slate-500">Skills</p>
                <TagList items={employee.skills} label="Skills" />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold text-slate-500">Certifications</p>
                <TagList items={employee.certifications} label="Certifications" />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold text-slate-500">Interests</p>
                <TagList items={employee.interests} label="Interests" />
              </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === "salary" && isAdmin && (
        <div className="rounded-[28px] border border-white/10 bg-[#050505] p-6 shadow-2xl sm:p-8" role="tabpanel" aria-labelledby="tab-salary">
          <h2 className="mb-6 text-base font-bold text-white">Update Salary Information</h2>
          <SalaryEditor employeeId={employee.id} />
        </div>
      )}
    </div>
  );
}
