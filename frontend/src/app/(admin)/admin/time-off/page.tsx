"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import type { LeaveRecord } from "@/types/employee";
import Avatar from "@/components/ui/Avatar";

export default function AdminTimeOffPage() {
  const [pendingRequests, setPendingRequests] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // A mapping of user ID to name for display purposes
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchRequests() {
      setLoading(true);
      try {
        // 1. Fetch pending leave requests
        // TODO: Replace with real API. Expected: GET /api/leave-requests?status=PENDING
        let requests: LeaveRecord[] = [];
        try {
          const res = await api.get<{ leaveRequests: LeaveRecord[] }>("/leave-requests?status=PENDING");
          requests = res.data.leaveRequests || [];
        } catch (e) {
          // Mock data fallback if endpoint isn't ready
          requests = [
            {
              id: "req-1",
              userId: "emp-101",
              type: "SICK",
              startDate: "2026-08-25",
              endDate: "2026-08-26",
              reason: "Fever and cold",
              status: "PENDING",
            },
            {
              id: "req-2",
              userId: "emp-102",
              type: "VACATION",
              startDate: "2026-09-01",
              endDate: "2026-09-05",
              reason: "Family trip",
              status: "PENDING",
            }
          ];
        }
        setPendingRequests(requests);

        // 2. Fetch employee names to map userId -> Name
        try {
          const empRes = await api.get("/employees");
          const map: Record<string, string> = {};
          empRes.data.employees.forEach((emp: any) => {
            map[emp.id] = emp.name;
          });
          setUserNames(map);
        } catch (e) {
          console.error("Failed to fetch employees for name mapping", e);
        }

      } catch (err: any) {
        setError(err.message || "Failed to load leave requests");
      } finally {
        setLoading(false);
      }
    }

    fetchRequests();
  }, []);

  const handleAction = async (requestId: string, newStatus: "APPROVED" | "REJECTED") => {
    try {
      // Optimistic update
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));
      
      // TODO: Replace with real API
      // await api.patch(`/leave-requests/${requestId}`, { status: newStatus });
    } catch (err) {
      console.error("Failed to update status", err);
      // Re-fetch or handle error in real app
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Time Off Management</h1>
        <p className="text-sm text-gray-500 mt-1">Review and approve employee leave requests.</p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Pending Requests Table */}
      <div className="card overflow-hidden">
        <div className="border-b border-gray-100 bg-white px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">Pending Approvals</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/50 text-xs uppercase tracking-wider text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium">Employee</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Dates</th>
                <th className="px-6 py-4 font-medium">Reason</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">Loading requests...</td>
                </tr>
              ) : pendingRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <svg className="h-10 w-10 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      No pending leave requests. You're all caught up!
                    </div>
                  </td>
                </tr>
              ) : (
                pendingRequests.map(req => {
                  const empName = userNames[req.userId] || "Unknown Employee";
                  
                  return (
                    <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={empName} size="sm" />
                          <div className="font-medium text-gray-900">{empName}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                          {req.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        {req.startDate} <span className="text-gray-400 mx-1">→</span> {req.endDate}
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate" title={req.reason}>
                        {req.reason || "-"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleAction(req.id, "REJECTED")}
                            className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleAction(req.id, "APPROVED")}
                            className="inline-flex items-center rounded-md bg-indigo-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                          >
                            Approve
                          </button>
                        </div>
                      </td>
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
