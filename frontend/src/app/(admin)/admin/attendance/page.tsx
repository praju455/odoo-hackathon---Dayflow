"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import type { DirectoryEmployee, AttendanceRecord } from "@/types/employee";
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

function calculateHours(checkIn: string | null, checkOut: string | null) {
  if (!checkIn || !checkOut) return { workHours: "-", extraHours: "-" };
  
  // Assuming HH:mm format
  const [inH, inM] = checkIn.split(":").map(Number);
  const [outH, outM] = checkOut.split(":").map(Number);
  
  const totalMinutes = (outH * 60 + outM) - (inH * 60 + inM);
  if (totalMinutes <= 0) return { workHours: "0h", extraHours: "0h" };

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  
  // Typical standard hours is 8 hours per day
  const STANDARD_MINUTES = 8 * 60;
  
  let extraMins = totalMinutes - STANDARD_MINUTES;
  if (extraMins < 0) extraMins = 0;
  
  const extraH = Math.floor(extraMins / 60);
  const extraM = extraMins % 60;
  
  return {
    workHours: `${hours}h ${mins}m`,
    extraHours: extraMins > 0 ? `${extraH}h ${extraM}m` : "-",
  };
}

export default function AdminAttendancePage() {
  const [date, setDate] = useState<string>(getTodayISO());
  const [showDayOfWeek, setShowDayOfWeek] = useState(false);
  const [search, setSearch] = useState("");
  
  const [employees, setEmployees] = useState<DirectoryEmployee[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [loading, setLoading] = useState(true);

  // ─── Data Fetching ──────────────────────────────────────────────────────────
  
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // 1. Fetch all employees
        const empRes = await api.get<{ employees: DirectoryEmployee[] }>("/employees");
        setEmployees(empRes.data.employees);

        // 2. Fetch attendance for specific date
        // TODO: replace mock with real API when Members 1&2 ship attendance routes
        let attData: AttendanceRecord[] = [];
        try {
          const attRes = await api.get<{ attendance: AttendanceRecord[] }>(`/attendance?date=${date}`);
          attData = attRes.data.attendance || [];
        } catch (e) {
          // Fallback to rich mock for demo
          attData = [
            { id: "a1", userId: "emp-101", date, status: "PRESENT", checkIn: "09:02", checkOut: "17:15" },
            { id: "a2", userId: "emp-102", date, status: "PRESENT", checkIn: "08:50", checkOut: "18:00" },
            { id: "a3", userId: "emp-103", date, status: "HALF_DAY", checkIn: "09:30", checkOut: "13:00" },
          ]; // TODO: replace mock with real API
        }
        
        // Map attendance by userId for quick lookup
        const attMap: Record<string, AttendanceRecord> = {};
        attData.forEach(a => { attMap[a.userId] = a; });
        setAttendance(attMap);
        
      } catch (err) {
        console.error("Failed to fetch attendance data", err);
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
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
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
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Date Navigation */}
          <div className="flex items-center rounded-lg border border-gray-200 bg-white p-1">
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
              className="px-3 py-1 text-sm font-medium text-gray-700 min-w-[120px] text-center hover:bg-gray-50 rounded-md"
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
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/50 text-xs uppercase tracking-wider text-gray-500 border-b border-gray-100">
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
                  const record = attendance[emp.id];
                  const { workHours, extraHours } = calculateHours(record?.checkIn || null, record?.checkOut || null);
                  
                  return (
                    <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={emp.name} src={emp.profilePictureUrl} size="sm" />
                          <div className="font-medium text-gray-900">{emp.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {record?.status === "PRESENT" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span> Present
                          </span>
                        ) : record?.status === "HALF_DAY" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-yellow-500"></span> Half Day
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-gray-400"></span> Absent
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-700">{record?.checkIn || "-"}</td>
                      <td className="px-6 py-4 font-mono text-gray-700">{record?.checkOut || "-"}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{workHours}</td>
                      <td className="px-6 py-4 text-orange-600">{extraHours}</td>
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
