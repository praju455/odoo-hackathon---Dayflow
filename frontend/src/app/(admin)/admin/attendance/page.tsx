"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { EmptyState, LoadingState, MetricCard, PageIntro, Panel, StatusPill, inputClass } from "@/components/ui/Workspace";

type Row = { user: { id: string; name: string; loginId: string; department?: string }; status: string; attendance?: { checkIn?: string; checkOut?: string; workHours?: number } };
const clock = (value?: string) => value ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-";

export default function AdminAttendancePage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try { setRows((await api.get("/attendance/day", { params: { date } })).data.data || []); } finally { setLoading(false); }
  }, [date]);
  useEffect(() => { load(); }, [load]);
  const filtered = useMemo(() => rows.filter((row) => `${row.user.name} ${row.user.department || ""}`.toLowerCase().includes(query.toLowerCase())), [rows, query]);
  const count = (status: string) => rows.filter((row) => row.status === status).length;
  return <div>
    <PageIntro eyebrow="Admin workspace" title="Attendance" description="A live daily view of your team from the Shiftly database." actions={<input aria-label="Attendance date" className={inputClass} type="date" value={date} onChange={(event) => setDate(event.target.value)} />} />
    <div className="grid sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Team members" value={rows.length} detail="Employees in this company" accent />
      <MetricCard label="Present" value={count("PRESENT")} detail="Checked in or marked present" />
      <MetricCard label="On leave" value={count("LEAVE")} detail="Approved leave today" />
      <MetricCard label="Absent" value={count("ABSENT")} detail="No attendance record" />
    </div>
    <div className="p-5 sm:p-7">
      <Panel title="Daily attendance" description="Search and review real attendance records.">
        <div className="border-b border-white/10 p-4"><input className={inputClass} placeholder="Search employee or department" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        {loading ? <LoadingState /> : filtered.length === 0 ? <EmptyState title="No attendance records" detail="Try another date or search." /> :
          <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="text-xs uppercase text-white/35"><tr>{["Employee","Department","Status","Check in","Check out","Hours"].map((h) => <th className="px-5 py-4 font-medium" key={h}>{h}</th>)}</tr></thead><tbody>{filtered.map((row) => <tr className="border-t border-white/10" key={row.user.id}><td className="px-5 py-4"><p className="font-medium">{row.user.name}</p><p className="text-xs text-white/35">{row.user.loginId}</p></td><td className="px-5 py-4 text-white/55">{row.user.department || "Unassigned"}</td><td className="px-5 py-4"><StatusPill status={row.status === "LEAVE" ? "ON_LEAVE" : row.status} /></td><td className="px-5 py-4">{clock(row.attendance?.checkIn)}</td><td className="px-5 py-4">{clock(row.attendance?.checkOut)}</td><td className="px-5 py-4">{row.attendance?.workHours?.toFixed(1) ?? "-"}h</td></tr>)}</tbody></table></div>}
      </Panel>
    </div>
  </div>;
}
