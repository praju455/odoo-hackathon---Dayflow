"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { EmptyState, LoadingState, MetricCard, PageIntro, Panel, StatusPill, inputClass, primaryButton, secondaryButton } from "@/components/ui/Workspace";

type Request = { id: string; leaveType: string; startDate: string; endDate: string; allocationDays: number; reason?: string; status: string; createdAt: string; user: { name: string; loginId: string; department?: string } };
const day = (value: string) => new Date(value).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });

export default function AdminTimeOffPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const load = useCallback(async () => { setLoading(true); try { setRequests((await api.get("/leave/requests")).data.data || []); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  const update = async (id: string, status: "APPROVED" | "REJECTED") => { setBusy(id); try { await api.patch(`/leave/requests/${id}`, { status }); await load(); } finally { setBusy(""); } };
  const filtered = useMemo(() => requests.filter((item) => (filter === "ALL" || item.status === filter) && `${item.user.name} ${item.user.department || ""} ${item.leaveType}`.toLowerCase().includes(query.toLowerCase())), [requests, filter, query]);
  const count = (status: string) => requests.filter((item) => item.status === status).length;
  return <div>
    <PageIntro eyebrow="Admin workspace" title="Time off" description="Review employee leave requests and keep approvals moving." />
    <div className="grid sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Total requests" value={requests.length} detail="All requests in the database" accent /><MetricCard label="Pending" value={count("PENDING")} detail="Waiting for review" /><MetricCard label="Approved" value={count("APPROVED")} detail="Approved requests" /><MetricCard label="Rejected" value={count("REJECTED")} detail="Rejected requests" /></div>
    <div className="p-5 sm:p-7"><Panel title="Leave requests" description="Approve or reject pending submissions.">
      <div className="grid gap-3 border-b border-white/10 p-4 sm:grid-cols-[1fr_180px]"><input className={inputClass} placeholder="Search employee, team, or leave type" value={query} onChange={(e) => setQuery(e.target.value)} /><select className={inputClass} value={filter} onChange={(e) => setFilter(e.target.value)}>{["ALL","PENDING","APPROVED","REJECTED"].map((value) => <option key={value}>{value}</option>)}</select></div>
      {loading ? <LoadingState /> : filtered.length === 0 ? <EmptyState title="No leave requests" detail="Nothing matches this view." /> : <div className="divide-y divide-white/10">{filtered.map((item) => <div className="grid gap-4 p-5 lg:grid-cols-[1.2fr_1fr_1fr_auto] lg:items-center" key={item.id}><div><p className="font-medium">{item.user.name}</p><p className="text-xs text-white/35">{item.user.department || "Unassigned"} · {item.user.loginId}</p></div><div><p className="text-sm">{item.leaveType} · {item.allocationDays} day{item.allocationDays === 1 ? "" : "s"}</p><p className="text-xs text-white/35">{day(item.startDate)} to {day(item.endDate)}</p></div><div><StatusPill status={item.status} />{item.reason && <p className="mt-2 max-w-xs text-xs text-white/40">{item.reason}</p>}</div><div className="flex gap-2">{item.status === "PENDING" && <><button className={primaryButton} disabled={busy === item.id} onClick={() => update(item.id, "APPROVED")}>Approve</button><button className={secondaryButton} disabled={busy === item.id} onClick={() => update(item.id, "REJECTED")}>Reject</button></>}</div></div>)}</div>}
    </Panel></div>
  </div>;
}
