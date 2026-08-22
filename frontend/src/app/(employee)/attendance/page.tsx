"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import {
  EmptyState,
  LoadingState,
  MetricCard,
  PageIntro,
  Panel,
  StatusPill,
  primaryButton,
  secondaryButton,
} from "@/components/ui/Workspace";

type Attendance = {
  id: string;
  date: string;
  status: string;
  checkIn: string | null;
  checkOut: string | null;
  workHours: number | null;
  extraHours: number | null;
};

type Analytics = {
  totals: { daysPresent: number; workHours: number; extraHours: number; approvedLeaveDays: number };
  attendance: Attendance[];
  today: Attendance | null;
};

const formatTime = (value: string | null) =>
  value ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-";

export default function EmployeeAttendancePage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const response = await api.get("/analytics/me");
      setData(response.data.data);
    } catch {
      setError("Could not load your attendance.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => void load(), [load]);

  const updateDay = async (action: "checkin" | "checkout") => {
    setWorking(true);
    try {
      await api.post(`/attendance/${action}`);
      await load();
    } catch (requestError: any) {
      setError(requestError.response?.data?.error || "Attendance could not be updated.");
    } finally {
      setWorking(false);
    }
  };

  if (loading) return <LoadingState label="Loading attendance" />;

  return (
    <div className="space-y-8">
      <PageIntro title="Attendance" description="Track your workday and review your recent hours." />
      {error && <p className="border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">{error}</p>}

      <section className="grid gap-px bg-zinc-800 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Days present" value={data?.totals.daysPresent ?? 0} detail="This month" />
        <MetricCard label="Work hours" value={`${(data?.totals.workHours ?? 0).toFixed(1)}h`} detail="Tracked this month" />
        <MetricCard label="Extra hours" value={`${(data?.totals.extraHours ?? 0).toFixed(1)}h`} detail="Beyond regular hours" />
        <MetricCard label="Leave days" value={data?.totals.approvedLeaveDays ?? 0} detail="Approved this month" />
      </section>

      <Panel title="Today" action={
        !data?.today?.checkIn ? (
          <button disabled={working} onClick={() => updateDay("checkin")} className={primaryButton}>Check in</button>
        ) : !data.today.checkOut ? (
          <button disabled={working} onClick={() => updateDay("checkout")} className={secondaryButton}>Check out</button>
        ) : <StatusPill status="Completed" />
      }>
        <div className="grid gap-6 text-sm sm:grid-cols-3">
          <div><p className="text-zinc-500">Status</p><div className="mt-2"><StatusPill status={data?.today?.status || "Not started"} /></div></div>
          <div><p className="text-zinc-500">Check in</p><p className="mt-2 text-lg text-white">{formatTime(data?.today?.checkIn ?? null)}</p></div>
          <div><p className="text-zinc-500">Check out</p><p className="mt-2 text-lg text-white">{formatTime(data?.today?.checkOut ?? null)}</p></div>
        </div>
      </Panel>

      <Panel title="Recent attendance">
        {!data?.attendance.length ? <EmptyState title="No attendance yet" detail="Your workday records will appear here." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="text-zinc-500"><tr className="border-b border-zinc-800"><th className="py-3">Date</th><th>Status</th><th>Check in</th><th>Check out</th><th>Hours</th><th>Extra</th></tr></thead>
              <tbody>{data.attendance.map((row) => <tr key={row.id} className="border-b border-zinc-900 last:border-0"><td className="py-4 text-white">{new Date(row.date).toLocaleDateString()}</td><td><StatusPill status={row.status} /></td><td>{formatTime(row.checkIn)}</td><td>{formatTime(row.checkOut)}</td><td>{row.workHours?.toFixed(1) ?? "-"}</td><td>{row.extraHours?.toFixed(1) ?? "-"}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
