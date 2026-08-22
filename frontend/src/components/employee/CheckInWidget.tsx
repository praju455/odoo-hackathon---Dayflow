"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useAttendanceStatus } from "@/context/AttendanceStatusContext";

// ─── Types (confirmed from backend/src/routes/attendance.js) ─────────────────
//
// GET  /api/attendance/me?month=YYYY-MM → { success, data: AttendanceRecord[] }
// POST /api/attendance/checkin          → { success, message, data: AttendanceRecord }
// POST /api/attendance/checkout         → { success, message, data: AttendanceRecord }
//
// Error shape for attendance routes: { success: false, message: "..." }
//   (different from auth routes which use { error: "..." } — confirmed from source)
//
// record.date:     UTC midnight ISO string, e.g. "2025-01-15T00:00:00.000Z"
// record.checkIn:  full ISO datetime string or null
// record.checkOut: full ISO datetime string or null
// record.status:   "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE"

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

interface AttendanceListResponse {
  success: boolean;
  data: AttendanceRecord[];
}

interface AttendanceMutationResponse {
  success: boolean;
  message: string;
  data: AttendanceRecord;
}

// ─── Widget state machine ─────────────────────────────────────────────────────
// loading       → fetching today's record on mount
// not-checked-in → no checkIn for today → show green "Check In" button
// checked-in    → checkIn exists, no checkOut → show amber "Check Out" button
// checked-out   → both checkIn and checkOut exist → show "Present today" badge

type WidgetState = "loading" | "not-checked-in" | "checked-in" | "checked-out";

// ─── Date helpers ─────────────────────────────────────────────────────────────

/** Returns today's date in "YYYY-MM-DD" format (local time) */
function todayLocalDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/** Returns current month as "YYYY-MM" */
function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Formats an ISO datetime string to "HH:MM" in local time, e.g. "09:32 AM" */
function formatTime(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

// ─── Spinner ─────────────────────────────────────────────────────────────────
function Spinner({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8H4z"
      />
    </svg>
  );
}

// ─── CheckInWidget ────────────────────────────────────────────────────────────
// Rendered by the (employee) layout so it floats over every employee page.
// Fixed bottom-right position, z-40 (below the nav's z-50).
export default function CheckInWidget() {
  const { setTodayStatus } = useAttendanceStatus();

  const [widgetState, setWidgetState] = useState<WidgetState>("loading");
  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [checkInTime, setCheckInTime]       = useState<string | null>(null);
  const [error, setError]                   = useState<string | null>(null);

  // ─── Fetch today's record on mount ─────────────────────────────────────────
  const fetchTodayStatus = useCallback(async () => {
    try {
      const { data } = await api.get<AttendanceListResponse>(
        `/attendance/me?month=${currentMonth()}`
      );

      // The backend stores date as UTC midnight ISO string: "2025-01-15T00:00:00.000Z"
      // We match by checking if the record's date string starts with today's local date.
      // This covers both "YYYY-MM-DD" and full ISO formats returned by Prisma.
      const today = todayLocalDate();
      const todayRecord = data.data.find((r) => r.date.startsWith(today));

      if (!todayRecord || !todayRecord.checkIn) {
        setWidgetState("not-checked-in");
        // Don't set status to ABSENT here — the admin may have set LEAVE etc.
        // Leave the nav dot as null (grey) until an action is taken.
      } else if (todayRecord.checkIn && !todayRecord.checkOut) {
        setWidgetState("checked-in");
        setCheckInTime(todayRecord.checkIn);
        setTodayStatus("PRESENT");
      } else {
        // checkIn + checkOut both present → fully checked out for the day
        setWidgetState("checked-out");
        setCheckInTime(todayRecord.checkIn);
        setTodayStatus("PRESENT"); // Still present today even after checkout
      }
    } catch {
      // If the fetch fails (e.g., backend not running yet), gracefully fall back
      // to "not-checked-in" so the button is still accessible.
      setWidgetState("not-checked-in");
    }
  }, [setTodayStatus]);

  useEffect(() => {
    fetchTodayStatus();
  }, [fetchTodayStatus]);

  // Auto-clear error after 5 seconds
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(t);
  }, [error]);

  // ─── Check In ──────────────────────────────────────────────────────────────
  async function handleCheckIn() {
    setError(null);
    setIsSubmitting(true);
    try {
      // POST /api/attendance/checkin — no body required (server uses JWT + server time)
      // Confirmed from attendance.js: returns { success, message, data: AttendanceRecord }
      const { data } = await api.post<AttendanceMutationResponse>(
        "/attendance/checkin"
      );

      setWidgetState("checked-in");
      setCheckInTime(data.data.checkIn);
      // Flip the nav dot green immediately (optimistic, per wireframe spec)
      setTodayStatus("PRESENT");
    } catch (err: unknown) {
      // Attendance routes use { success: false, message: "..." } error shape
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Check-in failed. Please try again.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  // ─── Check Out ─────────────────────────────────────────────────────────────
  async function handleCheckOut() {
    setError(null);
    setIsSubmitting(true);
    try {
      // POST /api/attendance/checkout — no body required (server uses JWT + server time)
      // Confirmed from attendance.js: returns { success, message, data: AttendanceRecord }
      await api.post<AttendanceMutationResponse>("/attendance/checkout");

      setWidgetState("checked-out");
      // Dot stays PRESENT — employee is still counted as present for the day
      setTodayStatus("PRESENT");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Check-out failed. Please try again.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2 select-none">

      {/* Error toast — auto-dismisses after 5 s */}
      {error && (
        <div
          role="alert"
          className="
            flex items-start gap-2 max-w-[240px]
            bg-red-500/10 border border-red-500/30
            rounded-xl px-3.5 py-2.5
            text-red-400 text-xs leading-snug
            shadow-lg backdrop-blur-md
          "
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-3.5 h-3.5 shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
          {error}
        </div>
      )}

      {/* ── Loading ── */}
      {widgetState === "loading" && (
        <div
          className="
            h-11 px-5 rounded-2xl
            bg-slate-800/80 border border-slate-700/50
            flex items-center gap-2
            shadow-xl backdrop-blur-md
          "
        >
          <Spinner className="w-4 h-4 text-indigo-400" />
          <span className="text-slate-400 text-xs">Loading…</span>
        </div>
      )}

      {/* ── Not checked in → green Check In button ── */}
      {widgetState === "not-checked-in" && (
        <button
          id="check-in-btn"
          type="button"
          onClick={handleCheckIn}
          disabled={isSubmitting}
          className="
            h-11 px-5 rounded-2xl font-semibold text-sm text-white
            bg-green-600 hover:bg-green-500 active:scale-95
            disabled:opacity-60 disabled:cursor-not-allowed
            flex items-center gap-2
            shadow-xl shadow-green-500/20 backdrop-blur-md
            transition-all duration-200
          "
        >
          {isSubmitting ? (
            <Spinner />
          ) : (
            // Clock icon
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {isSubmitting ? "Checking in…" : "Check In"}
        </button>
      )}

      {/* ── Checked in → amber Check Out button + "in since" label ── */}
      {widgetState === "checked-in" && (
        <div className="flex flex-col items-end gap-1.5">
          {checkInTime && (
            <span className="text-xs text-slate-500 pr-1">
              In since {formatTime(checkInTime)}
            </span>
          )}
          <button
            id="check-out-btn"
            type="button"
            onClick={handleCheckOut}
            disabled={isSubmitting}
            className="
              h-11 px-5 rounded-2xl font-semibold text-sm text-white
              bg-amber-600 hover:bg-amber-500 active:scale-95
              disabled:opacity-60 disabled:cursor-not-allowed
              flex items-center gap-2
              shadow-xl shadow-amber-500/20 backdrop-blur-md
              transition-all duration-200
            "
          >
            {isSubmitting ? (
              <Spinner />
            ) : (
              // Door / exit icon
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M7.5 3.75A1.5 1.5 0 006 5.25v13.5a1.5 1.5 0 001.5 1.5h6a1.5 1.5 0 001.5-1.5V15a.75.75 0 011.5 0v3.75a3 3 0 01-3 3h-6a3 3 0 01-3-3V5.25a3 3 0 013-3h6a3 3 0 013 3V9A.75.75 0 0115 9V5.25a1.5 1.5 0 00-1.5-1.5h-6zm10.72 4.72a.75.75 0 011.06 0l3 3a.75.75 0 010 1.06l-3 3a.75.75 0 11-1.06-1.06l1.72-1.72H9a.75.75 0 010-1.5h10.94l-1.72-1.72a.75.75 0 010-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {isSubmitting ? "Checking out…" : "Check Out"}
          </button>
        </div>
      )}

      {/* ── Checked out → non-interactive "Present today" badge ── */}
      {widgetState === "checked-out" && (
        <div
          className="
            h-11 px-5 rounded-2xl text-sm font-medium
            bg-slate-800/80 border border-slate-700/40
            text-slate-400
            flex items-center gap-2
            shadow-xl backdrop-blur-md
          "
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4 h-4 text-green-500 shrink-0"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
              clipRule="evenodd"
            />
          </svg>
          Present today
        </div>
      )}
    </div>
  );
}
