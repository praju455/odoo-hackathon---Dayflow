"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { EmptyState, LoadingState, MetricCard, PageIntro, Panel, StatusPill, inputClass, primaryButton } from "@/components/ui/Workspace";

type Allocation = { id: string; leaveType: string; allocatedDays: number; usedDays: number };
type Request = { id: string; leaveType: string; startDate: string; endDate: string; allocationDays: number; reason: string | null; status: string };
type Analytics = { allocations: Allocation[]; leaveRequests: Request[] };

export default function EmployeeTimeOffPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ leaveType: "PAID", startDate: "", endDate: "", reason: "" });

  const load = useCallback(async () => {
    try { setData((await api.get("/analytics/me")).data); }
    catch { setError("Could not load your leave information."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => void load(), [load]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true); setError("");
    try {
      await api.post("/leave", form);
      setForm({ leaveType: "PAID", startDate: "", endDate: "", reason: "" });
      await load();
    } catch (requestError: any) {
      setError(requestError.response?.data?.error || "Leave request could not be submitted.");
    } finally { setSaving(false); }
  };

  if (loading) return <LoadingState label="Loading time off" />;
  const pending = data?.leaveRequests.filter((item) => item.status === "PENDING").length ?? 0;

  return <div className="space-y-8">
    <PageIntro title="Time off" description="Review balances and send leave requests to your manager." />
    {error && <p className="border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">{error}</p>}
    <section className="grid gap-px bg-zinc-800 sm:grid-cols-2 xl:grid-cols-4">
      {(data?.allocations ?? []).map((item) => <MetricCard key={item.id} label={item.leaveType.replaceAll("_", " ")} value={Math.max(item.allocatedDays - item.usedDays, 0)} detail={`${item.usedDays} of ${item.allocatedDays} days used`} />)}
      <MetricCard label="Pending" value={pending} detail="Awaiting review" />
    </section>

    <Panel title="Request leave">
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <select className={inputClass} value={form.leaveType} onChange={(e) => setForm({ ...form, leaveType: e.target.value })}><option value="PAID">Paid leave</option><option value="SICK">Sick leave</option><option value="UNPAID">Unpaid leave</option></select>
        <input required type="date" className={inputClass} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
        <input required type="date" className={inputClass} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
        <input className={inputClass} placeholder="Reason (optional)" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
        <button disabled={saving} className={`${primaryButton} md:col-span-2 xl:col-span-4 xl:justify-self-end`}>{saving ? "Submitting..." : "Submit request"}</button>
      </form>
    </Panel>

    <Panel title="My requests">
      {!data?.leaveRequests.length ? <EmptyState title="No leave requests" detail="Submitted requests and their status will appear here." /> : <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="text-zinc-500"><tr className="border-b border-zinc-800"><th className="py-3">Type</th><th>Dates</th><th>Days</th><th>Reason</th><th>Status</th></tr></thead><tbody>{data.leaveRequests.map((item) => <tr key={item.id} className="border-b border-zinc-900 last:border-0"><td className="py-4 text-white">{item.leaveType.replaceAll("_", " ")}</td><td>{new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}</td><td>{item.allocationDays}</td><td>{item.reason || "-"}</td><td><StatusPill status={item.status} /></td></tr>)}</tbody></table></div>}
    </Panel>
  </div>;
}
