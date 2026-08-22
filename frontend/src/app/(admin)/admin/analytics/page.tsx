"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { YuIcon } from "@/components/ui/YuIcons";

interface AnalyticsData {
  attendance: Record<string, number>;
  leaveRequests: Record<string, number>;
  headcount: Record<string, number>;
}

// ─── Sparklines ───────────────────────────────────────────────────────────────
const Sparklines = {
  up1: (
    <svg width="82" height="34" viewBox="0 0 82 34" fill="none">
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="0" y2="34">
          <stop offset="0%" stopColor="var(--chart-line)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--chart-line)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0 34 L0 25 L15 28 L30 18 L45 22 L60 8 L82 2 L82 34 Z" fill="url(#g1)" />
      <path d="M0 25 L15 28 L30 18 L45 22 L60 8 L82 2" stroke="var(--chart-line)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  up2: (
    <svg width="82" height="34" viewBox="0 0 82 34" fill="none">
      <defs>
        <linearGradient id="g2" x1="0" y1="0" x2="0" y2="34">
          <stop offset="0%" stopColor="var(--chart-line)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--chart-line)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0 34 L0 28 L15 20 L30 24 L45 14 L60 12 L82 4 L82 34 Z" fill="url(#g2)" />
      <path d="M0 28 L15 20 L30 24 L45 14 L60 12 L82 4" stroke="var(--chart-line)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  up3: (
    <svg width="82" height="34" viewBox="0 0 82 34" fill="none">
      <defs>
        <linearGradient id="g3" x1="0" y1="0" x2="0" y2="34">
          <stop offset="0%" stopColor="var(--chart-line)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--chart-line)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0 34 L0 22 L15 24 L30 15 L45 18 L60 6 L82 5 L82 34 Z" fill="url(#g3)" />
      <path d="M0 22 L15 24 L30 15 L45 18 L60 6 L82 5" stroke="var(--chart-line)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  down1: (
    <svg width="82" height="34" viewBox="0 0 82 34" fill="none">
      <defs>
        <linearGradient id="g4" x1="0" y1="0" x2="0" y2="34">
          <stop offset="0%" stopColor="var(--chart-line)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--chart-line)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0 34 L0 5 L15 12 L30 8 L45 18 L60 22 L82 28 L82 34 Z" fill="url(#g4)" />
      <path d="M0 5 L15 12 L30 8 L45 18 L60 22 L82 28" stroke="var(--chart-line)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
};

const mockTableData = [
  { sel: false, name: "Emma Johansson", dept: "Engineering", email: "emma@shiftly.local", status: "PRESENT", statusBg: "--green-50", statusTx: "--green-700", mgr: "Jacob Müller", role: "Developer", score: "9/10", tier: { bg: "--green-50", tx: "--green-700" }, date: "Dec 08, 2025" },
  { sel: false, name: "Ethan Wilson", dept: "Sales", email: "ethan@shiftly.local", status: "ON LEAVE", statusBg: "--amber-50", statusTx: "--amber-700", mgr: "Olivia Davis", role: "AE", score: "6/10", tier: { bg: "--lime-50", tx: "--lime-700" }, date: "Dec 07, 2025" },
  { sel: false, name: "Isabella Hernandez", dept: "Design", email: "isabella@shiftly.local", status: "ABSENT", statusBg: "--red-50", statusTx: "--red-700", mgr: "Liam Johnson", role: "Designer", score: "4/10", tier: { bg: "--amber-50", tx: "--amber-700" }, date: "Dec 06, 2025" },
  { sel: true, name: "William Lee", dept: "Product", email: "w.lee@shiftly.local", status: "PRESENT", statusBg: "--green-50", statusTx: "--green-700", mgr: "James Smith", role: "PM", score: "7/10", tier: { bg: "--lime-50", tx: "--lime-700" }, date: "Dec 05, 2025" },
  { sel: false, name: "Sophia Martinez", dept: "Support", email: "sophia@shiftly.local", status: "PRESENT", statusBg: "--green-50", statusTx: "--green-700", mgr: "Olivia Davis", role: "Agent", score: "6/10", tier: { bg: "--lime-50", tx: "--lime-700" }, date: "Dec 04, 2025" },
  { sel: false, name: "Ava Clark", dept: "HR", email: "ava@shiftly.local", status: "ON LEAVE", statusBg: "--amber-50", statusTx: "--amber-700", mgr: "Noah Garcia", role: "Recruiter", score: "1/10", tier: { bg: "--red-50", tx: "--red-700" }, date: "Dec 03, 2025" },
  { sel: true, name: "Lily Walker", dept: "Marketing", email: "walker@shiftly.local", status: "ABSENT", statusBg: "--red-50", statusTx: "--red-700", mgr: "Zoe Lewis", role: "Marketer", score: "6/10", tier: { bg: "--lime-50", tx: "--lime-700" }, date: "Dec 02, 2025" },
  { sel: true, name: "James Young", dept: "Finance", email: "j.young@shiftly.local", status: "PRESENT", statusBg: "--green-50", statusTx: "--green-700", mgr: "Oliver Hall", role: "Analyst", score: "5/10", tier: { bg: "--amber-50", tx: "--amber-700" }, date: "Dec 02, 2025" },
  { sel: false, name: "Mason Allen", dept: "Engineering", email: "mason@shiftly.local", status: "PRESENT", statusBg: "--green-50", statusTx: "--green-700", mgr: "Emily King", role: "Developer", score: "9/10", tier: { bg: "--green-50", tx: "--green-700" }, date: "Dec 01, 2025" },
  { sel: false, name: "Jack Robinson", dept: "Sales", email: "jack@shiftly.local", status: "ON LEAVE", statusBg: "--amber-50", statusTx: "--amber-700", mgr: "Mia Brown", role: "AE", score: "7/10", tier: { bg: "--lime-50", tx: "--lime-700" }, date: "Dec 01, 2025" },
  { sel: false, name: "David Ramirez", dept: "Logistics", email: "david@shiftly.local", status: "PRESENT", statusBg: "--green-50", statusTx: "--green-700", mgr: "Ella Turner", role: "Manager", score: "4/10", tier: { bg: "--amber-50", tx: "--amber-700" }, date: "Dec 01, 2025" }
];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get<{ success: boolean; data: AnalyticsData }>("/analytics/summary");
        if (res.data.success) setData(res.data.data);
      } catch (err) {}
    }
    fetchData();
  }, []);

  const totalEmps = data ? Object.values(data.headcount).reduce((a, b) => a + b, 0) : 151;
  const present = data ? (data.attendance["PRESENT"] || data.attendance["present"] || 0) : 59;
  const leaves = data ? (data.leaveRequests["PENDING"] || data.leaveRequests["pending"] || 0) : 23;

  return (
    <div className="flex flex-col min-w-0 pb-[100px]">
      {/* ─── KPI Strip ───────────────────────────────────────────────────────── */}
      <div
        className="kpi-scroll-container flex border-b border-[var(--border-default)]"
        style={{ height: "112px" }}
      >
        <div className="flex w-full min-w-[1160px]">
          {/* Card 1 */}
          <div className="relative flex-shrink-0" style={{ width: "290px", height: "111px" }}>
            <div className="absolute top-[19.8px] left-[20.8px] text-body-medium text-secondary">
              Total Employees
            </div>
            <div className="absolute top-[53px] left-[20.8px] flex items-center gap-2">
              <span className="text-kpi-value text-primary">{totalEmps}</span>
              <div
                className="flex items-center rounded-[7px] px-2 h-[26px]"
                style={{ backgroundColor: "var(--green-50)" }}
              >
                <YuIcon name="trend-up-01" width={16} height={16} className="text-[#4ade80]" />
                <span className="ml-[4px] text-label-score" style={{ color: "var(--green-700)" }}>
                  12%
                </span>
              </div>
            </div>
            <div className="absolute top-[44px] right-[18.5px]">
              {Sparklines.up1}
            </div>
          </div>
          {/* Card 2 */}
          <div className="relative flex-shrink-0 border-l border-[var(--border-default)]" style={{ width: "290px", height: "111px" }}>
            <div className="absolute top-[19.8px] left-[20.8px] text-body-medium text-secondary">
              Present Today
            </div>
            <div className="absolute top-[53px] left-[20.8px] flex items-center gap-2">
              <span className="text-kpi-value text-primary">{present}</span>
              <div
                className="flex items-center rounded-[7px] px-2 h-[26px]"
                style={{ backgroundColor: "var(--green-50)" }}
              >
                <YuIcon name="trend-up-01" width={16} height={16} className="text-[#4ade80]" />
                <span className="ml-[4px] text-label-score" style={{ color: "var(--green-700)" }}>
                  19%
                </span>
              </div>
            </div>
            <div className="absolute top-[44px] right-[18.5px]">
              {Sparklines.up2}
            </div>
          </div>
          {/* Card 3 */}
          <div className="relative flex-shrink-0 border-l border-[var(--border-default)]" style={{ width: "290px", height: "111px" }}>
            <div className="absolute top-[19.8px] left-[20.8px] text-body-medium text-secondary">
              Avg Response Time
            </div>
            <div className="absolute top-[53px] left-[20.8px] flex items-center gap-2">
              <span className="text-kpi-value text-primary">1h 3m</span>
              <div
                className="flex items-center rounded-[7px] px-2 h-[26px]"
                style={{ backgroundColor: "var(--green-50)" }}
              >
                <YuIcon name="trend-up-01" width={16} height={16} className="text-[#4ade80]" />
                <span className="ml-[4px] text-label-score" style={{ color: "var(--green-700)" }}>
                  19%
                </span>
              </div>
            </div>
            <div className="absolute top-[44px] right-[18.5px]">
              {Sparklines.up3}
            </div>
          </div>
          {/* Card 4 */}
          <div className="relative flex-shrink-0 border-l border-[var(--border-default)] flex-1" style={{ minWidth: "290px", height: "111px" }}>
            <div className="absolute top-[19.8px] left-[20.8px] text-body-medium text-secondary">
              Pending Leaves
            </div>
            <div className="absolute top-[53px] left-[20.8px] flex items-center gap-2">
              <span className="text-kpi-value text-primary">{leaves}</span>
              <div
                className="flex items-center rounded-[7px] px-2 h-[26px]"
                style={{ backgroundColor: "var(--red-50)" }}
              >
                <YuIcon name="trend-down-01" width={16} height={16} className="text-[#f87171]" />
                <span className="ml-[4px] text-label-score" style={{ color: "var(--red-700)" }}>
                  19%
                </span>
              </div>
            </div>
            <div className="absolute top-[44px] right-[18.5px]">
              {Sparklines.down1}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Tabs ────────────────────────────────────────────────────────────── */}
      <div
        className="tabs-scroll-container flex border-b border-[var(--border-default)] relative"
        style={{ height: "55px" }}
      >
        <div className="flex items-center h-full min-w-[1160px] pl-[20px]">
          {/* All (Active) */}
          <div className="flex items-center h-full relative" style={{ padding: "0 14px 0 16.6px" }}>
            <span className="text-label-tab text-primary whitespace-nowrap">All</span>
            <div className="w-[4.4px]" />
            <div className="flex items-center justify-center rounded-[7px] bg-field-on-canvas w-[37px] h-[26px]">
              <span className="text-label-score text-secondary">426</span>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary" />
          </div>
          <div className="flex items-center h-full text-label-tab text-secondary whitespace-nowrap" style={{ padding: "0 22.45px 0 24.8px" }}>
            Favourite
          </div>
          <div className="flex items-center h-full text-label-tab text-secondary whitespace-nowrap" style={{ padding: "0 21.5px 0 22.45px" }}>
            New
          </div>
          <div className="flex items-center h-full text-label-tab text-secondary whitespace-nowrap" style={{ padding: "0 25.45px 0 21.5px" }}>
            Assigned to me
          </div>
          <div className="flex items-center h-full text-label-tab text-secondary whitespace-nowrap" style={{ padding: "0 22.5px 0 25.45px" }}>
            Overdue
          </div>
          <div className="flex items-center h-full text-label-tab text-secondary whitespace-nowrap" style={{ padding: "0 14px 0 22.5px" }}>
            Hot
          </div>
        </div>
      </div>

      {/* ─── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center min-w-0" style={{ height: "93px", paddingTop: "29px", paddingBottom: "26px", paddingLeft: "18px", paddingRight: "18px" }}>
        <div className="flex items-center">
          <div className="flex items-center rounded-[10px] bg-field-on-canvas" style={{ width: "283px", height: "38px", paddingLeft: "9px" }}>
            <YuIcon name="search-md" width={16} height={16} className="text-icon-muted" />
            <span className="ml-[8px] text-body-regular text-tertiary">Search</span>
          </div>
          <div className="w-[22px]" />
          <YuIcon name="filter-funnel-01" width={16} height={16} className="text-icon-default mx-[21px] md:mx-0 md:mr-[42px]" />
          <YuIcon name="switch-vertical-01" width={16} height={16} className="text-icon-default mx-[21px] md:mx-0 md:mr-[42px]" />
          <YuIcon name="settings-04" width={16} height={16} className="text-icon-default mx-[21px] md:mx-0" />
        </div>
        <div className="flex-1" />
        <div className="flex items-center">
          <YuIcon name="list" width={16} height={16} className="text-icon-strong mr-[36px]" />
          <YuIcon name="grid-01" width={16} height={16} className="text-icon-default mr-[24px]" />
          <button className="flex items-center justify-center rounded-[10px] bg-field-on-canvas text-secondary whitespace-nowrap mr-[12px]" style={{ width: "88px", height: "36px", padding: "0 12px 0 8px", gap: "8px" }}>
            <YuIcon name="upload-cloud-01" width={16} height={16} />
            <span className="text-body-medium">Import</span>
          </button>
          <button className="flex items-center justify-center rounded-[10px] bg-field-on-canvas text-secondary whitespace-nowrap mr-[12px]" style={{ width: "88px", height: "36px", padding: "0 12px 0 8px", gap: "8px" }}>
            <YuIcon name="download-cloud-01" width={16} height={16} />
            <span className="text-body-medium">Export</span>
          </button>
          <button className="flex items-center justify-center rounded-[10px] bg-primary text-on-primary whitespace-nowrap" style={{ width: "102px", height: "36px", padding: "0 12px", gap: "8px" }}>
            <YuIcon name="plus" width={16} height={16} />
            <span className="text-body-medium font-semibold">Add lead</span>
          </button>
        </div>
      </div>

      {/* ─── Table ───────────────────────────────────────────────────────────── */}
      <div className="table-scroll-container">
        <table className="w-full text-left table-fixed table-min-width" style={{ borderCollapse: "collapse" }}>
          <colgroup>
            <col style={{ width: "66px" }} />
            <col style={{ width: "155px" }} />
            <col style={{ width: "149px" }} />
            <col />
            <col style={{ width: "130px" }} />
            <col style={{ width: "120px" }} />
            <col style={{ width: "95px" }} />
            <col style={{ width: "74px" }} />
            <col style={{ width: "125px" }} />
            <col style={{ width: "34px" }} />
          </colgroup>
          <thead>
            <tr style={{ height: "33px", borderBottom: "1px solid var(--border-default)" }}>
              <th scope="col" className="font-normal" style={{ paddingLeft: "19px", paddingRight: "0" }}>
                <div className="flex items-center justify-center rounded-[5px] bg-primary w-[18px] h-[18px]">
                  <div className="w-[10px] h-[2px] bg-[var(--text-on-primary)]" />
                </div>
              </th>
              <th scope="col" className="text-body-regular text-secondary font-normal p-0">Employee</th>
              <th scope="col" className="text-body-regular text-secondary font-normal p-0">Department</th>
              <th scope="col" className="text-body-regular text-secondary font-normal p-0">Email</th>
              <th scope="col" className="text-body-regular text-secondary font-normal p-0">Status</th>
              <th scope="col" className="text-body-regular text-secondary font-normal p-0">Manager</th>
              <th scope="col" className="text-body-regular text-secondary font-normal p-0">Role</th>
              <th scope="col" className="text-body-regular text-secondary font-normal p-0">Score</th>
              <th scope="col" className="text-body-regular text-secondary font-normal p-0">Joined</th>
              <th scope="col" className="font-normal" style={{ paddingLeft: "0", paddingRight: "18px" }}></th>
            </tr>
          </thead>
          <tbody>
            {mockTableData.map((row, i) => (
              <tr key={i} className="group" style={{ height: "61.5px", borderBottom: "1px solid var(--border-default)" }}>
                <td className="sticky-col-1" style={{ paddingLeft: "19px", paddingRight: "0" }}>
                  <div
                    className={`flex items-center justify-center rounded-[5px] w-[18px] h-[18px] ${row.sel ? "bg-primary" : "bg-field"}`}
                  >
                    {row.sel && <YuIcon name="check" width={12} height={12} className="text-on-primary" strokeWidth="3" />}
                  </div>
                </td>
                <td className="sticky-col-2 p-0 text-body-medium text-primary truncate pr-2">{row.name} {row.sel && "✓"}</td>
                <td className="p-0 text-body-regular text-secondary truncate pr-2">{row.dept}</td>
                <td className="p-0 text-body-regular text-secondary truncate pr-2">{row.email}</td>
                <td className="p-0">
                  <span
                    className="inline-flex items-center justify-center rounded-[7px] border border-strong text-label-caps"
                    style={{ height: "23px", padding: "0 8px", backgroundColor: "white", color: `var(${row.statusTx})`, borderColor: `var(${row.statusTx})` }}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="p-0 text-body-medium text-primary truncate pr-2">{row.mgr}</td>
                <td className="p-0 text-body-regular text-secondary truncate pr-2">{row.role}</td>
                <td className="p-0" style={{ paddingTop: "3px" }}>
                  <span
                    className="inline-flex items-center justify-center rounded-[7px] text-label-score"
                    style={{ height: "26px", padding: "4px 6px", backgroundColor: `var(${row.tier.bg})`, color: `var(${row.tier.tx})` }}
                  >
                    {row.score}
                  </span>
                </td>
                <td className="p-0 text-body-regular text-secondary truncate pr-2">{row.date}</td>
                <td className="p-0" style={{ paddingRight: "18px" }}>
                  <YuIcon name="dots-horizontal" width={16} height={16} className="text-icon-muted float-right" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
