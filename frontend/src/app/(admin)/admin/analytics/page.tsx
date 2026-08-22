"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface AnalyticsData {
  attendance: Record<string, number>;
  leaveRequests: Record<string, number>;
  headcount: Record<string, number>;
}

function numberFrom(record: Record<string, number>, keys: string[]) {
  return keys.reduce((sum, key) => sum + (record[key] ?? record[key.toUpperCase()] ?? 0), 0);
}

function StatCard({
  label,
  value,
  note,
  featured,
}: {
  label: string;
  value: number | string;
  note: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl p-5 shadow-sm ${
        featured
          ? "bg-gradient-to-br from-[#064423] via-[#0c693b] to-[#198954] text-white"
          : "bg-white text-[#111814]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <p className={`text-sm font-bold ${featured ? "text-white" : "text-[#111814]"}`}>{label}</p>
        <span
          className={`grid h-9 w-9 place-items-center rounded-full border text-sm ${
            featured ? "border-white/30 bg-white text-[#0b4f2d]" : "border-[#dfe3dd] bg-white text-[#111814]"
          }`}
        >
          ↗
        </span>
      </div>
      <p className="mt-5 text-5xl font-bold leading-none tracking-tight">{value}</p>
      <p className={`mt-4 text-xs ${featured ? "text-white/75" : "text-[#70786f]"}`}>{note}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get<{ success: boolean; data: AnalyticsData }>("/analytics/summary");
        if (res.data.success) setData(res.data.data);
      } catch (err: unknown) {
        setError(
          (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
            "Failed to load analytics",
        );
      } finally {
        setLoading(false);
      }
    }
    void fetchData();
  }, []);

  const dashboard = useMemo(() => {
    const source = data ?? { attendance: {}, leaveRequests: {}, headcount: {} };
    const headcountData = Object.entries(source.headcount).map(([name, count]) => ({
      name,
      count,
    }));
    const attendanceData = Object.entries(source.attendance).map(([name, count]) => ({
      name: name.replace("_", " "),
      count,
    }));
    const leaveData = Object.entries(source.leaveRequests).map(([name, value]) => ({
      name,
      value,
    }));

    const employees = headcountData.reduce((sum, item) => sum + item.count, 0);
    const present = numberFrom(source.attendance, ["PRESENT", "present"]);
    const absent = numberFrom(source.attendance, ["ABSENT", "absent"]);
    const onLeave = numberFrom(source.attendance, ["LEAVE", "leave", "ON_LEAVE"]);
    const pending = numberFrom(source.leaveRequests, ["PENDING", "pending"]);
    const approved = numberFrom(source.leaveRequests, ["APPROVED", "approved"]);
    const leaveTotal = leaveData.reduce((sum, item) => sum + item.value, 0);
    const completion = leaveTotal > 0 ? Math.round((approved / leaveTotal) * 100) : 0;

    return {
      attendanceData,
      headcountData,
      leaveData,
      employees,
      present,
      absent,
      onLeave,
      pending,
      approved,
      completion,
    };
  }, [data]);

  const projectList = [
    { title: "Review attendance", date: "Today", color: "bg-[#1d64f2]" },
    { title: "Approve leave queue", date: `${dashboard.pending} pending`, color: "bg-[#1f9d7a]" },
    { title: "Update headcount", date: `${dashboard.employees} people`, color: "bg-[#f5b233]" },
    { title: "Payroll readiness", date: "This month", color: "bg-[#e45d46]" },
  ];

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center rounded-3xl bg-white text-sm font-semibold text-[#7d847c]">
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-100 bg-red-50 p-6 text-sm font-semibold text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-[-0.04em] text-[#111814]">Dashboard</h1>
          <p className="mt-2 text-sm text-[#8b9188]">
            Plan, prioritize, and manage your HR operations with ease.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="rounded-full bg-[#0f7a4b] px-6 py-3 text-sm font-bold text-white shadow-sm">
            + Add Employee
          </button>
          <button className="rounded-full border border-[#133f2a] bg-white px-6 py-3 text-sm font-bold text-[#133f2a]">
            Export Data
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Employees" value={dashboard.employees} note="Active people in the company" featured />
        <StatCard label="Present Today" value={dashboard.present} note="Checked in or marked present" />
        <StatCard label="On Leave" value={dashboard.onLeave} note="Approved leave status today" />
        <StatCard label="Pending Leave" value={dashboard.pending} note={dashboard.pending ? "Needs admin review" : "All caught up"} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr_0.68fr]">
        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-[#111814]">Team Analytics</h2>
          <div className="mt-5 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboard.headcountData.length ? dashboard.headcountData : dashboard.attendanceData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#8b9188", fontSize: 12 }} />
                <YAxis hide allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "rgba(15,122,75,0.08)" }}
                  contentStyle={{
                    border: "1px solid #edf0eb",
                    borderRadius: 14,
                    boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
                  }}
                />
                <Bar dataKey="count" radius={[22, 22, 22, 22]} barSize={46}>
                  {(dashboard.headcountData.length ? dashboard.headcountData : dashboard.attendanceData).map((_, index) => (
                    <Cell
                      key={index}
                      fill={index % 3 === 0 ? "#0f7a4b" : index % 3 === 1 ? "#68be92" : "#d6ddd4"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-[#111814]">Reminders</h2>
          <div className="mt-5">
            <p className="text-2xl font-bold leading-tight tracking-[-0.04em] text-[#102016]">
              Daily HR sync
            </p>
            <p className="mt-1 text-sm text-[#8b9188]">Time: 02.00 pm - 04.00 pm</p>
            <button className="mt-7 w-full rounded-full bg-[#0f7a4b] px-5 py-3 text-sm font-bold text-white">
              Start Meeting
            </button>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#111814]">Work Queue</h2>
            <span className="rounded-full border border-[#dfe3dd] px-3 py-1 text-xs font-bold text-[#111814]">
              + New
            </span>
          </div>
          <div className="mt-5 space-y-4">
            {projectList.map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <span className={`mt-1 h-4 w-4 rounded-full ${item.color}`} />
                <div>
                  <p className="text-sm font-bold text-[#111814]">{item.title}</p>
                  <p className="text-xs text-[#9ca39a]">{item.date}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr_0.68fr]">
        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#111814]">Team Collaboration</h2>
            <span className="rounded-full border border-[#dfe3dd] px-3 py-1 text-xs font-bold text-[#111814]">
              + Add Member
            </span>
          </div>
          <div className="mt-5 space-y-4">
            {[
              ["Ava Morgan", "Reviewing attendance exceptions", "Completed"],
              ["Ethan Williams", "Working on leave approvals", dashboard.pending ? "In Progress" : "Done"],
              ["Mia Rodriguez", "Updating department roster", "Pending"],
              ["Noah Chen", "Checking payroll readiness", "In Progress"],
            ].map(([name, task, status]) => (
              <div key={name} className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-[#f1d7c8] text-sm font-bold text-[#111814]">
                  {name.split(" ").map((part) => part[0]).join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[#111814]">{name}</p>
                  <p className="truncate text-xs text-[#8b9188]">{task}</p>
                </div>
                <span className="rounded-full bg-[#f5f7f2] px-2 py-1 text-[10px] font-bold text-[#97a094]">
                  {status}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-[#111814]">Leave Progress</h2>
          <div className="mt-4 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "Approved", value: dashboard.approved },
                    { name: "Pending", value: Math.max(dashboard.pending, 1) },
                  ]}
                  startAngle={205}
                  endAngle={-25}
                  innerRadius={62}
                  outerRadius={86}
                  dataKey="value"
                  paddingAngle={4}
                >
                  <Cell fill="#168350" />
                  <Cell fill="#d8ded5" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="-mt-28 text-center">
            <p className="text-5xl font-bold tracking-[-0.05em] text-[#111814]">{dashboard.completion}%</p>
            <p className="mt-1 text-xs text-[#8b9188]">Leave approved</p>
          </div>
          <div className="mt-20 flex justify-center gap-5 text-xs font-semibold text-[#7d847c]">
            <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#168350]" /> Approved</span>
            <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#d8ded5]" /> Pending</span>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl bg-[#063a23] p-5 text-white shadow-sm">
          <h2 className="text-base font-bold">Time Tracker</h2>
          <div className="mt-8 rounded-[28px] bg-[radial-gradient(circle_at_top_right,#0f7a4b,transparent_45%),linear-gradient(135deg,#062417,#0d5d35)] p-5 text-center shadow-inner">
            <p className="text-4xl font-bold tracking-[-0.04em]">01:24:08</p>
            <div className="mt-8 flex justify-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#0f7a4b]">Ⅱ</span>
              <span className="grid h-11 w-11 place-items-center rounded-full bg-[#e53e35] text-white">■</span>
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-[#111814]">Attendance Mix</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            ["Present", dashboard.present, "#168350"],
            ["Absent", dashboard.absent, "#e45d46"],
            ["On Leave", dashboard.onLeave, "#f5b233"],
          ].map(([label, value, color]) => (
            <div key={label} className="rounded-2xl border border-[#edf0eb] bg-[#fafbf8] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8b9188]">{label}</p>
              <p className="mt-3 text-3xl font-bold text-[#111814]">{value}</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e3e7e1]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, Number(value) * 20)}%`,
                    backgroundColor: String(color),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
