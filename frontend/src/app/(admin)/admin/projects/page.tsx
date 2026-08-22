"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { PageIntro, Panel, StatusPill } from "@/components/ui/Workspace";

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = "ACTIVE" | "COMPLETED" | "IN_REVIEW";

interface Member {
  id: string;
  name: string;
  initial: string;
  color: string;
  jobTitle: string | null;
  department: string | null;
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

interface Employee {
  id: string;
  name: string;
  jobTitle: string | null;
  department: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<Status, string> = {
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
  IN_REVIEW: "IN_REVIEW",
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

// ─── New / Edit Project Form Modal ────────────────────────────────────────────

interface ProjectFormProps {
  initial?: Project;
  employees: Employee[];
  onClose: () => void;
  onSaved: (p: Project) => void;
}

function ProjectFormModal({ initial, employees, onClose, onSaved }: ProjectFormProps) {
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [department, setDepartment] = useState(initial?.department ?? "");
  const [status, setStatus] = useState<Status>(initial?.status ?? "ACTIVE");
  const [progress, setProgress] = useState(initial?.progress ?? 0);
  const [dueDate, setDueDate] = useState(
    initial?.dueDate ? new Date(initial.dueDate).toISOString().slice(0, 10) : ""
  );
  const [memberIds, setMemberIds] = useState<Set<string>>(
    new Set(initial?.members.map((m) => m.id) ?? [])
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleMember(id: string) {
    setMemberIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Project name is required."); return; }
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        department: department.trim() || undefined,
        status,
        progress: Number(progress),
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        memberIds: [...memberIds],
      };

      let r;
      if (isEdit) {
        r = await api.put<{ success: boolean; data: Project }>(`/projects/${initial.id}`, payload);
        // Update members separately
        await api.post(`/projects/${initial.id}/assign`, { memberIds: [...memberIds] });
      } else {
        r = await api.post<{ success: boolean; data: Project }>("/projects", payload);
      }
      onSaved(r.data.data);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Could not save project.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full px-3 py-2 rounded-[8px] border border-[var(--border-default)] text-body-regular text-primary bg-canvas outline-none focus:border-[var(--border-strong)] transition-colors";
  const labelClass = "block text-body-medium text-secondary mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-[16px] border border-[var(--border-default)] flex flex-col overflow-hidden"
        style={{ backgroundColor: "var(--bg-field)", maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-[var(--border-default)] flex items-center justify-between">
          <h2 className="text-body-medium" style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "16px" }}>
            {isEdit ? "Edit Project" : "New Project"}
          </h2>
          <button onClick={onClose} style={{ color: "var(--text-tertiary)" }} className="text-2xl leading-none hover:opacity-70">×</button>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {/* Name & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Project Name *</label>
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mobile App Redesign" />
            </div>
            <div>
              <label className={labelClass}>Department</label>
              <select
                className={inputClass}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                style={{ appearance: "none" }}
              >
                <option value="">All departments</option>
                {["Engineering","Design","Finance","Sales","Marketing","People","Support","Operations"].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short project description…"
            />
          </div>

          {/* Status, Progress, Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Status</label>
              <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as Status)} style={{ appearance: "none" }}>
                <option value="ACTIVE">Active</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Progress ({progress}%)</label>
              <input
                type="range" min={0} max={100} value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full accent-[var(--bg-primary)]"
              />
            </div>
            <div>
              <label className={labelClass}>Due Date</label>
              <input type="date" className={inputClass} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          {/* Assign Employees */}
          <div>
            <label className={labelClass}>Assign Employees ({memberIds.size} selected)</label>
            <div
              className="rounded-[10px] border border-[var(--border-default)] divide-y divide-[var(--border-default)] max-h-48 overflow-y-auto"
              style={{ backgroundColor: "var(--bg-canvas)" }}
            >
              {employees.map((emp) => (
                <label key={emp.id} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:opacity-80">
                  <input
                    type="checkbox"
                    checked={memberIds.has(emp.id)}
                    onChange={() => toggleMember(emp.id)}
                    className="accent-[var(--bg-primary)]"
                  />
                  <div>
                    <p className="text-body-medium" style={{ color: "var(--text-primary)" }}>{emp.name}</p>
                    <p className="text-body-small" style={{ color: "var(--text-secondary)" }}>
                      {[emp.jobTitle, emp.department].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </label>
              ))}
              {employees.length === 0 && (
                <p className="px-4 py-6 text-center text-body-small" style={{ color: "var(--text-tertiary)" }}>No employees found</p>
              )}
            </div>
          </div>

          {error && (
            <p className="text-body-small rounded-[8px] px-4 py-2" style={{ backgroundColor: "var(--red-50)", color: "var(--red-700)" }}>{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 rounded-[10px] text-body-medium border border-[var(--border-default)]"
              style={{ color: "var(--text-secondary)" }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-5 py-2.5 rounded-[10px] text-body-medium font-semibold disabled:opacity-60"
              style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-on-primary)" }}>
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"All" | Status>("All");

  const load = useCallback(async () => {
    try {
      const [pr, er] = await Promise.all([
        api.get<{ success: boolean; data: Project[] }>("/projects"),
        api.get<{ success: boolean; data: Employee[] }>("/messages/people"),
      ]);
      setProjects(pr.data.data);
      setEmployees(er.data.data);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleSaved(p: Project) {
    setProjects((prev) => {
      const idx = prev.findIndex((x) => x.id === p.id);
      return idx >= 0 ? prev.map((x) => x.id === p.id ? p : x) : [p, ...prev];
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await api.delete(`/projects/${id}`);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch {}
    finally { setDeletingId(null); }
  }

  const visible = filter === "All" ? projects : projects.filter((p) => p.status === filter);

  const FILTERS: { label: string; value: "All" | Status }[] = [
    { label: "All", value: "All" },
    { label: "Active", value: "ACTIVE" },
    { label: "In Review", value: "IN_REVIEW" },
    { label: "Completed", value: "COMPLETED" },
  ];

  return (
    <div>
      <PageIntro
        eyebrow="Admin workspace"
        title="Projects"
        description="Create and assign team projects. Employees see only their assigned projects."
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 pb-4">
        {/* Filters */}
        <div className="flex items-center gap-1 rounded-[10px] p-1 border border-white/10" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className="px-3 py-1.5 rounded-[8px] text-sm font-medium transition-all"
              style={{
                backgroundColor: filter === f.value ? "white" : "transparent",
                color: filter === f.value ? "black" : "rgba(255,255,255,0.55)",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => { setEditingProject(undefined); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold"
          style={{ backgroundColor: "white", color: "black" }}
        >
          + New Project
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <p className="text-white/40 text-sm">Loading projects…</p>
        </div>
      )}

      {/* Empty */}
      {!loading && visible.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="text-4xl">📁</div>
          <p className="text-white text-base font-medium">No projects yet</p>
          <p className="text-white/40 text-sm">Click "+ New Project" to create one</p>
        </div>
      )}

      {/* Grid */}
      {!loading && visible.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6 pb-8">
          {visible.map((p) => {
            const dc = deptColor(p.department);
            const pc = progressColor(p.progress);
            return (
              <div
                key={p.id}
                className="rounded-[12px] border border-white/10 p-5 flex flex-col gap-3"
                style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
              >
                {/* Top row */}
                <div className="flex items-center justify-between">
                  {p.department && (
                    <span
                      className="text-[11px] font-semibold uppercase tracking-wide rounded-[6px] px-2 py-0.5"
                      style={{ backgroundColor: `${dc}22`, color: dc }}
                    >
                      {p.department}
                    </span>
                  )}
                  <span className="text-xs text-white/40 ml-auto">
                    {p.dueDate
                      ? `Due: ${new Date(p.dueDate).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}`
                      : "No due date"}
                  </span>
                </div>

                {/* Name */}
                <h3 className="text-white text-[15px] font-semibold">{p.name}</h3>
                {p.description && (
                  <p className="text-sm text-white/50 line-clamp-2">{p.description}</p>
                )}

                {/* Progress */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-white/40">Progress</span>
                    <span className="text-xs font-medium text-white/60">{p.progress}%</span>
                  </div>
                  <div className="h-[5px] rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${p.progress}%`, background: `linear-gradient(90deg, ${pc}aa, ${pc})` }}
                    />
                  </div>
                </div>

                {/* Bottom */}
                <div className="flex items-center justify-between mt-1">
                  {/* Avatars */}
                  <div className="flex items-center">
                    {p.members.slice(0, 5).map((m, i) => (
                      <div
                        key={m.id}
                        title={m.name}
                        className="flex items-center justify-center rounded-full text-white text-xs font-semibold border-2 border-[#0b0c0b]"
                        style={{
                          width: "28px", height: "28px",
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
                        className="flex items-center justify-center rounded-full text-xs font-semibold border-2 border-[#0b0c0b] text-white/60"
                        style={{ width: "28px", height: "28px", backgroundColor: "rgba(255,255,255,0.1)", marginLeft: "-8px" }}
                      >
                        +{p.members.length - 5}
                      </div>
                    )}
                    {p.members.length === 0 && (
                      <span className="text-xs text-white/30">No members</span>
                    )}
                    <span className="ml-2 text-xs text-white/35">{p.members.length} member{p.members.length !== 1 ? "s" : ""}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <StatusPill status={p.status} />
                    <button
                      onClick={() => { setEditingProject(p); setShowForm(true); }}
                      className="text-xs px-2.5 py-1 rounded-md border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      disabled={deletingId === p.id}
                      className="text-xs px-2.5 py-1 rounded-md border border-red-900/40 text-red-400 hover:border-red-600 transition-colors disabled:opacity-50"
                    >
                      {deletingId === p.id ? "…" : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showForm && (
        <ProjectFormModal
          initial={editingProject}
          employees={employees}
          onClose={() => { setShowForm(false); setEditingProject(undefined); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
