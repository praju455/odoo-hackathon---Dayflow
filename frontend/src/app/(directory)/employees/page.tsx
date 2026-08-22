"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import EmployeeCard from "@/components/directory/EmployeeCard";
import type {
  AttendanceRecord,
  DirectoryEmployee,
  EmployeeStatus,
  LeaveRecord,
} from "@/types/employee";

// ─── Status computation ───────────────────────────────────────────────────────

function computeStatus(
  empId: string,
  attendance: AttendanceRecord[],
  leaves: LeaveRecord[],
): EmployeeStatus {
  if (attendance.some((a) => a.userId === empId && a.status === "PRESENT")) {
    return "present";
  }
  if (leaves.some((l) => l.userId === empId)) {
    return "on-leave";
  }
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
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const today = todayISO();

    async function fetchAll() {
      try {
        setLoading(true);
        setError(null);

        // ① Employee list — real API
        const empRes = await api.get<{ employees: DirectoryEmployee[] }>(
          "/employees",
        );

        // ② Today's attendance — TODO: replace mock with real API
        // Expected shape: GET /api/attendance?date=YYYY-MM-DD
        // → { attendance: AttendanceRecord[] }
        let att: AttendanceRecord[] = [];
        try {
          const attRes = await api.get<{ attendance: AttendanceRecord[] }>(
            `/attendance?date=${today}`,
          );
          att = attRes.data.attendance ?? [];
        } catch {
          // Endpoint not yet available — use empty mock
          att = []; // TODO: replace mock with real API
        }

        // ③ Today's approved leaves — TODO: replace mock with real API
        // Expected shape: GET /api/leave-requests?startDate=...&endDate=...&status=APPROVED
        // → { leaveRequests: LeaveRecord[] }
        let lv: LeaveRecord[] = [];
        try {
          const lvRes = await api.get<{ leaveRequests: LeaveRecord[] }>(
            `/leave-requests?startDate=${today}&endDate=${today}&status=APPROVED`,
          );
          lv = lvRes.data.leaveRequests ?? [];
        } catch {
          // Endpoint not yet available — use empty mock
          lv = []; // TODO: replace mock with real API
        }

        setEmployees(empRes.data.employees);
        setAttendance(att);
        setLeaves(lv);
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Failed to load employees";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, []);

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
    <div>
      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {employees.length > 0
              ? `${employees.length} team member${employees.length === 1 ? "" : "s"}`
              : " "}
          </p>
        </div>

        {/* Search & Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                />
              </svg>
            </span>
            <input
              id="employee-search"
              type="search"
              placeholder="Search by name or department…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200
                         bg-white placeholder-gray-400 focus:outline-none focus:ring-2
                         focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>
          
          {isAdmin && (
            <Link
              href="/admin/employees/new"
              className="btn-primary w-full sm:w-auto text-center shrink-0"
            >
              + Add Employee
            </Link>
          )}
        </div>
      </div>

      {/* ── States ──────────────────────────────────────────────────── */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="h-40 rounded-2xl bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <p className="text-red-400 text-sm mt-1">
            Check that the backend is running and you are logged in.
          </p>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 p-16 text-center">
          <p className="text-gray-500 font-medium">No employees found</p>
          {search && (
            <p className="text-gray-400 text-sm mt-1">
              Try a different search term.
            </p>
          )}
        </div>
      )}

      {/* ── Grid ──────────────────────────────────────────────────────── */}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((emp) => (
            <EmployeeCard
              key={emp.id}
              employee={emp}
              status={computeStatus(emp.id, attendance, leaves)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
