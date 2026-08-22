"use client";

import React, { createContext, useContext, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

// Mirrors the backend's Attendance.status enum values (Member 2's schema).
// null means "not yet fetched / unknown" — the dot renders grey until Step 4
// populates it via the check-in widget.
export type TodayAttendanceStatus = "PRESENT" | "ABSENT" | "LEAVE" | null;

interface AttendanceStatusContextValue {
  todayStatus: TodayAttendanceStatus;
  setTodayStatus: (status: TodayAttendanceStatus) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AttendanceStatusContext =
  createContext<AttendanceStatusContextValue | null>(null);

export function AttendanceStatusProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Default null: nav dot shows as grey until Step 4 fetches/sets the real value
  const [todayStatus, setTodayStatus] = useState<TodayAttendanceStatus>(null);

  return (
    <AttendanceStatusContext.Provider value={{ todayStatus, setTodayStatus }}>
      {children}
    </AttendanceStatusContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAttendanceStatus(): AttendanceStatusContextValue {
  const ctx = useContext(AttendanceStatusContext);
  if (!ctx) {
    throw new Error(
      "useAttendanceStatus must be used inside <AttendanceStatusProvider>. " +
        "Make sure the (employee) layout (or equivalent) wraps this component."
    );
  }
  return ctx;
}
