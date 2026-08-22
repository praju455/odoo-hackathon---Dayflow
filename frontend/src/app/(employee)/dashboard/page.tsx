"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

// ─── Weekly activity heatmap data ────────────────────────────────────────────
const HEATMAP = [
  [3,2,4,1,5,3,2],
  [1,4,3,5,2,4,1],
  [5,3,2,4,3,1,5],
  [2,5,4,3,1,5,3],
  [4,1,5,2,4,2,4],
  [3,4,2,5,3,4,2],
  [1,3,4,2,5,3,1],
];

function heatColor(v: number) {
  const colors = ["#1e2030","#312e81","#4338ca","#6366f1","#818cf8"];
  return colors[Math.min(v, 4)];
}

// ─── Timer hook ───────────────────────────────────────────────────────────────
function useTimer() {
  const [seconds, setSeconds] = useState(13145); // 03:39:05
  const [running, setRunning] = useState(true);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return { display: `${h}:${m}:${s}`, running, toggle: () => setRunning((r) => !r) };
}

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const DATES = [17, 18, 19, 20, 21, 22, 23];
const TODAY_IDX = 5; // FRI 22

const TASKS = [
  { time: "09:00", label: "Standup & Sprint Sync", sub: "Daily team check-in integration review" },
  { time: "11:30", label: "Payment Gateway Integration", sub: "HDFC & UPI integration review" },
  { time: "14:00", label: "QA & Bug Triage", sub: "Sprint review & backlog refinement" },
];

const APPS = [
  { name: "VS Code",         pct: 35, color: "#6366f1" },
  { name: "Figma",           pct: 25, color: "#8b5cf6" },
  { name: "Chrome DevTools", pct: 18, color: "#06b6d4" },
  { name: "GitHub",          pct: 12, color: "#4ade80" },
  { name: "ChatGPT",         pct: 10, color: "#f59e0b" },
];

// ─── Small donut ─────────────────────────────────────────────────────────────
function Donut({ pcts }: { pcts: { pct: number; color: string }[] }) {
  const r = 52, cx = 60, cy = 60, stroke = 14;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  const segments = pcts.map(({ pct, color }) => {
    const len = (pct / 100) * circumference;
    const el = (
      <circle
        key={color}
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={`${len} ${circumference - len}`}
        strokeDashoffset={-offset}
        strokeLinecap="butt"
        style={{ transform: "rotate(-90deg)", transformOrigin: "60px 60px" }}
      />
    );
    offset += len;
    return el;
  });
  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border-default)" strokeWidth={stroke} />
      {segments}
      <text x={cx} y={cy - 4} textAnchor="middle" fill="var(--text-primary)" fontSize="13" fontWeight="600">418</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--text-secondary)" fontSize="9">total days</text>
    </svg>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const timer = useTimer();
  const name = user?.name ?? "Milena Page";
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="p-5 pb-[100px] flex flex-col gap-4 min-w-[900px]">
      <div className="flex gap-4">

        {/* ── Left profile card ── */}
        <div
          className="w-[230px] shrink-0 rounded-[14px] border border-[var(--border-default)] flex flex-col items-center p-5 gap-3"
          style={{ backgroundColor: "var(--bg-field)" }}
        >
          {/* Avatar */}
          <div className="w-[88px] h-[88px] rounded-full flex items-center justify-center text-3xl font-bold text-white" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
            {initial}
          </div>
          <div className="text-center">
            <p className="text-body-medium" style={{ color: "var(--text-primary)", fontWeight: 600 }}>{name}</p>
            <p className="text-body-small mt-0.5" style={{ color: "var(--text-secondary)" }}>{user?.jobTitle ?? "Senior Frontend Developer"}</p>
            <p className="text-body-small mt-0.5" style={{ color: "var(--text-tertiary)" }}>Bengaluru, India · IST</p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 w-full">
            <button className="flex-1 py-1.5 rounded-[8px] text-body-small font-medium border border-[var(--border-default)] transition-opacity hover:opacity-80" style={{ backgroundColor: "var(--bg-canvas)", color: "var(--text-secondary)" }}>
              Call
            </button>
            <button className="flex-1 py-1.5 rounded-[8px] text-body-small font-medium border border-[var(--border-default)] transition-opacity hover:opacity-80" style={{ backgroundColor: "var(--bg-canvas)", color: "var(--text-secondary)" }}>
              Message
            </button>
          </div>

          <div className="w-full border-t border-[var(--border-default)] pt-3 grid grid-cols-2 gap-3">
            <div className="text-center">
              <p className="text-body-medium" style={{ color: "var(--text-primary)", fontWeight: 700 }}>362</p>
              <p className="text-body-small" style={{ color: "var(--text-tertiary)" }}>Days in company</p>
            </div>
            <div className="text-center">
              <p className="text-body-medium" style={{ color: "var(--text-primary)", fontWeight: 700 }}>12</p>
              <p className="text-body-small" style={{ color: "var(--text-tertiary)" }}>Done Projects</p>
            </div>
          </div>

          {/* Salary */}
          <div className="w-full rounded-[10px] border border-[var(--border-default)] p-3 flex items-center justify-between" style={{ backgroundColor: "var(--bg-canvas)" }}>
            <div>
              <p className="text-body-medium" style={{ color: "var(--text-primary)", fontWeight: 600 }}>₹1,45,000</p>
              <p className="text-body-small" style={{ color: "var(--text-tertiary)" }}>Monthly Salary (INR)</p>
            </div>
            <span className="text-label-score rounded-[6px] px-2 py-1" style={{ backgroundColor: "var(--green-50)", color: "var(--green-700)" }}>Paid</span>
          </div>
        </div>

        {/* ── Right 3-col grid ── */}
        <div className="flex-1 flex flex-col gap-4">

          {/* Row 1: Timer | Working Format | Weekly Activity */}
          <div className="grid grid-cols-3 gap-4">

            {/* Time Tracking */}
            <div className="rounded-[14px] border border-[var(--border-default)] p-4 flex flex-col gap-3" style={{ backgroundColor: "var(--bg-field)" }}>
              <div className="flex items-center justify-between">
                <span className="text-body-small font-medium" style={{ color: "var(--text-secondary)" }}>Time tracking</span>
                <span className="text-body-small rounded px-2 py-0.5" style={{ backgroundColor: "var(--border-default)", color: "var(--text-tertiary)" }}>···</span>
              </div>
              <div className="rounded-[10px] p-3 flex items-center justify-between" style={{ backgroundColor: "var(--bg-canvas)" }}>
                <span className="font-mono font-semibold" style={{ color: "var(--text-primary)", fontSize: "22px" }}>{timer.display}</span>
                <button
                  onClick={timer.toggle}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-on-primary)" }}
                >
                  {timer.running ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
                  )}
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {[{ label: "Build responsive layout", time: "2:10:07" }, { label: "Debug API integration", time: "1:12:11" }].map((t) => (
                  <div key={t.label} className="flex items-center justify-between">
                    <span className="text-body-small truncate pr-2" style={{ color: "var(--text-secondary)" }}>↻ {t.label}</span>
                    <span className="text-body-small shrink-0" style={{ color: "var(--text-tertiary)" }}>{t.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Working Format */}
            <div className="rounded-[14px] border border-[var(--border-default)] p-4 flex flex-col items-center gap-3" style={{ backgroundColor: "var(--bg-field)" }}>
              <div className="flex items-center justify-between w-full">
                <span className="text-body-small font-medium" style={{ color: "var(--text-secondary)" }}>Working Format</span>
                <span className="text-body-small rounded px-2 py-0.5" style={{ backgroundColor: "var(--green-50)", color: "var(--green-700)" }}>3 mos. Avg</span>
              </div>
              <Donut pcts={[{ pct: 55, color: "#6366f1" }, { pct: 35, color: "#4ade80" }, { pct: 10, color: "#f59e0b" }]} />
              <div className="flex items-center gap-3 text-body-small flex-wrap justify-center">
                {[["#6366f1","55%","In-Office"],["#4ade80","35%","Hybrid"],["#f59e0b","10%","Remote"]].map(([c,p,l]) => (
                  <div key={l} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
                    <span style={{ color: "var(--text-secondary)" }}>{p} {l}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Activity heatmap */}
            <div className="rounded-[14px] border border-[var(--border-default)] p-4 flex flex-col gap-2" style={{ backgroundColor: "var(--bg-field)" }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-body-small font-medium" style={{ color: "var(--text-secondary)" }}>Weekly Activity</span>
              </div>
              <div className="flex flex-col gap-1">
                {HEATMAP.map((row, ri) => (
                  <div key={ri} className="flex gap-1 justify-center">
                    {row.map((v, ci) => (
                      <div key={ci} className="w-5 h-5 rounded-[3px]" style={{ backgroundColor: heatColor(v) }} />
                    ))}
                  </div>
                ))}
              </div>
              <div className="flex gap-1 mt-1">
                {["Less","","","","More"].map((l, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-[2px]" style={{ backgroundColor: heatColor(i) }} />
                    {l && <span className="text-body-small" style={{ color: "var(--text-tertiary)", fontSize: "10px" }}>{l}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Tasks & Schedule */}
          <div className="rounded-[14px] border border-[var(--border-default)] p-4" style={{ backgroundColor: "var(--bg-field)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-body-small font-medium" style={{ color: "var(--text-secondary)" }}>Tasks &amp; Schedule (IST)</span>
              <span className="text-body-small" style={{ color: "var(--text-tertiary)" }}>Daily team timeline</span>
            </div>

            {/* Day strip */}
            <div className="flex gap-1 mb-4">
              {DAYS.map((d, i) => {
                const isToday = i === TODAY_IDX;
                return (
                  <div
                    key={d}
                    className="flex-1 flex flex-col items-center py-2 rounded-[8px]"
                    style={{ backgroundColor: isToday ? "var(--bg-primary)" : "var(--bg-canvas)" }}
                  >
                    <span className="text-body-small" style={{ color: isToday ? "var(--text-on-primary)" : "var(--text-tertiary)", fontSize: "10px" }}>{d}</span>
                    <span className="text-body-medium font-semibold mt-0.5" style={{ color: isToday ? "var(--text-on-primary)" : "var(--text-primary)" }}>{DATES[i]}</span>
                  </div>
                );
              })}
            </div>

            {/* Task list */}
            <div className="flex flex-col gap-3">
              {TASKS.map((t) => (
                <div key={t.label} className="flex items-start gap-3">
                  <span className="text-body-small shrink-0 w-10 text-right" style={{ color: "var(--text-tertiary)" }}>{t.time}</span>
                  <div className="w-0.5 h-10 rounded-full mt-1 shrink-0" style={{ backgroundColor: "var(--border-strong)" }} />
                  <div>
                    <p className="text-body-medium" style={{ color: "var(--text-primary)" }}>{t.label}</p>
                    <p className="text-body-small" style={{ color: "var(--text-secondary)" }}>{t.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Row 3: Apps & URLs */}
          <div className="rounded-[14px] border border-[var(--border-default)] p-4" style={{ backgroundColor: "var(--bg-field)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-body-small font-medium" style={{ color: "var(--text-secondary)" }}>Apps &amp; URLs</span>
              <span className="text-body-small" style={{ color: "var(--text-tertiary)" }}>···</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {APPS.map((a) => (
                <div key={a.name} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0 text-white font-bold text-xs" style={{ backgroundColor: a.color }}>
                    {a.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-body-small truncate" style={{ color: "var(--text-primary)" }}>{a.name}</span>
                      <span className="text-body-small shrink-0 ml-1" style={{ color: "var(--text-secondary)" }}>{a.pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ backgroundColor: "var(--border-default)" }}>
                      <div className="h-full rounded-full" style={{ width: `${a.pct}%`, backgroundColor: a.color }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
