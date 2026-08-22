"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

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

function fmtDateCell(isoDate: string) {
  return new Date(isoDate).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function fmtTime(iso: string | null): string {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "-";
  }
}

function fmtHours(h: number | null | undefined): string {
  if (h == null) return "-";
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

function statusClass(status: AttendanceRecord["status"]) {
  if (status === "PRESENT") return "bg-[#e6f7ed] text-[#147a4b]";
  if (status === "HALF_DAY") return "bg-[#fff5dc] text-[#936514]";
  if (status === "LEAVE") return "bg-[#eef0ff] text-[#4646c8]";
  return "bg-[#f1f2ef] text-[#7d847c]";
}

function StatCard({
  label,
  value,
  note,
  featured,
}: {
  label: string;
  value: string | number;
  note: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl p-5 shadow-2xl ${
        featured
          ? "bg-gradient-to-br from-[#064423] via-[#0c693b] to-[#198954] text-white"
          : "bg-[#050505] text-[#111814]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-bold">{label}</p>
        <span
          className={`grid h-9 w-9 place-items-center rounded-full border text-sm ${
            featured ? "border-white/30 bg-[#050505] text-[#0b4f2d]" : "border-[#dfe3dd] bg-[#050505] text-[#111814]"
          }`}
        >
          ↗
        </span>
      </div>
      <p className="mt-5 text-5xl font-bold leading-none tracking-tight">{value}</p>
      <p className={`mt-4 text-xs ${featured ? "text-white/75" : "text-[#70786f]"}`}>{note}</p>
    </div>
  );
}

export default function AttendancePage() {
  const { user } = useAuth();
  const now = nowYM();
  const [year, setYear] = useState(now.year);
  const [month, setMonth] = useState(now.month);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchRecords = useCallback(async (y: number, m: number) => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const { data } = await api.get<AttendanceResponse>(`/attendance/me?month=${toMonthStr(y, m)}`);
      const sorted = [...data.data].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
      setRecords(sorted);
    } catch {
      setFetchError("Failed to load attendance records.");
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRecords(year, month);
  }, [fetchRecords, year, month]);

  const isCurrentMonth = year === now.year && month === now.month;

  function prevMonth() {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (isCurrentMonth) return;
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  const summary = useMemo(() => {
    const presentDays = records.filter((r) => r.status === "PRESENT" || r.status === "HALF_DAY").length;
    const leaveDays = records.filter((r) => r.status === "LEAVE").length;
    const absentDays = records.filter((r) => r.status === "ABSENT").length;
    const totalWorkHrs = records.reduce((sum, r) => sum + (r.workHours ?? 0), 0);
    const extraHours = records.reduce((sum, r) => sum + (r.extraHours ?? 0), 0);
    const latest = [...records].reverse().find((r) => r.checkIn || r.checkOut || r.status !== "ABSENT");
    const progress = records.length > 0 ? Math.round((presentDays / records.length) * 100) : 0;

    return { presentDays, leaveDays, absentDays, totalWorkHrs, extraHours, latest, progress };
  }, [records]);

  const miniBars = useMemo(() => {
    const recent = records.slice(-7);
    return recent.length ? recent : Array.from({ length: 7 }, (_, index) => ({
      id: `empty-${index}`,
      userId: "",
      date: new Date(year, month - 1, index + 1).toISOString(),
      checkIn: null,
      checkOut: null,
      workHours: null,
      extraHours: null,
      status: "ABSENT" as const,
    }));
  }, [month, records, year]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-[-0.04em] text-[#111814]">Dashboard</h1>
          <p className="mt-2 text-sm text-[#8b9188]">
            Welcome back, {user?.name?.split(" ")[0] ?? "there"}. Track your workday and monthly rhythm.
          </p>
        </div>

        <div className="flex items-center rounded-full border border-[#dfe3dd] bg-[#050505] p-1 shadow-2xl">
          <button
            type="button"
            onClick={prevMonth}
            className="grid h-10 w-10 place-items-center rounded-full text-[#7d847c] hover:bg-[#f1f3ef]"
            aria-label="Previous month"
          >
            ‹
          </button>
          <span className="min-w-[150px] px-3 text-center text-sm font-bold text-[#111814]">
            {fmtMonthLabel(year, month)}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            disabled={isCurrentMonth}
            className="grid h-10 w-10 place-items-center rounded-full text-[#7d847c] hover:bg-[#f1f3ef] disabled:opacity-30"
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>

      {fetchError && (
        <div className="rounded-3xl border border-red-100 bg-red-50 p-5 text-sm font-semibold text-red-700">
          {fetchError}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Days Present" value={summary.presentDays} note="Present or half-day records" featured />
        <StatCard label="Work Hours" value={fmtHours(summary.totalWorkHrs)} note="Total tracked this month" />
        <StatCard label="Leave Days" value={summary.leaveDays} note="Approved leave entries" />
        <StatCard label="Extra Hours" value={fmtHours(summary.extraHours)} note="Beyond regular schedule" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr_0.68fr]">
        <section className="rounded-3xl bg-[#050505] p-5 shadow-2xl">
          <h2 className="text-base font-bold text-[#111814]">Weekly Activity</h2>
          <div className="mt-5 flex h-44 items-end justify-between gap-3">
            {miniBars.map((item, index) => {
              const hours = item.workHours ?? 0;
              const height = Math.max(22, Math.min(100, hours * 12));
              const isStrong = item.status === "PRESENT" || item.status === "HALF_DAY";
              return (
                <div key={item.id} className="flex flex-1 flex-col items-center gap-3">
                  <div
                    className={`w-full max-w-[54px] rounded-full ${
                      isStrong ? "bg-[#137d4c]" : index % 2 ? "bg-[#d6ddd4]" : "bg-[repeating-linear-gradient(135deg,#d6ddd4_0,#d6ddd4_3px,transparent_3px,transparent_7px)]"
                    }`}
                    style={{ height: `${height}%` }}
                    title={`${fmtDateCell(item.date)} - ${fmtHours(item.workHours)}`}
                  />
                  <span className="text-xs font-semibold text-[#8b9188]">
                    {new Date(item.date).toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl bg-[#050505] p-5 shadow-2xl">
          <h2 className="text-base font-bold text-[#111814]">Today</h2>
          <div className="mt-5">
            <p className="text-2xl font-bold leading-tight tracking-[-0.04em] text-[#102016]">
              {summary.latest?.status ? summary.latest.status.replace("_", " ") : "No entry yet"}
            </p>
            <p className="mt-2 text-sm text-[#8b9188]">
              Check in: {fmtTime(summary.latest?.checkIn ?? null)}
            </p>
            <p className="mt-1 text-sm text-[#8b9188]">
              Check out: {fmtTime(summary.latest?.checkOut ?? null)}
            </p>
            <p className="mt-7 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold leading-6 text-emerald-800">
              Use the floating button at the bottom-right to check in or check out.
            </p>
          </div>
        </section>

        <section className="rounded-3xl bg-[#050505] p-5 shadow-2xl">
          <h2 className="text-base font-bold text-[#111814]">Month Mix</h2>
          <div className="mt-5 space-y-4">
            {[
              ["Present", summary.presentDays, "bg-[#168350]"],
              ["Leave", summary.leaveDays, "bg-[#f5b233]"],
              ["Absent", summary.absentDays, "bg-[#e45d46]"],
            ].map(([label, value, color]) => (
              <div key={label}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-bold text-[#111814]">{label}</span>
                  <span className="text-[#8b9188]">{value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#e3e7e1]">
                  <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: `${Math.min(100, Number(value) * 16)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.68fr]">
        <section className="overflow-hidden rounded-3xl bg-[#050505] shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#edf0eb] px-5 py-4">
            <h2 className="text-base font-bold text-[#111814]">Attendance Log</h2>
            <span className="text-xs font-semibold text-[#8b9188]">
              {records.length} record{records.length === 1 ? "" : "s"}
            </span>
          </div>

          {isLoading ? (
            <div className="grid min-h-[240px] place-items-center text-sm font-semibold text-[#8b9188]">
              Loading attendance...
            </div>
          ) : records.length === 0 ? (
            <div className="grid min-h-[240px] place-items-center px-6 text-center">
              <div>
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-[#eef1ec] text-2xl text-[#8b9188]">
                  □
                </div>
                <p className="mt-4 text-sm font-bold text-[#111814]">No records found</p>
                <p className="mt-1 text-xs text-[#8b9188]">No attendance entries for {fmtMonthLabel(year, month)}</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#fafbf8] text-xs uppercase tracking-[0.12em] text-[#8b9188]">
                  <tr>
                    {["Date", "Check In", "Check Out", "Work Hours", "Extra", "Status"].map((col) => (
                      <th key={col} className="whitespace-nowrap px-5 py-4 font-bold">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf0eb]">
                  {records.map((rec) => (
                    <tr key={rec.id} className="hover:bg-[#fafbf8]">
                      <td className="whitespace-nowrap px-5 py-4 font-bold text-[#111814]">{fmtDateCell(rec.date)}</td>
                      <td className="whitespace-nowrap px-5 py-4 font-mono text-[#137d4c]">{fmtTime(rec.checkIn)}</td>
                      <td className="whitespace-nowrap px-5 py-4 font-mono text-[#7d847c]">{fmtTime(rec.checkOut)}</td>
                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-[#111814]">{fmtHours(rec.workHours)}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-[#e45d46]">
                        {(rec.extraHours ?? 0) > 0 ? `+${fmtHours(rec.extraHours)}` : "-"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(rec.status)}`}>
                          {rec.status.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-3xl bg-[#063a23] p-5 text-white shadow-2xl">
          <h2 className="text-base font-bold">Attendance Progress</h2>
          <div className="mt-8 rounded-[28px] bg-[radial-gradient(circle_at_top_right,#0f7a4b,transparent_45%),linear-gradient(135deg,#062417,#0d5d35)] p-6 text-center shadow-inner">
            <p className="text-6xl font-bold tracking-[-0.06em]">{summary.progress}%</p>
            <p className="mt-2 text-sm text-white/65">Presence ratio this month</p>
            <div className="mt-8 h-2 overflow-hidden rounded-full bg-[#050505]/15">
              <div className="h-full rounded-full bg-[#050505]" style={{ width: `${summary.progress}%` }} />
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-3xl bg-[#050505] p-5 shadow-2xl">
        <h2 className="text-base font-bold text-[#111814]">Quick Actions</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Request leave", "Apply for paid, sick, or unpaid leave.", "/time-off"],
            ["Update profile", "Keep your private and resume details current.", "/profile"],
            ["View directory", "Find teammates and department details.", "/employees"],
            ["Review attendance", "Check your monthly work log.", "/attendance"],
          ].map(([title, body, href]) => (
            <Link
              key={title}
              href={href}
              className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-4 transition hover:border-emerald-200 hover:bg-emerald-50"
            >
              <p className="text-sm font-bold text-white">{title}</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">{body}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
