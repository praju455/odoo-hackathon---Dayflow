"use client";

import { useState } from "react";

type Status = "Active" | "Completed" | "In-Review";
type Filter = "All" | Status;

interface Project {
  id: number;
  dept: string;
  deptColor: string;
  due: string;
  name: string;
  progress: number;
  progressColor: string;
  avatars: string[];
  status: Status;
}

const PROJECTS: Project[] = [
  {
    id: 1,
    dept: "ENGINEERING",
    deptColor: "#6366f1",
    due: "Due: 28 Aug 2026",
    name: "Payment Gateway Refactor (HDFC & UPI)",
    progress: 81,
    progressColor: "#6366f1",
    avatars: ["M", "A"],
    status: "Active",
  },
  {
    id: 2,
    dept: "DESIGN",
    deptColor: "#8b5cf6",
    due: "Due: 28 Aug 2026",
    name: "CrewBase Dark Theme UI System",
    progress: 98,
    progressColor: "#4ade80",
    avatars: ["S", "L"],
    status: "Completed",
  },
  {
    id: 3,
    dept: "FINANCE & HR",
    deptColor: "#4ade80",
    due: "Due: 05 Sep 2026",
    name: "HR Payroll Statutory Calculator",
    progress: 43,
    progressColor: "#f59e0b",
    avatars: ["R", "K"],
    status: "In-Review",
  },
  {
    id: 4,
    dept: "ENGINEERING",
    deptColor: "#6366f1",
    due: "Due: 12 Sep 2026",
    name: "Mobile App Offline Sync Engine",
    progress: 64,
    progressColor: "#6366f1",
    avatars: ["D", "P"],
    status: "Active",
  },
];

const AVATAR_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#4ade80", "#f59e0b", "#f87171"];
function avatarColor(char: string) {
  return AVATAR_COLORS[char.charCodeAt(0) % AVATAR_COLORS.length];
}

const FILTERS: Filter[] = ["All", "Active", "Completed", "In-Review"];

const STATUS_STYLES: Record<Status, { bg: string; color: string }> = {
  Active:    { bg: "var(--green-50)",  color: "var(--green-700)" },
  Completed: { bg: "var(--border-default)", color: "var(--text-secondary)" },
  "In-Review": { bg: "var(--amber-50)", color: "var(--amber-700)" },
};

export default function ProjectsPage() {
  const [filter, setFilter] = useState<Filter>("All");

  const visible = filter === "All" ? PROJECTS : PROJECTS.filter((p) => p.status === filter);

  return (
    <div className="flex flex-col min-w-0 pb-[100px]">
      {/* Header */}
      <div className="flex items-start justify-between px-[20px] pt-[28px] pb-[24px] border-b border-[var(--border-default)]">
        <div>
          <h1 className="text-heading-page" style={{ color: "var(--text-primary)" }}>Active Projects</h1>
          <p className="text-body-regular mt-1" style={{ color: "var(--text-secondary)" }}>
            Manage team projects and delivery roadmaps (IST)
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 rounded-[10px] p-1 border border-[var(--border-default)]" style={{ backgroundColor: "var(--bg-field)" }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-[8px] text-label-score transition-all"
              style={{
                backgroundColor: filter === f ? "var(--bg-primary)" : "transparent",
                color: filter === f ? "var(--text-on-primary)" : "var(--text-secondary)",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-[20px]">
        {visible.map((p) => (
          <div
            key={p.id}
            className="rounded-[12px] border border-[var(--border-default)] p-5 flex flex-col gap-3"
            style={{ backgroundColor: "var(--bg-field)" }}
          >
            {/* Top row: dept tag + due date */}
            <div className="flex items-center justify-between">
              <span
                className="text-label-caps rounded-[6px] px-2 py-0.5"
                style={{ backgroundColor: `${p.deptColor}22`, color: p.deptColor }}
              >
                {p.dept}
              </span>
              <span className="text-body-small" style={{ color: "var(--text-tertiary)" }}>{p.due}</span>
            </div>

            {/* Project name */}
            <h3 className="text-body-medium" style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "15px" }}>{p.name}</h3>

            {/* Progress */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-body-small" style={{ color: "var(--text-tertiary)" }}>Progress</span>
                <span className="text-label-score" style={{ color: "var(--text-secondary)" }}>{p.progress}%</span>
              </div>
              <div className="h-[5px] rounded-full" style={{ backgroundColor: "var(--border-default)" }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${p.progress}%`, background: `linear-gradient(90deg, ${p.progressColor}aa, ${p.progressColor})` }}
                />
              </div>
            </div>

            {/* Bottom: avatars + status */}
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center">
                {p.avatars.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-center rounded-full text-white text-xs font-semibold border-2 border-[var(--bg-field)]"
                    style={{
                      width: "28px",
                      height: "28px",
                      backgroundColor: avatarColor(a),
                      marginLeft: i > 0 ? "-8px" : "0",
                      zIndex: p.avatars.length - i,
                    }}
                  >
                    {a}
                  </div>
                ))}
              </div>
              <span
                className="text-label-score rounded-[7px] px-3 py-1"
                style={{ backgroundColor: STATUS_STYLES[p.status].bg, color: STATUS_STYLES[p.status].color }}
              >
                {p.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
