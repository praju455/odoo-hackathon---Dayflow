"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import Avatar from "@/components/ui/Avatar";
import type { DirectoryEmployee, LeaveAllocation, LeaveRecord } from "@/types/employee";

type Tab = "requests" | "allocations";
type Decision = "APPROVED" | "REJECTED";
interface EmployeeAllocations { employee: DirectoryEmployee; allocations: LeaveAllocation[]; }

function extractError(error: unknown) {
  return (error as { response?: { data?: { error?: string } } })?.response?.data?.error
    ?? "The request could not be completed.";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminTimeOffPage() {
  const [tab, setTab] = useState<Tab>("requests");
  const [requests, setRequests] = useState<LeaveRecord[]>([]);
  const [allocationRows, setAllocationRows] = useState<EmployeeAllocations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decision, setDecision] = useState<{ request: LeaveRecord; status: Decision } | null>(null);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [requestResponse, employeeResponse] = await Promise.all([
        api.get<{ data: LeaveRecord[] }>("/leave"),
        api.get<{ employees: DirectoryEmployee[] }>("/employees"),
      ]);
      const employees = employeeResponse.data.employees;
      setRequests(requestResponse.data.data);
      setAllocationRows(await Promise.all(employees.map(async (employee) => {
        const response = await api.get<{ data: LeaveAllocation[] }>(`/leave/allocations/${employee.id}`);
        return { employee, allocations: response.data.data };
      })));
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  async function submitDecision() {
    if (!decision) return;
    setSaving(true);
    setError(null);
    try {
      await api.put(`/leave/${decision.request.id}/status`, {
        status: decision.status,
        adminComment: comment.trim() || undefined,
      });
      setDecision(null);
      setComment("");
      await loadData();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSaving(false);
    }
  }

  const pendingCount = requests.filter((request) => request.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Time Off Management</h1>
        <p className="mt-1 text-sm text-gray-500">Review leave requests and inspect current-year balances.</p>
      </div>

      <div className="inline-flex rounded-lg border border-white/10 bg-gray-100 p-1">
        <button onClick={() => setTab("requests")} className={`rounded-md px-4 py-2 text-sm font-medium ${tab === "requests" ? "bg-[#050505] text-white shadow-2xl" : "text-gray-500"}`}>Time Off ({pendingCount})</button>
        <button onClick={() => setTab("allocations")} className={`rounded-md px-4 py-2 text-sm font-medium ${tab === "allocations" ? "bg-[#050505] text-white shadow-2xl" : "text-gray-500"}`}>Allocation</button>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="card overflow-hidden">
        {tab === "requests" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="border-b border-gray-100 bg-[#0a0a0a] text-xs uppercase text-gray-500"><tr>
                <th className="px-6 py-4 font-medium">Employee</th><th className="px-6 py-4 font-medium">Dates</th><th className="px-6 py-4 font-medium">Type</th><th className="px-6 py-4 font-medium">Status</th><th className="px-6 py-4 font-medium">Reason</th><th className="px-6 py-4 text-right font-medium">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400">Loading requests...</td></tr>
                  : requests.length === 0 ? <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400">No leave requests.</td></tr>
                  : requests.map((request) => <tr key={request.id}>
                    <td className="px-6 py-4"><div className="flex items-center gap-3"><Avatar name={request.user?.name ?? "Employee"} size="sm" /><div><p className="font-medium text-white">{request.user?.name ?? "Employee"}</p><p className="text-xs text-gray-400">{request.user?.department ?? "No department"}</p></div></div></td>
                    <td className="whitespace-nowrap px-6 py-4">{formatDate(request.startDate)} - {formatDate(request.endDate)}<p className="text-xs text-gray-400">{request.allocationDays} day(s)</p></td>
                    <td className="px-6 py-4">{request.leaveType}</td>
                    <td className="px-6 py-4"><span className={`rounded-full px-2 py-1 text-xs font-medium ${request.status === "APPROVED" ? "bg-green-50 text-green-700" : request.status === "REJECTED" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>{request.status}</span></td>
                    <td className="max-w-xs px-6 py-4" title={request.reason ?? ""}>{request.reason || "-"}</td>
                    <td className="px-6 py-4 text-right">{request.status === "PENDING" ? <div className="flex justify-end gap-2"><button onClick={() => setDecision({ request, status: "REJECTED" })} className="rounded-md border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-[#0a0a0a]">Reject</button><button onClick={() => setDecision({ request, status: "APPROVED" })} className="rounded-md bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-500">Approve</button></div> : <span className="text-xs text-gray-400">Reviewed</span>}</td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full text-left text-sm text-gray-600">
            <thead className="border-b border-gray-100 bg-[#0a0a0a] text-xs uppercase text-gray-500"><tr><th className="px-6 py-4 font-medium">Employee</th><th className="px-6 py-4 font-medium">Paid</th><th className="px-6 py-4 font-medium">Sick</th><th className="px-6 py-4 font-medium">Unpaid</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400">Loading balances...</td></tr> : allocationRows.map(({ employee, allocations }) => <tr key={employee.id}>
                <td className="px-6 py-4 font-medium text-white">{employee.name}</td>
                {(["PAID", "SICK", "UNPAID"] as const).map((type) => { const allocation = allocations.find((item) => item.leaveType === type); const remaining = allocation ? allocation.totalDays - allocation.usedDays : 0; return <td key={type} className="px-6 py-4">{type === "UNPAID" && remaining >= 9999 ? "Unlimited" : `${remaining} / ${allocation?.totalDays ?? 0} days`}</td>; })}
              </tr>)}
            </tbody>
          </table></div>
        )}
      </div>

      {decision && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-md rounded-xl bg-[#050505] p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-white">{decision.status === "APPROVED" ? "Approve" : "Reject"} leave request</h2>
        <p className="mt-1 text-sm text-gray-500">Add an optional comment for {decision.request.user?.name ?? "the employee"}.</p>
        <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={4} className="mt-4 w-full rounded-lg border border-gray-300 p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Optional comment" />
        <div className="mt-5 flex justify-end gap-2"><button disabled={saving} onClick={() => { setDecision(null); setComment(""); }} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700">Cancel</button><button disabled={saving} onClick={submitDecision} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{saving ? "Saving..." : "Confirm"}</button></div>
      </div></div>}
    </div>
  );
}
