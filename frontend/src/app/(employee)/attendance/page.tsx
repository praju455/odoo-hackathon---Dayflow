"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

// ─── Types (confirmed from backend/src/routes/attendance.js) ─────────────────
//
// GET /api/attendance/me?month=YYYY-MM
//   → { success: true, data: AttendanceRecord[] }
//
// record.date     : UTC midnight ISO string, e.g. "2025-01-15T00:00:00.000Z"
//                   (Prisma @db.Date field serialised as a full ISO datetime)
// record.checkIn  : full ISO datetime string or null
// record.checkOut : full ISO datetime string or null
// record.workHours : Float | null  (decimal hours, e.g. 7.5 = 7h 30m)
// record.extraHours: Float | null  (hours beyond standard 8-hour day)
// record.status   : "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE"
//
// Error shape for attendance routes: { success: false, message: "..." }
// (different from auth routes which use { error: "..." })

interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workHours: number | null;
  extraHours: number | null;
  status: "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE";
}

interface AttendanceResponse {
  success: boolean;
  data: AttendanceRecord[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function nowYM() {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

function toMonthStr(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function fmtMonthLabel(year: number, month: number) {
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

/** Formats the UTC-midnight date field into a local readable string. */
function fmtDateCell(isoDate: string) {
  const d = new Date(isoDate);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/** Formats a full ISO datetime to HH:MM local time. */
function fmtTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

/**
 * Formats decimal hours into "Xh Ym" (e.g. 7.5 → "7h 30m", 8 → "8h").
 * Returns "—" for null/undefined.
 */
function fmtHours(h: number | null | undefined): string {
  if (h == null) return "—";
  const hrs  = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  AttendanceRecord["status"],
  { label: string; cls: string }
> = {
  PRESENT:  { label: "Present",  cls: "bg-green-500/15  text-green-400  border-green-500/25"  },
  ABSENT:   { label: "Absent",   cls: "bg-red-500/15    text-red-400    border-red-500/25"    },
  HALF_DAY: { label: "Half Day", cls: "bg-amber-500/15  text-amber-400  border-amber-500/25"  },
  LEAVE:    { label: "Leave",    cls: "bg-indigo-500/15 text-indigo-400 border-indigo-500/25" },
};

function StatusBadge({ status }: { status: AttendanceRecord["status"] }) {
  const { label, cls } = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cls}`}>
      {label}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AttendancePage() {
  const now = nowYM();
  const [year,  setYear]  = useState(now.year);
  const [month, setMonth] = useState(now.month);

  const [records,   setRecords]   = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // ── Fetch records for current year/month ──────────────────────────────────
  const fetchRecords = useCallback(async (y: number, m: number) => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const { data } = await api.get<AttendanceResponse>(
        `/attendance/me?month=${toMonthStr(y, m)}`
      );
      // Sort ascending by date in case the backend doesn't guarantee order
      const sorted = [...data.data].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setRecords(sorted);
    } catch {
      setFetchError("Failed to load attendance records.");
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchRecords(year, month); }, [fetchRecords, year, month]);

  // ── Month navigation ──────────────────────────────────────────────────────
  const isCurrentMonth = year === now.year && month === now.month;

  function prevMonth() {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else             { setMonth((m) => m - 1); }
  }

  function nextMonth() {
    if (isCurrentMonth) return; // don't navigate into the future
    if (month === 12)   { setYear((y) => y + 1); setMonth(1); }
    else                { setMonth((m) => m + 1); }
  }

  // ── Summary stats ─────────────────────────────────────────────────────────
  const presentDays  = records.filter((r) => r.status === "PRESENT" || r.status === "HALF_DAY").length;
  const leaveDays    = records.filter((r) => r.status === "LEAVE").length;
  const totalWorkHrs = records.reduce((sum, r) => sum + (r.workHours ?? 0), 0);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

      {/* ── Page header + month navigator ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Attendance</h1>
          <p className="text-slate-500 text-sm mt-0.5">Your personal attendance log</p>
        </div>

        {/* Month navigator */}
        <div className="flex items-center gap-1 bg-slate-800/60 border border-slate-700/40
          rounded-xl p-1" role="group" aria-label="Month navigation">
          <button
            type="button"
            onClick={prevMonth}
            aria-label="Previous month"
            className="w-9 h-9 rounded-lg flex items-center justify-center
              text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none"
              viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <span className="text-white text-sm font-medium px-3 min-w-[148px] text-center select-none">
            {fmtMonthLabel(year, month)}
          </span>

          <button
            type="button"
            onClick={nextMonth}
            disabled={isCurrentMonth}
            aria-label="Next month"
            className="w-9 h-9 rounded-lg flex items-center justify-center
              text-slate-400 hover:text-white hover:bg-slate-700
              disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none"
              viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Summary cards (only when records exist) ── */}
      {!isLoading && !fetchError && records.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-5">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">
              Days Present
            </p>
            <p className="text-3xl font-bold text-white">{presentDays}</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-5">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">
              Leave Days
            </p>
            <p className="text-3xl font-bold text-white">{leaveDays}</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-5">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">
              Total Hours
            </p>
            <p className="text-3xl font-bold text-white">{fmtHours(totalWorkHrs)}</p>
          </div>
        </div>
      )}

      {/* ── Table card ── */}
      <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl overflow-hidden">

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <svg className="animate-spin w-7 h-7 text-indigo-500" xmlns="http://www.w3.org/2000/svg"
              fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <p className="text-slate-500 text-sm">Loading…</p>
          </div>
        )}

        {/* Error */}
        {!isLoading && fetchError && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 px-4">
            <p className="text-red-400 text-sm text-center">{fetchError}</p>
            <button
              type="button"
              onClick={() => fetchRecords(year, month)}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !fetchError && records.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-slate-500"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25
                     0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021
                     18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
              </svg>
            </div>
            <p className="text-slate-400 text-sm font-medium">No records found</p>
            <p className="text-slate-600 text-xs">
              No attendance entries for {fmtMonthLabel(year, month)}
            </p>
          </div>
        )}

        {/* Data table */}
        {!isLoading && !fetchError && records.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full" role="table" aria-label="Monthly attendance records">
              <thead>
                <tr className="border-b border-slate-700/60">
                  {["Date", "Check In", "Check Out", "Work Hours", "Extra Hours", "Status"].map(
                    (col) => (
                      <th
                        key={col}
                        scope="col"
                        className="px-5 py-3.5 text-left text-[10px] font-semibold
                          text-slate-500 uppercase tracking-widest whitespace-nowrap"
                      >
                        {col}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-700/30">
                {records.map((rec) => (
                  <tr
                    key={rec.id}
                    className="hover:bg-slate-700/20 transition-colors duration-100"
                  >
                    {/* Date */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-white">
                        {fmtDateCell(rec.date)}
                      </span>
                    </td>

                    {/* Check In */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`text-sm font-mono
                        ${rec.checkIn ? "text-green-400" : "text-slate-600"}`}>
                        {fmtTime(rec.checkIn)}
                      </span>
                    </td>

                    {/* Check Out */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`text-sm font-mono
                        ${rec.checkOut ? "text-amber-400" : "text-slate-600"}`}>
                        {fmtTime(rec.checkOut)}
                      </span>
                    </td>

                    {/* Work Hours */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-300">
                        {fmtHours(rec.workHours)}
                      </span>
                    </td>

                    {/* Extra Hours — highlighted only when > 0 */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {(rec.extraHours ?? 0) > 0 ? (
                        <span className="text-sm font-medium text-indigo-400">
                          +{fmtHours(rec.extraHours)}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-600">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <StatusBadge status={rec.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer: record count */}
      {!isLoading && !fetchError && records.length > 0 && (
        <p className="text-xs text-slate-600 text-right mt-3">
          {records.length} record{records.length !== 1 ? "s" : ""} in {fmtMonthLabel(year, month)}
        </p>
      )}
    </div>
  );
}
