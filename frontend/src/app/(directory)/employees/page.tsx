"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import EmployeeCard from "@/components/directory/EmployeeCard";
import type {
  DayAttendanceRecord,
  DirectoryEmployee,
  EmployeeStatus,
} from "@/types/employee";

// ─── Status computation ───────────────────────────────────────────────────────

function computeStatus(
  empId: string,
  dayRecords: DayAttendanceRecord[],
  canViewStatus: boolean,
): EmployeeStatus {
  if (!canViewStatus) return "unknown";
  const status = dayRecords.find((record) => record.user.id === empId)?.status;
  if (status === "PRESENT" || status === "HALF_DAY") return "present";
  if (status === "LEAVE") return "on-leave";
  return "absent";
}

// ─── Today helpers ────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EmployeesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [employees, setEmployees] = useState<DirectoryEmployee[]>([]);
  const [dayRecords, setDayRecords] = useState<DayAttendanceRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const today = todayISO();

    async function fetchAll() {
      try {
        setLoading(true);
        setError(null);

        const empRes = await api.get<{ employees: DirectoryEmployee[] }>(
          "/employees",
        );

        setEmployees(empRes.data.employees);
        if (isAdmin) {
          const statusRes = await api.get<{ data: DayAttendanceRecord[] }>(
            `/attendance/day?date=${today}`,
          );
          setDayRecords(statusRes.data.data);
        } else {
          setDayRecords([]);
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Failed to load employees";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, [isAdmin]);

  // ─── Search filter ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.department?.toLowerCase().includes(q),
    );
  }, [employees, search]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">
              People Directory
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">Employees</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Browse teammates, check departments, and open a profile for work details. Admins can also review live status and add new employees.
            </p>
          </div>

          {isAdmin && (
            <Link
              href="/admin/employees/new"
              className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
            >
              + Add Employee
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-slate-950">
            {employees.length > 0
              ? `${employees.length} team member${employees.length === 1 ? "" : "s"}`
              : "Team members"}
          </p>
          <p className="text-xs text-slate-500">Showing {filtered.length} result{filtered.length === 1 ? "" : "s"}</p>
        </div>

        <div className="relative w-full sm:max-w-sm">
          <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          </span>
          <input
            id="employee-search"
            type="search"
            placeholder="Search by name or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white"
          />
        </div>
      </div>

      {isAdmin && !loading && !error && employees.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Present", dayRecords.filter((record) => record.status === "PRESENT" || record.status === "HALF_DAY").length, "bg-emerald-50 text-emerald-700"],
            ["On Leave", dayRecords.filter((record) => record.status === "LEAVE").length, "bg-amber-50 text-amber-700"],
            ["Absent", Math.max(0, employees.length - dayRecords.length), "bg-slate-100 text-slate-700"],
          ].map(([label, value, cls]) => (
            <div key={label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
              <p className={`mt-4 inline-flex rounded-2xl px-4 py-2 text-3xl font-bold ${cls}`}>
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-3xl border border-slate-200 bg-white" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="font-semibold text-red-700">{error}</p>
          <p className="mt-1 text-sm text-red-500">Check that the backend is running and you are logged in.</p>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-16 text-center">
          <p className="font-semibold text-slate-700">No employees found</p>
          {search && <p className="mt-1 text-sm text-slate-500">Try a different search term.</p>}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((emp) => (
            <EmployeeCard
              key={emp.id}
              employee={emp}
              status={computeStatus(emp.id, dayRecords, isAdmin)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
