"use client";

import { useState } from "react";
import Avatar from "@/components/ui/Avatar";
import StatusBadge from "@/components/directory/StatusBadge";
import SalaryEditor from "@/components/admin/SalaryEditor";
import type { EmployeeStatus, UserProfile } from "@/types/employee";
import { YuIcon } from "@/components/ui/YuIcons";

interface ProfileViewProps {
  employee: UserProfile;
  readOnly: boolean;
  isAdmin: boolean;
  status?: EmployeeStatus;
}

type TabId = "profile" | "salary";

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
    <div className="flex flex-col gap-1 border-b border-[var(--border-default)] py-4 last:border-0 sm:flex-row sm:items-start">
      <span className="shrink-0 text-label-caps text-secondary sm:w-48 mt-1">
        {label}
      </span>
      <span className="text-body-medium text-primary">{value || "—"}</span>
    </div>
  );
}

function TagList({ items, label }: { items: string[]; label: string }) {
  if (!items || items.length === 0) return <span className="text-body-regular text-tertiary">—</span>;
  return (
    <div className="flex flex-wrap gap-2" aria-label={label}>
      {items.map((item) => (
        <span
          key={item}
          className="inline-flex items-center justify-center rounded-[7px] text-label-score"
          style={{ height: "26px", padding: "4px 6px", backgroundColor: "var(--bg-canvas)", color: "var(--text-secondary)" }}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export default function ProfileView({
  employee,
  readOnly,
  isAdmin,
  status,
}: ProfileViewProps) {
  const tabs: { id: TabId; label: string }[] = [
    { id: "profile", label: "Profile" },
    ...(isAdmin ? [{ id: "salary" as TabId, label: "Salary Info" }] : []),
  ];

  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const initials = employee.name.charAt(0).toUpperCase();

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-[100px]">
      <div className="bg-field border border-[var(--border-default)] rounded-[16px] p-8 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 shadow-sm mt-8">
        <div className="w-[88px] h-[88px] rounded-[16px] bg-primary flex items-center justify-center overflow-hidden shrink-0 shadow-md">
          {employee.profilePictureUrl ? (
            <img src={employee.profilePictureUrl} alt={employee.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[32px] font-bold text-on-primary select-none">{initials}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-4 mb-2">
            <h1 className="text-[24px] leading-tight font-semibold text-primary truncate">{employee.name}</h1>
            {employee.role === "ADMIN" && (
              <span className="inline-flex items-center justify-center rounded-[7px] text-label-caps" style={{ height: "23px", padding: "0 8px", backgroundColor: "white", color: "var(--primary)", border: "1px solid var(--border-strong)" }}>
                ADMIN
              </span>
            )}
            {status && (
              <span className="inline-flex items-center justify-center rounded-[7px] border border-strong text-label-caps" style={{ height: "23px", padding: "0 8px", backgroundColor: "white", color: "var(--primary)", borderColor: "var(--primary)" }}>
                {status}
              </span>
            )}
          </div>
          <p className="text-body-regular text-secondary">
            {[employee.jobTitle, employee.department].filter(Boolean).join(" · ")}
          </p>
          <p className="text-body-regular text-tertiary mt-1 font-mono">
            Login ID: {employee.loginId}
          </p>
        </div>

        {!readOnly && (
          <button className="px-5 py-2.5 rounded-[10px] text-body-medium font-semibold text-on-primary bg-primary hover:opacity-90 active:opacity-100 transition-all shadow-sm">
            Edit Profile
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-8 border-b border-[var(--border-default)] pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-[8px] text-body-medium font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-primary text-on-primary shadow-sm"
                : "text-secondary hover:bg-field"
            }`}
            aria-selected={activeTab === tab.id}
            role="tab"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "profile" && (
        <div className="bg-field-on-canvas border border-[var(--border-default)] rounded-[16px] p-6 sm:p-8 shadow-sm space-y-8" role="tabpanel" aria-labelledby="tab-profile">
          <section>
            <h2 className="mb-4 text-label-caps text-secondary">
              Personal Information
            </h2>
            <div className="bg-field border border-[var(--border-default)] rounded-[12px] p-6">
              <InfoRow label="Full Name" value={employee.name} />
              <InfoRow label="Email" value={employee.email} />
              <InfoRow label="Phone" value={employee.phone} />
              <InfoRow label="Joining Date" value={formatDate(employee.joiningDate)} />
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-label-caps text-secondary">
              Job Details
            </h2>
            <div className="bg-field border border-[var(--border-default)] rounded-[12px] p-6">
              <InfoRow label="Department" value={employee.department} />
              <InfoRow label="Job Title" value={employee.jobTitle} />
            </div>
          </section>

          {employee.about && (
            <section>
              <h2 className="mb-4 text-label-caps text-secondary">
                About
              </h2>
              <div className="bg-field border border-[var(--border-default)] rounded-[12px] p-6">
                <p className="whitespace-pre-wrap text-body-regular text-primary">
                  {employee.about}
                </p>
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-4 text-label-caps text-secondary">
              Skills & Interests
            </h2>
            <div className="bg-field border border-[var(--border-default)] rounded-[12px] p-6 space-y-6">
              <div>
                <p className="mb-2 text-body-medium text-secondary">Skills</p>
                <TagList items={employee.skills} label="Skills" />
              </div>
              <div className="h-px w-full bg-[var(--border-default)]" />
              <div>
                <p className="mb-2 text-body-medium text-secondary">Certifications</p>
                <TagList items={employee.certifications} label="Certifications" />
              </div>
              <div className="h-px w-full bg-[var(--border-default)]" />
              <div>
                <p className="mb-2 text-body-medium text-secondary">Interests</p>
                <TagList items={employee.interests} label="Interests" />
              </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === "salary" && isAdmin && (
        <div className="bg-field-on-canvas border border-[var(--border-default)] rounded-[16px] p-6 sm:p-8 shadow-sm" role="tabpanel" aria-labelledby="tab-salary">
          <h2 className="mb-6 text-[18px] font-semibold text-primary">Update Salary Information</h2>
          <SalaryEditor employeeId={employee.id} />
        </div>
      )}
    </div>
  );
}
