"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/lib/api";

// ─── Types (confirmed from backend/src/routes/leave.js) ──────────────────────
//
// GET /api/leave/allocations/me  → { success, data: LeaveAllocation[] }
//   Scoped to current year. UNPAID is seeded with totalDays = 9999 (unlimited).
//
// GET /api/leave/requests/me     → { success, data: LeaveRequest[] }
//   Ordered by createdAt desc.
//
// POST /api/leave                → { success, message, data: LeaveRequest } (201)
//   Body: { leaveType, startDate: "YYYY-MM-DD", endDate: "YYYY-MM-DD",
//           reason?, attachmentUrl? }
//   Backend enforces: startDate ≤ endDate, SICK requires attachmentUrl,
//   PAID/SICK checks remaining balance.
//
// Error shape: { success: false, message: "..." }

interface LeaveAllocation {
  id: string;
  userId: string;
  leaveType: "PAID" | "SICK" | "UNPAID";
  totalDays: number;   // UNPAID seeded as 9999 → treat as unlimited
  usedDays: number;
  year: number;
}

interface LeaveRequest {
  id: string;
  userId: string;
  leaveType: "PAID" | "SICK" | "UNPAID";
  startDate: string;        // Prisma @db.Date → UTC midnight ISO string
  endDate: string;
  allocationDays: number;   // computed server-side: (endDate - startDate + 1) inclusive
  reason: string | null;
  attachmentUrl: string | null; // just a string (no file upload endpoint in backend)
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminComment: string | null;
  createdAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function fmtDateRange(s: string, e: string): string {
  const sf = fmtDate(s);
  const ef = fmtDate(e);
  return sf === ef ? sf : `${sf} – ${ef}`;
}

// Client-side replica of the backend formula (confirmed from leave.js line 110):
//   allocationDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1
function computeDays(startStr: string, endStr: string): number | null {
  if (!startStr || !endStr) return null;
  const s = new Date(startStr);
  const e = new Date(endStr);
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || s > e) return null;
  return Math.round((e.getTime() - s.getTime()) / 86_400_000) + 1;
}

function isUnlimited(totalDays: number) {
  return totalDays >= 9999;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function extractError(err: unknown): string {
  return (
    (err as { response?: { data?: { message?: string } } })?.response?.data
      ?.message ?? "Something went wrong. Please try again."
  );
}

// ─── Static config ────────────────────────────────────────────────────────────

const LEAVE_TYPE = {
  PAID:   {
    label: "Paid Leave",
    short: "Paid",
    badge: "bg-green-500/15 text-green-400 border-green-500/25",
    bar:   "bg-green-500",
  },
  SICK:   {
    label: "Sick Leave",
    short: "Sick",
    badge: "bg-red-500/15 text-red-400 border-red-500/25",
    bar:   "bg-red-500",
  },
  UNPAID: {
    label: "Unpaid Leave",
    short: "Unpaid",
    badge: "bg-[#0a0a0a]0/25 text-slate-400 border-slate-500/30",
    bar:   "bg-[#0a0a0a]0",
  },
} as const;

const STATUS_STYLE = {
  PENDING:  "bg-amber-500/15 text-amber-400  border-amber-500/25",
  APPROVED: "bg-green-500/15 text-green-400  border-green-500/25",
  REJECTED: "bg-red-500/15   text-red-400    border-red-500/25",
} as const;

// ─── Sub-components ───────────────────────────────────────────────────────────

function LeaveTypeBadge({ type }: { type: LeaveAllocation["leaveType"] }) {
  const { short, badge } = LEAVE_TYPE[type];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full
      text-[10px] font-semibold border ${badge}`}>
      {short}
    </span>
  );
}

function StatusBadge({ status }: { status: LeaveRequest["status"] }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full
      text-[10px] font-semibold border ${STATUS_STYLE[status]}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

// ─── Balance card ─────────────────────────────────────────────────────────────

function BalanceCard({ alloc }: { alloc: LeaveAllocation }) {
  const cfg = LEAVE_TYPE[alloc.leaveType];
  const unlimited = isUnlimited(alloc.totalDays);
  const remaining = alloc.totalDays - alloc.usedDays;
  const pct = unlimited
    ? 0
    : Math.min(100, Math.round((alloc.usedDays / alloc.totalDays) * 100));

  return (
    <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-5 flex flex-col gap-3">
      {/* Type label */}
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
        {cfg.label}
      </p>

      {/* Main number */}
      <div className="flex items-end justify-between">
        <div>
          <span className="text-3xl font-bold text-white">
            {unlimited ? "∞" : remaining}
          </span>
          {!unlimited && (
            <span className="text-slate-500 text-sm ml-1.5">
              / {alloc.totalDays} days
            </span>
          )}
        </div>
        {!unlimited && (
          <span className="text-xs text-slate-500">{alloc.usedDays} used</span>
        )}
      </div>

      {/* Progress bar (hidden for Unlimited) */}
      {!unlimited && (
        <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${cfg.bar}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {unlimited && (
        <p className="text-xs text-slate-500">Unlimited · deducted from pay</p>
      )}
    </div>
  );
}

// ─── New Request Modal ────────────────────────────────────────────────────────

interface ModalProps {
  onClose: () => void;
  onSuccess: () => void;
  allocations: LeaveAllocation[];
}

function NewRequestModal({ onClose, onSuccess, allocations }: ModalProps) {
  const [leaveType, setLeaveType]         = useState<"PAID" | "SICK" | "UNPAID">("PAID");
  const [startDate, setStartDate]         = useState("");
  const [endDate,   setEndDate]           = useState("");
  const [reason,    setReason]            = useState("");
  // The current backend contract stores the selected medical-document filename.
  const [attachmentName, setAttachmentName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError,  setSubmitError]  = useState<string | null>(null);

  const days = computeDays(startDate, endDate);
  const isSick = leaveType === "SICK";

  // Check remaining balance for informational display
  const alloc = allocations.find((a) => a.leaveType === leaveType);
  const remaining = alloc && !isUnlimited(alloc.totalDays)
    ? alloc.totalDays - alloc.usedDays
    : null;

  // ── Client-side validation (mirrors backend rules confirmed from leave.js) ──
  function validate(): string | null {
    if (!startDate)                       return "Start date is required.";
    if (!endDate)                         return "End date is required.";
    if (new Date(startDate) > new Date(endDate))
                                          return "Start date cannot be after end date.";
    if (isSick && !attachmentName.trim()) return "A medical certificate is required for Sick leave.";
    if (days !== null && remaining !== null && days > remaining)
                                          return `Not enough balance. You have ${remaining} day${remaining === 1 ? "" : "s"} left.`;
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const validationError = validate();
    if (validationError) { setSubmitError(validationError); return; }

    setIsSubmitting(true);
    try {
      // POST /api/leave — confirmed from leave.js applySchema:
      //   { leaveType, startDate: "YYYY-MM-DD", endDate: "YYYY-MM-DD",
      //     reason?, attachmentUrl? }
      // Backend computes allocationDays server-side (not sent by client).
      await api.post("/leave", {
        leaveType,
        startDate,
        endDate,
        reason:        reason.trim() || undefined,
        attachmentUrl: isSick ? attachmentName.trim() : undefined,
      });
      onSuccess();
    } catch (err) {
      setSubmitError(extractError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  // Close on backdrop click
  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  const inputClass =
    "w-full px-3 py-2 rounded-lg bg-slate-900/70 border border-slate-600 text-sm text-white " +
    "placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 " +
    "focus:border-transparent transition-all duration-200";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4
        bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="New leave request"
    >
      <div className="bg-slate-800 border border-slate-700/50 rounded-2xl
        shadow-2xl shadow-black/60 w-full max-w-md overflow-hidden">

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4
          border-b border-slate-700/50">
          <h2 className="text-base font-semibold text-white">New Leave Request</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-lg flex items-center justify-center
              text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none"
              viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Leave type */}
          <div>
            <label htmlFor="leaveType" className="block text-xs font-medium text-slate-400 mb-1.5">
              Leave Type
            </label>
            <select
              id="leaveType"
              value={leaveType}
              onChange={(e) => {
                setLeaveType(e.target.value as typeof leaveType);
                setAttachmentName("");
              }}
              className={inputClass}
            >
              <option value="PAID">Paid Leave</option>
              <option value="SICK">Sick Leave</option>
              <option value="UNPAID">Unpaid Leave</option>
            </select>
            {/* Remaining balance hint */}
            {remaining !== null && (
              <p className="text-[10px] text-slate-500 mt-1">
                {remaining} day{remaining !== 1 ? "s" : ""} remaining
              </p>
            )}
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="startDate" className="block text-xs font-medium text-slate-400 mb-1.5">
                Start Date
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                min={todayISO()}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  // Auto-set end date to start if end is now before start
                  if (endDate && e.target.value > endDate) setEndDate(e.target.value);
                }}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-xs font-medium text-slate-400 mb-1.5">
                End Date
              </label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                min={startDate || todayISO()}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Auto-computed duration preview */}
          {days !== null && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg
              bg-indigo-500/10 border border-indigo-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-indigo-400 shrink-0"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs text-indigo-300">
                <strong>{days}</strong> day{days !== 1 ? "s" : ""} requested
              </span>
            </div>
          )}

          {/* Reason */}
          <div>
            <label htmlFor="reason" className="block text-xs font-medium text-slate-400 mb-1.5">
              Reason <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              id="reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Tell your manager why you're taking leave…"
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Medical certificate — required for SICK leave only */}
          {isSick && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Medical Certificate{" "}
                <span className="text-red-400">*</span>{" "}
                <span className="text-gray-400">(required for Sick leave)</span>
              </label>
              {/* File input: reads filename into attachmentName.
                  The backend stores attachmentUrl as a plain string — no upload endpoint.
                  The selected filename is attached to the leave request. */}
              <div
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer
                  bg-slate-900/70 border border-dashed border-slate-600
                  hover:border-indigo-500 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-500 shrink-0"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span className={`text-sm truncate ${attachmentName ? "text-white" : "text-gray-400"}`}>
                  {attachmentName || "Click to attach certificate"}
                </span>
                {attachmentName && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setAttachmentName(""); }}
                    className="ml-auto text-slate-500 hover:text-red-400 transition-colors shrink-0"
                    aria-label="Remove attachment"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setAttachmentName(file.name);
                }}
                aria-label="Upload medical certificate"
              />
            </div>
          )}

          {/* Error */}
          {submitError && (
            <div role="alert" className="flex items-start gap-2 bg-red-500/10 border border-red-500/30
              rounded-xl px-3.5 py-2.5 text-red-400 text-xs leading-snug">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 mt-0.5 shrink-0"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              {submitError}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400
                hover:text-white hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              id="submit-leave-btn"
              className="px-5 py-2 rounded-lg text-sm font-semibold text-white
                bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60
                disabled:cursor-not-allowed flex items-center gap-2
                transition-all duration-200 shadow-lg shadow-indigo-500/20"
            >
              {isSubmitting && (
                <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg"
                  fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              {isSubmitting ? "Submitting…" : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Time Off Page ────────────────────────────────────────────────────────────

export default function TimeOffPage() {
  const [allocations, setAllocations]   = useState<LeaveAllocation[]>([]);
  const [requests,    setRequests]       = useState<LeaveRequest[]>([]);
  const [loadingAlloc, setLoadingAlloc] = useState(true);
  const [loadingReq,   setLoadingReq]   = useState(true);
  const [allocError,   setAllocError]   = useState<string | null>(null);
  const [reqError,     setReqError]     = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState(false);

  // ── Fetch allocations ─────────────────────────────────────────────────────
  const fetchAllocations = useCallback(async () => {
    setLoadingAlloc(true);
    setAllocError(null);
    try {
      // GET /api/leave/allocations/me → { success, data: LeaveAllocation[] }
      const { data } = await api.get<{ success: boolean; data: LeaveAllocation[] }>(
        "/leave/allocations/me"
      );
      setAllocations(data.data);
    } catch {
      setAllocError("Failed to load leave balances.");
    } finally {
      setLoadingAlloc(false);
    }
  }, []);

  // ── Fetch requests ────────────────────────────────────────────────────────
  const fetchRequests = useCallback(async () => {
    setLoadingReq(true);
    setReqError(null);
    try {
      // GET /api/leave/requests/me → { success, data: LeaveRequest[] }
      const { data } = await api.get<{ success: boolean; data: LeaveRequest[] }>(
        "/leave/requests/me"
      );
      setRequests(data.data);
    } catch {
      setReqError("Failed to load leave requests.");
    } finally {
      setLoadingReq(false);
    }
  }, []);

  useEffect(() => {
    fetchAllocations();
    fetchRequests();
  }, [fetchAllocations, fetchRequests]);

  // Auto-dismiss success banner
  useEffect(() => {
    if (!successBanner) return;
    const t = setTimeout(() => setSuccessBanner(false), 5000);
    return () => clearTimeout(t);
  }, [successBanner]);

  // ── Modal success handler ─────────────────────────────────────────────────
  function handleModalSuccess() {
    setModalOpen(false);
    setSuccessBanner(true);
    // Refetch both — allocations can change when an existing request is approved
    fetchAllocations();
    fetchRequests();
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Modal ── */}
      {modalOpen && (
        <NewRequestModal
          onClose={() => setModalOpen(false)}
          onSuccess={handleModalSuccess}
          allocations={allocations}
        />
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Time Off</h1>
            <p className="text-slate-500 text-sm mt-0.5">Manage your leave requests and balance</p>
          </div>
          <button
            type="button"
            id="new-leave-request-btn"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white
              bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700
              transition-all duration-200 shadow-lg shadow-indigo-500/20 shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none"
              viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 4v16m8-8H4" />
            </svg>
            Request Leave
          </button>
        </div>

        {/* ── Success banner ── */}
        {successBanner && (
          <div role="status"
            className="flex items-center gap-2.5 bg-green-500/10 border border-green-500/30
              rounded-xl px-4 py-3 text-green-400 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none"
              viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M5 13l4 4L19 7" />
            </svg>
            Leave request submitted successfully. Pending admin approval.
          </div>
        )}

        {/* ── Balance cards ── */}
        <section>
          <h2 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3 px-1">
            Leave Balance — {new Date().getFullYear()}
          </h2>

          {loadingAlloc ? (
            <div className="grid grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="bg-slate-800/40 border border-slate-700/40
                  rounded-2xl p-5 h-28 animate-pulse" />
              ))}
            </div>
          ) : allocError ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5
              text-red-400 text-sm text-center">
              {allocError}
              <button onClick={fetchAllocations}
                className="block mt-1 text-xs text-indigo-400 hover:text-indigo-300 mx-auto">
                Retry
              </button>
            </div>
          ) : allocations.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-8 text-center">
              <p className="text-slate-500 text-sm">No allocations found for this year.</p>
              <p className="text-gray-400 text-xs mt-1">Contact your admin to set up leave allocations.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(["PAID", "SICK", "UNPAID"] as const).map((type) => {
                const alloc = allocations.find((a) => a.leaveType === type);
                return alloc ? (
                  <BalanceCard key={type} alloc={alloc} />
                ) : null;
              })}
            </div>
          )}
        </section>

        {/* ── Requests list ── */}
        <section>
          <h2 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3 px-1">
            My Requests
          </h2>

          <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl overflow-hidden">

            {/* Loading */}
            {loadingReq && (
              <div className="flex items-center justify-center py-16 gap-3">
                <svg className="animate-spin w-6 h-6 text-indigo-500" xmlns="http://www.w3.org/2000/svg"
                  fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <p className="text-slate-500 text-sm">Loading…</p>
              </div>
            )}

            {/* Error */}
            {!loadingReq && reqError && (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <p className="text-red-400 text-sm">{reqError}</p>
                <button onClick={fetchRequests}
                  className="text-xs text-indigo-400 hover:text-indigo-300">
                  Try again
                </button>
              </div>
            )}

            {/* Empty state */}
            {!loadingReq && !reqError && requests.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-slate-500"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-slate-400 text-sm font-medium">No requests yet</p>
                <p className="text-gray-400 text-xs">
                  Click &quot;Request Leave&quot; to submit your first request
                </p>
              </div>
            )}

            {/* Requests list */}
            {!loadingReq && !reqError && requests.length > 0 && (
              <ul className="divide-y divide-slate-700/30" role="list"
                aria-label="Leave requests">
                {requests.map((req) => (
                  <li key={req.id}
                    className="px-6 py-4 hover:bg-slate-700/15 transition-colors duration-100">
                    <div className="flex flex-col sm:flex-row sm:items-start
                      justify-between gap-2">

                      {/* Left: type + period + duration */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <LeaveTypeBadge type={req.leaveType} />
                          <span className="text-sm font-medium text-white">
                            {fmtDateRange(req.startDate, req.endDate)}
                          </span>
                          <span className="text-xs text-slate-500">
                            · {req.allocationDays} day{req.allocationDays !== 1 ? "s" : ""}
                          </span>
                        </div>
                        {req.reason && (
                          <p className="text-xs text-slate-500 max-w-xs truncate">
                            {req.reason}
                          </p>
                        )}
                      </div>

                      {/* Right: status */}
                      <div className="shrink-0">
                        <StatusBadge status={req.status} />
                      </div>
                    </div>

                    {/* Admin comment (visible if set) */}
                    {req.adminComment && (
                      <div className="mt-2 flex items-start gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5
                          text-slate-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24"
                          stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p className="text-xs text-slate-400 italic">{req.adminComment}</p>
                      </div>
                    )}

                    {/* Attachment indicator */}
                    {req.attachmentUrl && (
                      <div className="mt-1 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-gray-400"
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <span className="text-[10px] text-gray-400 truncate max-w-[200px]">
                          {req.attachmentUrl}
                        </span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer: request count */}
          {!loadingReq && !reqError && requests.length > 0 && (
            <p className="text-xs text-gray-400 text-right mt-3">
              {requests.length} request{requests.length !== 1 ? "s" : ""} total
            </p>
          )}
        </section>
      </div>
    </>
  );
}
