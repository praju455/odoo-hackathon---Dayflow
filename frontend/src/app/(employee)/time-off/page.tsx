"use client";

import { YuIcon } from "@/components/ui/YuIcons";

const Sparklines = {
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

const mockTimeOffData = [
  { sel: false, type: "Annual Leave", start: "Dec 20, 2025", end: "Dec 30, 2025", duration: "8 days", status: "APPROVED", statusTx: "--green-700", req: "Dec 01, 2025", notes: "Holiday", tier: { bg: "--green-50", tx: "--green-700" } },
  { sel: false, type: "Sick Leave", start: "Nov 15, 2025", end: "Nov 16, 2025", duration: "2 days", status: "APPROVED", statusTx: "--green-700", req: "Nov 15, 2025", notes: "Flu", tier: { bg: "--green-50", tx: "--green-700" } },
  { sel: false, type: "Personal", start: "Oct 10, 2025", end: "Oct 10, 2025", duration: "1 day", status: "REJECTED", statusTx: "--red-700", req: "Oct 05, 2025", notes: "Errands", tier: { bg: "--red-50", tx: "--red-700" } },
  { sel: true, type: "Annual Leave", start: "Jan 05, 2026", end: "Jan 10, 2026", duration: "5 days", status: "PENDING", statusTx: "--amber-700", req: "Dec 10, 2025", notes: "Vacation", tier: { bg: "--amber-50", tx: "--amber-700" } },
];

export default function EmployeeTimeOffPage() {
  return (
    <div className="flex flex-col min-w-0 pb-[100px]">
      <div className="kpi-scroll-container flex border-b border-[var(--border-default)]" style={{ height: "112px" }}>
        <div className="flex w-full min-w-[1160px]">
          <div className="relative flex-shrink-0" style={{ width: "290px", height: "111px" }}>
            <div className="absolute top-[19.8px] left-[20.8px] text-body-medium text-secondary">Total Allowance</div>
            <div className="absolute top-[53px] left-[20.8px] flex items-center gap-2">
              <span className="text-kpi-value text-primary">24</span>
              <div className="flex items-center rounded-[7px] px-2 h-[26px]" style={{ backgroundColor: "var(--bg-canvas)" }}>
                <span className="text-label-score text-secondary">Days</span>
              </div>
            </div>
          </div>
          <div className="relative flex-shrink-0 border-l border-[var(--border-default)]" style={{ width: "290px", height: "111px" }}>
            <div className="absolute top-[19.8px] left-[20.8px] text-body-medium text-secondary">Used Leave</div>
            <div className="absolute top-[53px] left-[20.8px] flex items-center gap-2">
              <span className="text-kpi-value text-primary">10</span>
              <div className="flex items-center rounded-[7px] px-2 h-[26px]" style={{ backgroundColor: "var(--red-50)" }}>
                <YuIcon name="trend-down-01" width={16} height={16} className="text-[#f87171]" />
                <span className="ml-[4px] text-label-score" style={{ color: "var(--red-700)" }}>2%</span>
              </div>
            </div>
            <div className="absolute top-[44px] right-[18.5px]">{Sparklines.down1}</div>
          </div>
          <div className="relative flex-shrink-0 border-l border-[var(--border-default)]" style={{ width: "290px", height: "111px" }}>
            <div className="absolute top-[19.8px] left-[20.8px] text-body-medium text-secondary">Pending Approval</div>
            <div className="absolute top-[53px] left-[20.8px] flex items-center gap-2">
              <span className="text-kpi-value text-primary">5</span>
              <div className="flex items-center rounded-[7px] px-2 h-[26px]" style={{ backgroundColor: "var(--amber-50)" }}>
                <span className="text-label-score" style={{ color: "var(--amber-700)" }}>Days</span>
              </div>
            </div>
          </div>
          <div className="relative flex-shrink-0 border-l border-[var(--border-default)] flex-1" style={{ minWidth: "290px", height: "111px" }}>
            <div className="absolute top-[19.8px] left-[20.8px] text-body-medium text-secondary">Available Balance</div>
            <div className="absolute top-[53px] left-[20.8px] flex items-center gap-2">
              <span className="text-kpi-value text-primary">9</span>
              <div className="flex items-center rounded-[7px] px-2 h-[26px]" style={{ backgroundColor: "var(--green-50)" }}>
                <span className="text-label-score" style={{ color: "var(--green-700)" }}>Days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="tabs-scroll-container flex border-b border-[var(--border-default)] relative" style={{ height: "55px" }}>
        <div className="flex items-center h-full min-w-[1160px] pl-[20px]">
          <div className="flex items-center h-full relative" style={{ padding: "0 14px 0 16.6px" }}>
            <span className="text-label-tab text-primary whitespace-nowrap">All Requests</span>
            <div className="w-[4.4px]" />
            <div className="flex items-center justify-center rounded-[7px] bg-field-on-canvas w-[37px] h-[26px]">
              <span className="text-label-score text-secondary">4</span>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary" />
          </div>
          <div className="flex items-center h-full text-label-tab text-secondary whitespace-nowrap" style={{ padding: "0 22.45px 0 24.8px" }}>Approved</div>
          <div className="flex items-center h-full text-label-tab text-secondary whitespace-nowrap" style={{ padding: "0 21.5px 0 22.45px" }}>Pending</div>
        </div>
      </div>

      <div className="flex items-center min-w-0" style={{ height: "93px", paddingTop: "29px", paddingBottom: "26px", paddingLeft: "18px", paddingRight: "18px" }}>
        <div className="flex items-center">
          <div className="flex items-center rounded-[10px] bg-field-on-canvas" style={{ width: "283px", height: "38px", paddingLeft: "9px" }}>
            <YuIcon name="search-md" width={16} height={16} className="text-icon-muted" />
            <span className="ml-[8px] text-body-regular text-tertiary">Search requests</span>
          </div>
          <div className="w-[22px]" />
          <YuIcon name="filter-funnel-01" width={16} height={16} className="text-icon-default mx-[21px] md:mx-0 md:mr-[42px]" />
        </div>
        <div className="flex-1" />
        <div className="flex items-center">
          <YuIcon name="list" width={16} height={16} className="text-icon-strong mr-[36px]" />
          <button className="flex items-center justify-center rounded-[10px] bg-primary text-on-primary whitespace-nowrap" style={{ width: "138px", height: "36px", padding: "0 12px", gap: "8px" }}>
            <YuIcon name="plus" width={16} height={16} />
            <span className="text-body-medium font-semibold">Request Leave</span>
          </button>
        </div>
      </div>

      <div className="table-scroll-container">
        <table className="w-full text-left table-fixed table-min-width" style={{ borderCollapse: "collapse" }}>
          <colgroup>
            <col style={{ width: "66px" }} />
            <col style={{ width: "155px" }} />
            <col style={{ width: "149px" }} />
            <col style={{ width: "149px" }} />
            <col style={{ width: "130px" }} />
            <col style={{ width: "130px" }} />
            <col />
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
              <th scope="col" className="text-body-regular text-secondary font-normal p-0">Leave Type</th>
              <th scope="col" className="text-body-regular text-secondary font-normal p-0">Start Date</th>
              <th scope="col" className="text-body-regular text-secondary font-normal p-0">End Date</th>
              <th scope="col" className="text-body-regular text-secondary font-normal p-0">Duration</th>
              <th scope="col" className="text-body-regular text-secondary font-normal p-0">Status</th>
              <th scope="col" className="text-body-regular text-secondary font-normal p-0">Notes</th>
              <th scope="col" className="text-body-regular text-secondary font-normal p-0">Requested</th>
              <th scope="col" className="font-normal" style={{ paddingLeft: "0", paddingRight: "18px" }}></th>
            </tr>
          </thead>
          <tbody>
            {mockTimeOffData.map((row, i) => (
              <tr key={i} className="group hover:bg-sidebar transition-colors" style={{ height: "61.5px", borderBottom: "1px solid var(--border-default)" }}>
                <td className="sticky-col-1" style={{ paddingLeft: "19px", paddingRight: "0" }}>
                  <div className={`flex items-center justify-center rounded-[5px] w-[18px] h-[18px] ${row.sel ? "bg-primary" : "bg-field"}`}>
                    {row.sel && <YuIcon name="check" width={12} height={12} className="text-on-primary" strokeWidth="3" />}
                  </div>
                </td>
                <td className="sticky-col-2 p-0 text-body-medium text-primary truncate pr-2">{row.type}</td>
                <td className="p-0 text-body-regular text-secondary truncate pr-2">{row.start}</td>
                <td className="p-0 text-body-regular text-secondary truncate pr-2">{row.end}</td>
                <td className="p-0" style={{ paddingTop: "3px" }}>
                  <span className="inline-flex items-center justify-center rounded-[7px] text-label-score" style={{ height: "26px", padding: "4px 6px", backgroundColor: `var(--bg-canvas)`, color: `var(--text-secondary)` }}>
                    {row.duration}
                  </span>
                </td>
                <td className="p-0">
                  <span className="inline-flex items-center justify-center rounded-[7px] border border-strong text-label-caps" style={{ height: "23px", padding: "0 8px", backgroundColor: "white", color: `var(${row.statusTx})`, borderColor: `var(${row.statusTx})` }}>
                    {row.status}
                  </span>
                </td>
                <td className="p-0 text-body-regular text-secondary truncate pr-2">{row.notes}</td>
                <td className="p-0 text-body-regular text-secondary truncate pr-2">{row.req}</td>
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
