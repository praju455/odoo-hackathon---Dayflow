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
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 py-3 border-b border-gray-100 last:border-0">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide sm:w-40 shrink-0">
        {label}
      </span>
      <span className="text-sm text-gray-800">{value || "—"}</span>
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
          className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700"
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
      {/* ── Profile header card ──────────────────────────────────────── */}
      <div className="card p-6 flex flex-col sm:flex-row gap-5 items-start sm:items-center">
        <Avatar name={employee.name} src={employee.profilePictureUrl} size="xl" />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">{employee.name}</h1>
            {employee.role === "ADMIN" && (
              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600 uppercase tracking-wide">
                Admin
              </span>
            )}
            {status && <StatusBadge status={status} showLabel />}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {[employee.jobTitle, employee.department].filter(Boolean).join(" · ")}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Login ID: <span className="font-mono">{employee.loginId}</span>
          </p>
        </div>

        {/* Edit button — shown only when not readOnly and on profile owner's view */}
        {!readOnly && (
          <button
            className="btn-primary shrink-0"
            onClick={() => {
              // Member 3 wires this to their edit form
              // For now it's a no-op placeholder
            }}
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1" aria-label="Profile tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors duration-150 ${
                activeTab === tab.id
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
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
        <div className="card p-6 space-y-6" role="tabpanel" aria-labelledby="tab-profile">
          {/* Personal & contact */}
          <section>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
              Personal Information
            </h2>
            <InfoRow label="Full Name" value={employee.name} />
            <InfoRow label="Email" value={employee.email} />
            <InfoRow label="Phone" value={employee.phone} />
            <InfoRow label="Joining Date" value={formatDate(employee.joiningDate)} />
          </section>

          {/* Job info */}
          <section>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
              Job Details
            </h2>
            <InfoRow label="Department" value={employee.department} />
            <InfoRow label="Job Title" value={employee.jobTitle} />
          </section>

          {/* About */}
          {employee.about && (
            <section>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                About
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {employee.about}
              </p>
            </section>
          )}

          {/* Skills, certifications, interests */}
          <section>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Skills & Interests
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-2">Skills</p>
                <TagList items={employee.skills} label="Skills" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">Certifications</p>
                <TagList items={employee.certifications} label="Certifications" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">Interests</p>
                <TagList items={employee.interests} label="Interests" />
              </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === "salary" && isAdmin && (
        <div className="card p-6" role="tabpanel" aria-labelledby="tab-salary">
          <h2 className="text-base font-semibold text-gray-900 mb-6">Update Salary Information</h2>
          <SalaryEditor employeeId={employee.id} />
        </div>
      )}
    </div>
  );
}
