"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import type { DayAttendanceRecord, DirectoryEmployee } from "@/types/employee";
import Avatar from "@/components/ui/Avatar";

// ─── Date Helpers ─────────────────────────────────────────────────────────────

function getTodayISO() {
  return new Date().toISOString().split("T")[0];
}

function addDays(isoDate: string, days: number) {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function formatDisplayDate(isoDate: string, showDayOfWeek: boolean) {
  const d = new Date(isoDate);
  if (showDayOfWeek) {
    return d.toLocaleDateString("en-IN", { weekday: "long" });
  }
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Time Helpers ─────────────────────────────────────────────────────────────

function formatTime(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatHours(value: number | string | null | undefined) {
  if (value === null || value === undefined) return "-";
  const hours = Number(value);
  if (!Number.isFinite(hours)) return "-";
  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);
  return `${whole}h ${minutes}m`;
}

export default function AdminAttendancePage() {
  const [date, setDate] = useState<string>(getTodayISO());
  const [showDayOfWeek, setShowDayOfWeek] = useState(false);
  const [search, setSearch] = useState("");
  
  const [employees, setEmployees] = useState<DirectoryEmployee[]>([]);
  const [dayRecords, setDayRecords] = useState<Record<string, DayAttendanceRecord>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ─── Data Fetching ──────────────────────────────────────────────────────────
  
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [empRes, attendanceRes] = await Promise.all([
          api.get<{ employees: DirectoryEmployee[] }>("/employees"),
          api.get<{ data: DayAttendanceRecord[] }>(`/attendance/day?date=${date}`),
        ]);
        setEmployees(empRes.data.employees);
        setDayRecords(Object.fromEntries(
          attendanceRes.data.data.map((record) => [record.user.id, record]),
        ));
      } catch (err: unknown) {
        setError(
          (err as { response?: { data?: { error?: string } } })?.response?.data?.error
            ?? "Failed to load attendance data.",
        );
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [date]);

  // ─── Filtering ──────────────────────────────────────────────────────────────
  
  const filteredEmployees = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return employees;
    return employees.filter(e => e.name.toLowerCase().includes(q));
  }, [search, employees]);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Attendance</h1>
          <p className="text-sm text-gray-500 mt-1">Review team check-ins and working hours.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
            </span>
            <input
              type="search"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-white/10 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Date Navigation */}
          <div className="flex items-center rounded-lg border border-white/10 bg-[#050505] p-1">
            <button 
              onClick={() => setDate(addDays(date, -1))}
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button 
              onClick={() => setShowDayOfWeek(!showDayOfWeek)}
              className="px-3 py-1 text-sm font-medium text-gray-700 min-w-[120px] text-center hover:bg-[#0a0a0a] rounded-md"
              title="Click to toggle date format"
            >
              {formatDisplayDate(date, showDayOfWeek)}
            </button>

            <button 
              onClick={() => setDate(addDays(date, 1))}
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-[#0a0a0a]/50 text-xs uppercase tracking-wider text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium">Employee</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Check In</th>
                <th className="px-6 py-4 font-medium">Check Out</th>
                <th className="px-6 py-4 font-medium">Work Hours</th>
                <th className="px-6 py-4 font-medium">Extra Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">Loading attendance data...</td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">No employees found.</td>
                </tr>
              ) : (
                filteredEmployees.map(emp => {
                  const dayRecord = dayRecords[emp.id];
                  const record = dayRecord?.attendance;
                  const status = dayRecord?.status ?? "ABSENT";
                  
                  return (
                    <tr key={emp.id} className="hover:bg-[#0a0a0a]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={emp.name} src={emp.profilePictureUrl} size="sm" />
                          <div className="font-medium text-white">{emp.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {status === "PRESENT" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span> Present
                          </span>
                        ) : status === "HALF_DAY" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-yellow-500"></span> Half Day
                          </span>
                        ) : status === "LEAVE" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">
                            On Leave
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-gray-400"></span> Absent
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-700">{formatTime(record?.checkIn)}</td>
                      <td className="px-6 py-4 font-mono text-gray-700">{formatTime(record?.checkOut)}</td>
                      <td className="px-6 py-4 font-medium text-white">{formatHours(record?.workHours)}</td>
                      <td className="px-6 py-4 text-orange-600">{formatHours(record?.extraHours)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
