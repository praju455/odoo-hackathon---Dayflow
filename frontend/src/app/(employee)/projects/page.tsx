"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = "ACTIVE" | "COMPLETED" | "IN_REVIEW";
type Filter = "All" | Status;

interface Member {
  id: string;
  name: string;
  initial: string;
  color: string;
  jobTitle: string | null;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  department: string | null;
  status: Status;
  progress: number;
  dueDate: string | null;
  members: Member[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<Status, string> = {
  ACTIVE: "Active",
  COMPLETED: "Completed",
  IN_REVIEW: "In Review",
};

const STATUS_STYLES: Record<Status, { bg: string; color: string }> = {
  ACTIVE:     { bg: "var(--green-50)",       color: "var(--green-700)" },
  COMPLETED:  { bg: "var(--border-default)", color: "var(--text-secondary)" },
  IN_REVIEW:  { bg: "var(--amber-50)",       color: "var(--amber-700)" },
};

const DEPT_COLORS: Record<string, string> = {
  Engineering:  "#6366f1",
  Design:       "#8b5cf6",
  Finance:      "#4ade80",
  Sales:        "#f59e0b",
  Marketing:    "#06b6d4",
  People:       "#f87171",
  Support:      "#fb923c",
  Operations:   "#a78bfa",
};
function deptColor(dept: string | null) {
  return DEPT_COLORS[dept ?? ""] ?? "#6366f1";
}

function progressColor(pct: number) {
  if (pct >= 90) return "#4ade80";
  if (pct >= 50) return "#6366f1";
  return "#f59e0b";
}

const FILTERS: { label: string; value: Filter }[] = [
  { label: "All",       value: "All" },
  { label: "Active",    value: "ACTIVE" },
  { label: "Completed", value: "COMPLETED" },
  { label: "In Review", value: "IN_REVIEW" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("All");

  useEffect(() => {
    api.get<{ success: boolean; data: Project[] }>("/projects")
      .then((r) => setProjects(r.data.data))
      .catch(() => setError("Could not load your projects."))
      .finally(() => setLoading(false));
  }, []);

  const visible = filter === "All" ? projects : projects.filter((p) => p.status === filter);

  if (loading) {
    return (
      <div className="flex flex-col min-w-0">
        <div className="px-[20px] pt-[28px] pb-[24px] border-b border-[var(--border-default)]">
          <h1 className="text-heading-page" style={{ color: "var(--text-primary)" }}>Active Projects</h1>
          <p className="text-body-regular mt-1" style={{ color: "var(--text-secondary)" }}>Your assigned projects</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-body-regular" style={{ color: "var(--text-tertiary)" }}>Loading projects…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-w-0 pb-[100px]">
      {/* Header */}
      <div className="flex items-start justify-between px-[20px] pt-[28px] pb-[24px] border-b border-[var(--border-default)]">
        <div>
          <h1 className="text-heading-page" style={{ color: "var(--text-primary)" }}>My Projects</h1>
          <p className="text-body-regular mt-1" style={{ color: "var(--text-secondary)" }}>
            Projects you are assigned to
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 rounded-[10px] p-1 border border-[var(--border-default)]" style={{ backgroundColor: "var(--bg-field)" }}>
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className="px-3 py-1.5 rounded-[8px] text-label-score transition-all"
              style={{
                backgroundColor: filter === f.value ? "var(--bg-primary)" : "transparent",
                color: filter === f.value ? "var(--text-on-primary)" : "var(--text-secondary)",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-[20px] mt-4 rounded-[8px] px-4 py-3 text-body-regular" style={{ backgroundColor: "var(--red-50)", color: "var(--red-700)" }}>
          {error}
        </div>
      )}

      {/* Empty state */}
      {!error && visible.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="text-4xl">📁</div>
          <p className="text-body-medium" style={{ color: "var(--text-primary)" }}>
            {filter === "All" ? "No projects assigned yet" : `No ${STATUS_LABELS[filter as Status]} projects`}
          </p>
          <p className="text-body-regular" style={{ color: "var(--text-secondary)" }}>
            Your manager will assign you to projects
          </p>
        </div>
      )}

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-[20px]">
        {visible.map((p) => {
          const dc = deptColor(p.department);
          const pc = progressColor(p.progress);
          const ss = STATUS_STYLES[p.status];
          return (
            <div
              key={p.id}
              className="rounded-[12px] border border-[var(--border-default)] p-5 flex flex-col gap-3"
              style={{ backgroundColor: "var(--bg-field)" }}
            >
              {/* Top row */}
              <div className="flex items-center justify-between">
                {p.department && (
                  <span
                    className="text-label-caps rounded-[6px] px-2 py-0.5"
                    style={{ backgroundColor: `${dc}22`, color: dc }}
                  >
                    {p.department.toUpperCase()}
                  </span>
                )}
                <span className="text-body-small ml-auto" style={{ color: "var(--text-tertiary)" }}>
                  {p.dueDate ? `Due: ${new Date(p.dueDate).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}` : "No due date"}
                </span>
              </div>

              {/* Project name */}
              <h3 className="text-body-medium" style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "15px" }}>
                {p.name}
              </h3>
              {p.description && (
                <p className="text-body-small line-clamp-2" style={{ color: "var(--text-secondary)" }}>{p.description}</p>
              )}

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-body-small" style={{ color: "var(--text-tertiary)" }}>Progress</span>
                  <span className="text-label-score" style={{ color: "var(--text-secondary)" }}>{p.progress}%</span>
                </div>
                <div className="h-[5px] rounded-full" style={{ backgroundColor: "var(--border-default)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${p.progress}%`, background: `linear-gradient(90deg, ${pc}aa, ${pc})` }}
                  />
                </div>
              </div>

              {/* Bottom: avatars + status */}
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center">
                  {p.members.slice(0, 5).map((m, i) => (
                    <div
                      key={m.id}
                      title={m.name}
                      className="flex items-center justify-center rounded-full text-white text-xs font-semibold border-2 border-[var(--bg-field)]"
                      style={{
                        width: "28px",
                        height: "28px",
                        backgroundColor: m.color,
                        marginLeft: i > 0 ? "-8px" : "0",
                        zIndex: p.members.length - i,
                      }}
                    >
                      {m.initial}
                    </div>
                  ))}
                  {p.members.length > 5 && (
                    <div
                      className="flex items-center justify-center rounded-full text-xs font-semibold border-2 border-[var(--bg-field)]"
                      style={{ width: "28px", height: "28px", backgroundColor: "var(--border-default)", color: "var(--text-secondary)", marginLeft: "-8px" }}
                    >
                      +{p.members.length - 5}
                    </div>
                  )}
                  {p.members.length === 0 && (
                    <span className="text-body-small" style={{ color: "var(--text-tertiary)" }}>No members</span>
                  )}
                </div>
                <span
                  className="text-label-score rounded-[7px] px-3 py-1"
                  style={{ backgroundColor: ss.bg, color: ss.color }}
                >
                  {STATUS_LABELS[p.status]}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
