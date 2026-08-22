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
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0f7a4b]">
              People Directory
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#111814] sm:text-5xl">Employees</h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-[#7b837a]">
              Browse teammates, check departments, and open a profile for work details. Admins can also review live status and add new employees.
            </p>
          </div>
        </div>

        {isAdmin && (
          <Link
            href="/admin/employees/new"
            className="inline-flex items-center justify-center rounded-full bg-[#0f7a4b] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#0b633c]"
          >
            + Add Employee
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-4 rounded-3xl border border-[#e5e9e2] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-[#111814]">
            {employees.length > 0
              ? `${employees.length} team member${employees.length === 1 ? "" : "s"}`
              : "Team members"}
          </p>
          <p className="text-xs text-[#7b837a]">Showing {filtered.length} result{filtered.length === 1 ? "" : "s"}</p>
        </div>

        <div className="relative w-full sm:max-w-sm">
          <span className="absolute inset-y-0 left-4 flex items-center text-[#7b837a]">
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
            className="h-12 w-full rounded-2xl border border-[#dfe4dd] bg-[#fafbf8] pl-11 pr-4 text-sm text-[#111814] outline-none transition placeholder:text-[#9aa199] focus:border-[#14844f] focus:bg-white"
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
            <div key={label} className="rounded-3xl border border-[#e5e9e2] bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7b837a]">{label}</p>
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
            <div key={i} className="h-48 animate-pulse rounded-3xl border border-[#e5e9e2] bg-white" />
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
        <div className="rounded-3xl border border-dashed border-[#dfe4dd] bg-white p-16 text-center">
          <p className="font-semibold text-[#111814]">No employees found</p>
          {search && <p className="mt-1 text-sm text-[#7b837a]">Try a different search term.</p>}
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
