"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { YuIcon } from "@/components/ui/YuIcons";

// ─── Types ────────────────────────────────────────────────────────────────────
interface LeaveRequest {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  allocationDays: number;
  status: string;
  reason: string | null;
  createdAt: string;
  adminComment: string | null;
}

interface LeaveAllocation {
  id: string;
  leaveType: string;
  totalDays: number;
  usedDays: number;
  year: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });

const STATUS_STYLE: Record<string, { tx: string; label: string }> = {
  APPROVED: { tx: "--green-700", label: "APPROVED" },
  PENDING:  { tx: "--amber-700", label: "PENDING"  },
  REJECTED: { tx: "--red-700",   label: "REJECTED"  },
};

const Sparklines = {
  down1: (
    <svg width="82" height="34" viewBox="0 0 82 34" fill="none">
      <defs>
        <linearGradient id="g4e" x1="0" y1="0" x2="0" y2="34">
          <stop offset="0%" stopColor="var(--chart-line)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--chart-line)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0 34 L0 5 L15 12 L30 8 L45 18 L60 22 L82 28 L82 34 Z" fill="url(#g4e)" />
      <path d="M0 5 L15 12 L30 8 L45 18 L60 22 L82 28" stroke="var(--chart-line)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

// ─── Apply Leave Modal ────────────────────────────────────────────────────────
function ApplyModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) {
  const [leaveType, setLeaveType] = useState("PAID");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const today = new Date().toISOString().slice(0, 10);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!startDate || !endDate) { setErr("Both dates are required."); return; }
    if (startDate > endDate)    { setErr("Start date cannot be after end date."); return; }
    setSubmitting(true);
    setErr("");
    try {
      await api.post("/leave", { leaveType, startDate, endDate, reason: reason.trim() || undefined });
      onSubmit();
    } catch (e: any) {
      setErr(e.response?.data?.error || "Failed to submit leave request.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = "w-full px-3 py-2 rounded-[8px] bg-field border border-[var(--border-default)] text-body-regular text-primary focus:outline-none focus:border-[var(--border-strong)] transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-field-on-canvas border border-[var(--border-default)] rounded-[16px] p-8 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[18px] font-semibold text-primary">Request Leave</h2>
          <button onClick={onClose} className="text-icon-muted hover:text-icon-strong"><YuIcon name="x" width={18} height={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-label-caps text-secondary uppercase mb-2">Leave Type</label>
            <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)} className={inputCls}>
              <option value="PAID">Paid Leave</option>
              <option value="SICK">Sick Leave</option>
              <option value="UNPAID">Unpaid Leave</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-label-caps text-secondary uppercase mb-2">Start Date</label>
              <input type="date" min={today} value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-label-caps text-secondary uppercase mb-2">End Date</label>
              <input type="date" min={startDate || today} value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-label-caps text-secondary uppercase mb-2">Reason (optional)</label>
            <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Add a note…" className={`${inputCls} resize-none`} />
          </div>
          {err && (
            <div className="flex items-start gap-2 rounded-[8px] px-4 py-3 text-body-regular" style={{ backgroundColor: "var(--red-50)", color: "var(--red-700)" }}>
              <YuIcon name="info-circle" width={16} height={16} className="mt-0.5 shrink-0" />
              {err}
            </div>
          )}
          <div className="flex justify-end gap-3 mt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-[10px] text-body-medium text-secondary bg-field hover:bg-field-on-canvas border border-[var(--border-default)] transition-all">Cancel</button>
            <button type="submit" disabled={submitting} className="px-5 py-2.5 rounded-[10px] text-body-medium font-semibold text-on-primary bg-primary hover:opacity-90 disabled:opacity-60 transition-all">
              {submitting ? "Submitting…" : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function EmployeeTimeOffPage() {
  const [requests, setRequests]       = useState<LeaveRequest[]>([]);
  const [allocations, setAllocations] = useState<LeaveAllocation[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [tab, setTab]                 = useState<"ALL" | "APPROVED" | "PENDING">("ALL");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [reqRes, allocRes] = await Promise.all([
        api.get<{ success: boolean; data: LeaveRequest[] }>("/leave/me"),
        api.get<{ success: boolean; data: LeaveAllocation[] }>("/leave/allocations/me"),
      ]);
      setRequests(reqRes.data.data || []);
      setAllocations(allocRes.data.data || []);
    } catch {
      // empty state handles it
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const paid   = allocations.find((a) => a.leaveType === "PAID");
  const sick   = allocations.find((a) => a.leaveType === "SICK");
  const usedPaid   = paid?.usedDays ?? 0;
  const totalPaid  = paid?.totalDays ?? 24;
  const pendingDays = requests.filter((r) => r.status === "PENDING").reduce((s, r) => s + r.allocationDays, 0);
  const available   = totalPaid - usedPaid;

  const filtered = requests.filter((r) =>
    tab === "ALL" ? true : r.status === tab
  );

  return (
    <>
      {showModal && (
        <ApplyModal
          onClose={() => setShowModal(false)}
          onSubmit={() => { setShowModal(false); load(); }}
        />
      )}

      <div className="flex flex-col min-w-0 pb-[100px]">
        {/* ─── KPI Strip ──────────────────────────────────────────────────── */}
        <div className="kpi-scroll-container flex border-b border-[var(--border-default)]" style={{ height: "112px" }}>
          <div className="flex w-full min-w-[1160px]">
            <div className="relative flex-shrink-0" style={{ width: "290px", height: "111px" }}>
              <div className="absolute top-[19.8px] left-[20.8px] text-body-medium text-secondary">Total Allowance</div>
              <div className="absolute top-[53px] left-[20.8px] flex items-center gap-2">
                <span className="text-kpi-value text-primary">{totalPaid}</span>
                <div className="flex items-center rounded-[7px] px-2 h-[26px]" style={{ backgroundColor: "var(--bg-canvas)" }}>
                  <span className="text-label-score text-secondary">Days / yr</span>
                </div>
              </div>
            </div>
            <div className="relative flex-shrink-0 border-l border-[var(--border-default)]" style={{ width: "290px", height: "111px" }}>
              <div className="absolute top-[19.8px] left-[20.8px] text-body-medium text-secondary">Used Leave</div>
              <div className="absolute top-[53px] left-[20.8px] flex items-center gap-2">
                <span className="text-kpi-value text-primary">{usedPaid}</span>
                <div className="flex items-center rounded-[7px] px-2 h-[26px]" style={{ backgroundColor: "var(--red-50)" }}>
                  <YuIcon name="trend-down-01" width={16} height={16} className="text-[#f87171]" />
                  <span className="ml-[4px] text-label-score" style={{ color: "var(--red-700)" }}>Days</span>
                </div>
              </div>
              <div className="absolute top-[44px] right-[18.5px]">{Sparklines.down1}</div>
            </div>
            <div className="relative flex-shrink-0 border-l border-[var(--border-default)]" style={{ width: "290px", height: "111px" }}>
              <div className="absolute top-[19.8px] left-[20.8px] text-body-medium text-secondary">Pending Approval</div>
              <div className="absolute top-[53px] left-[20.8px] flex items-center gap-2">
                <span className="text-kpi-value text-primary">{pendingDays}</span>
                <div className="flex items-center rounded-[7px] px-2 h-[26px]" style={{ backgroundColor: "var(--amber-50)" }}>
                  <span className="text-label-score" style={{ color: "var(--amber-700)" }}>Days</span>
                </div>
              </div>
            </div>
            <div className="relative flex-shrink-0 border-l border-[var(--border-default)] flex-1" style={{ minWidth: "290px", height: "111px" }}>
              <div className="absolute top-[19.8px] left-[20.8px] text-body-medium text-secondary">Available Balance</div>
              <div className="absolute top-[53px] left-[20.8px] flex items-center gap-2">
                <span className="text-kpi-value text-primary">{available}</span>
                <div className="flex items-center rounded-[7px] px-2 h-[26px]" style={{ backgroundColor: "var(--green-50)" }}>
                  <span className="text-label-score" style={{ color: "var(--green-700)" }}>Days</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Tabs ───────────────────────────────────────────────────────── */}
        <div className="tabs-scroll-container flex border-b border-[var(--border-default)] relative" style={{ height: "55px" }}>
          <div className="flex items-center h-full min-w-[1160px] pl-[20px]">
            {(["ALL", "APPROVED", "PENDING"] as const).map((t, i) => (
              <button key={t} onClick={() => setTab(t)} className={`flex items-center h-full relative ${tab === t ? "text-primary" : "text-secondary"}`} style={{ padding: i === 0 ? "0 14px 0 16.6px" : "0 22px" }}>
                <span className="text-label-tab whitespace-nowrap">{t === "ALL" ? "All Requests" : t === "APPROVED" ? "Approved" : "Pending"}</span>
                {t === "ALL" && (
                  <>
                    <div className="w-[4.4px]" />
                    <div className="flex items-center justify-center rounded-[7px] bg-field-on-canvas w-[37px] h-[26px] ml-1">
                      <span className="text-label-score text-secondary">{requests.length}</span>
                    </div>
                  </>
                )}
                {tab === t && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary" />}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Toolbar ────────────────────────────────────────────────────── */}
        <div className="flex items-center min-w-0" style={{ height: "93px", paddingTop: "29px", paddingBottom: "26px", paddingLeft: "18px", paddingRight: "18px" }}>
          <div className="flex items-center">
            <div className="flex items-center rounded-[10px] bg-field-on-canvas" style={{ width: "283px", height: "38px", paddingLeft: "9px" }}>
              <YuIcon name="search-md" width={16} height={16} className="text-icon-muted" />
              <span className="ml-[8px] text-body-regular text-tertiary">Search requests</span>
            </div>
          </div>
          <div className="flex-1" />
          <button onClick={() => setShowModal(true)} className="flex items-center justify-center rounded-[10px] bg-primary text-on-primary whitespace-nowrap" style={{ width: "138px", height: "36px", padding: "0 12px", gap: "8px" }}>
            <YuIcon name="plus" width={16} height={16} />
            <span className="text-body-medium font-semibold">Request Leave</span>
          </button>
        </div>

        {/* ─── Table ──────────────────────────────────────────────────────── */}
        <div className="table-scroll-container">
          {loading ? (
            <div className="flex items-center justify-center py-24 text-secondary text-body-regular">Loading leave requests…</div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-24 text-secondary text-body-regular">No leave requests yet</div>
          ) : (
            <table className="w-full text-left table-fixed table-min-width" style={{ borderCollapse: "collapse" }}>
              <colgroup>
                <col style={{ width: "66px" }} />
                <col style={{ width: "140px" }} />
                <col style={{ width: "140px" }} />
                <col style={{ width: "140px" }} />
                <col style={{ width: "110px" }} />
                <col style={{ width: "130px" }} />
                <col />
                <col style={{ width: "140px" }} />
                <col style={{ width: "34px" }} />
              </colgroup>
              <thead>
                <tr style={{ height: "33px", borderBottom: "1px solid var(--border-default)" }}>
                  <th scope="col" className="font-normal" style={{ paddingLeft: "19px" }}>
                    <div className="flex items-center justify-center rounded-[5px] bg-primary w-[18px] h-[18px]">
                      <div className="w-[10px] h-[2px] bg-[var(--text-on-primary)]" />
                    </div>
                  </th>
                  {["Leave Type", "Start Date", "End Date", "Duration", "Status", "Notes", "Requested"].map((h) => (
                    <th key={h} scope="col" className="text-body-regular text-secondary font-normal p-0">{h}</th>
                  ))}
                  <th scope="col" className="font-normal" style={{ paddingRight: "18px" }} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const st = STATUS_STYLE[row.status] || STATUS_STYLE.PENDING;
                  return (
                    <tr key={row.id} className="group hover:bg-sidebar transition-colors" style={{ height: "61.5px", borderBottom: "1px solid var(--border-default)" }}>
                      <td className="sticky-col-1" style={{ paddingLeft: "19px" }}>
                        <div className="flex items-center justify-center rounded-[5px] w-[18px] h-[18px] bg-field" />
                      </td>
                      <td className="sticky-col-2 p-0 text-body-medium text-primary truncate pr-2">{row.leaveType}</td>
                      <td className="p-0 text-body-regular text-secondary truncate pr-2">{fmtDate(row.startDate)}</td>
                      <td className="p-0 text-body-regular text-secondary truncate pr-2">{fmtDate(row.endDate)}</td>
                      <td className="p-0" style={{ paddingTop: "3px" }}>
                        <span className="inline-flex items-center justify-center rounded-[7px] text-label-score" style={{ height: "26px", padding: "4px 6px", backgroundColor: "var(--bg-canvas)", color: "var(--text-secondary)" }}>
                          {row.allocationDays} {row.allocationDays === 1 ? "day" : "days"}
                        </span>
                      </td>
                      <td className="p-0">
                        <span className="inline-flex items-center justify-center rounded-[7px] border text-label-caps" style={{ height: "23px", padding: "0 8px", backgroundColor: "white", color: `var(${st.tx})`, borderColor: `var(${st.tx})` }}>
                          {st.label}
                        </span>
                      </td>
                      <td className="p-0 text-body-regular text-secondary truncate pr-2">{row.reason || "—"}</td>
                      <td className="p-0 text-body-regular text-secondary truncate pr-2">{fmtDate(row.createdAt)}</td>
                      <td className="p-0" style={{ paddingRight: "18px" }}>
                        <YuIcon name="dots-horizontal" width={16} height={16} className="text-icon-muted float-right" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
