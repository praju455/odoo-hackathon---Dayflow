"use client";

import { YuIcon } from "@/components/ui/YuIcons";

const Sparklines = {
  up1: (
    <svg width="82" height="34" viewBox="0 0 82 34" fill="none">
      <defs>
        <linearGradient id="ag1" x1="0" y1="0" x2="0" y2="34">
          <stop offset="0%" stopColor="var(--chart-line)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--chart-line)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0 34 L0 25 L15 28 L30 18 L45 22 L60 8 L82 2 L82 34 Z" fill="url(#ag1)" />
      <path d="M0 25 L15 28 L30 18 L45 22 L60 8 L82 2" stroke="var(--chart-line)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  up2: (
    <svg width="82" height="34" viewBox="0 0 82 34" fill="none">
      <defs>
        <linearGradient id="ag2" x1="0" y1="0" x2="0" y2="34">
          <stop offset="0%" stopColor="var(--chart-line)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--chart-line)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0 34 L0 28 L15 20 L30 24 L45 14 L60 12 L82 4 L82 34 Z" fill="url(#ag2)" />
      <path d="M0 28 L15 20 L30 24 L45 14 L60 12 L82 4" stroke="var(--chart-line)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

const depts = [
  { name: "Engineering (Bengaluru)", pct: 45, color: "#6366f1" },
  { name: "Product & UI/UX Design",  pct: 25, color: "#8b5cf6" },
  { name: "Human Resources & Payroll", pct: 16, color: "#06b6d4" },
  { name: "QA & Operations",         pct: 12, color: "#f59e0b" },
];

const locations = [
  { name: "Bengaluru Tech Hub (Office)", sub: "52% of team members", members: "8 Members" },
  { name: "Hybrid Schedule (2 Days Remote)", sub: "30% of team members", members: "4 Members" },
  { name: "Full Remote (Pan India)", sub: "18% of team members", members: "3 Members" },
];

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col min-w-0 pb-[100px]">
      {/* Page title */}
      <div className="px-[20px] pt-[28px] pb-[24px] border-b border-[var(--border-default)]">
        <h1 className="text-heading-page" style={{ color: "var(--text-primary)" }}>Work Analytics & Insights</h1>
        <p className="text-body-regular mt-1" style={{ color: "var(--text-secondary)" }}>
          Real-time presence, productivity, and work distribution (India)
        </p>
      </div>

      {/* KPI Strip */}
      <div className="kpi-scroll-container flex border-b border-[var(--border-default)]" style={{ height: "112px" }}>
        <div className="flex w-full min-w-[1160px]">
          <div className="relative flex-shrink-0" style={{ width: "290px", height: "111px" }}>
            <div className="absolute top-[19.8px] left-[20.8px] text-body-medium" style={{ color: "var(--text-secondary)" }}>Total Team Hours (Month)</div>
            <div className="absolute top-[53px] left-[20.8px] flex items-center gap-2">
              <span className="text-kpi-value" style={{ color: "var(--text-primary)" }}>1,840 hrs</span>
              <div className="flex items-center rounded-[7px] px-2 h-[26px]" style={{ backgroundColor: "var(--green-50)" }}>
                <YuIcon name="trend-up-01" width={16} height={16} style={{ color: "var(--green-700)" }} />
                <span className="ml-[4px] text-label-score" style={{ color: "var(--green-700)" }}>+12%</span>
              </div>
            </div>
            <div className="absolute top-[44px] right-[18.5px]">{Sparklines.up1}</div>
          </div>

          <div className="relative flex-shrink-0 border-l border-[var(--border-default)]" style={{ width: "290px", height: "111px" }}>
            <div className="absolute top-[19.8px] left-[20.8px] text-body-medium" style={{ color: "var(--text-secondary)" }}>Average Daily Presence</div>
            <div className="absolute top-[53px] left-[20.8px] flex items-center gap-2">
              <span className="text-kpi-value" style={{ color: "var(--text-primary)" }}>94.2%</span>
              <div className="flex items-center rounded-[7px] px-2 h-[26px]" style={{ backgroundColor: "var(--green-50)" }}>
                <YuIcon name="trend-up-01" width={16} height={16} style={{ color: "var(--green-700)" }} />
                <span className="ml-[4px] text-label-score" style={{ color: "var(--green-700)" }}>+3.8%</span>
              </div>
            </div>
            <div className="absolute top-[44px] right-[18.5px]">{Sparklines.up2}</div>
          </div>

          <div className="relative flex-shrink-0 border-l border-[var(--border-default)]" style={{ width: "290px", height: "111px" }}>
            <div className="absolute top-[19.8px] left-[20.8px] text-body-medium" style={{ color: "var(--text-secondary)" }}>Projects Completed On Time</div>
            <div className="absolute top-[53px] left-[20.8px] flex items-center gap-2">
              <span className="text-kpi-value" style={{ color: "var(--text-primary)" }}>92%</span>
              <div className="flex items-center rounded-[7px] px-2 h-[26px]" style={{ backgroundColor: "var(--green-50)" }}>
                <YuIcon name="trend-up-01" width={16} height={16} style={{ color: "var(--green-700)" }} />
                <span className="ml-[4px] text-label-score" style={{ color: "var(--green-700)" }}>+5%</span>
              </div>
            </div>
            <div className="absolute top-[44px] right-[18.5px]">{Sparklines.up1}</div>
          </div>

          <div className="relative flex-shrink-0 border-l border-[var(--border-default)] flex-1" style={{ minWidth: "290px", height: "111px" }}>
            <div className="absolute top-[19.8px] left-[20.8px] text-body-medium" style={{ color: "var(--text-secondary)" }}>Employee Engagement Index</div>
            <div className="absolute top-[53px] left-[20.8px] flex items-center gap-2">
              <span className="text-kpi-value" style={{ color: "var(--text-primary)" }}>4.8 / 5.0</span>
              <div className="flex items-center rounded-[7px] px-2 h-[26px]" style={{ backgroundColor: "var(--green-50)" }}>
                <YuIcon name="trend-up-01" width={16} height={16} style={{ color: "var(--green-700)" }} />
                <span className="ml-[4px] text-label-score" style={{ color: "var(--green-700)" }}>+0.2</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two panels */}
      <div className="flex gap-4 p-[20px] min-w-[1160px]">
        {/* Department Work Distribution */}
        <div className="flex-1 rounded-[12px] border border-[var(--border-default)] p-6" style={{ backgroundColor: "var(--bg-field)" }}>
          <h2 className="text-body-medium mb-5" style={{ color: "var(--text-primary)", fontWeight: 600 }}>Department Work Distribution</h2>
          <div className="space-y-5">
            {depts.map((d) => (
              <div key={d.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-body-regular" style={{ color: "var(--text-secondary)" }}>{d.name}</span>
                  <span className="text-label-score" style={{ color: "var(--text-secondary)" }}>{d.pct}%</span>
                </div>
                <div className="h-[6px] rounded-full" style={{ backgroundColor: "var(--border-default)" }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${d.pct}%`, backgroundColor: d.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Location & Hybrid Attendance */}
        <div className="flex-1 rounded-[12px] border border-[var(--border-default)] p-6" style={{ backgroundColor: "var(--bg-field)" }}>
          <h2 className="text-body-medium mb-5" style={{ color: "var(--text-primary)", fontWeight: 600 }}>Location & Hybrid Attendance</h2>
          <div className="space-y-4">
            {locations.map((loc) => (
              <div key={loc.name} className="flex items-center justify-between rounded-[10px] p-4 border border-[var(--border-default)]" style={{ backgroundColor: "var(--bg-canvas)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: "var(--green-700)" }} />
                  <div>
                    <p className="text-body-medium" style={{ color: "var(--text-primary)" }}>{loc.name}</p>
                    <p className="text-body-small" style={{ color: "var(--text-secondary)" }}>{loc.sub}</p>
                  </div>
                </div>
                <span className="text-label-score rounded-[7px] px-2 h-[26px] flex items-center" style={{ backgroundColor: "var(--green-50)", color: "var(--green-700)" }}>
                  {loc.members}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
