"use client";

import Link from "next/link";
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

function labelize(value: string) {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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
    <section
      className={`min-h-44 rounded-3xl p-6 shadow-sm ${
        featured
          ? "bg-gradient-to-br from-[#064423] via-[#0c693b] to-[#198954] text-white"
          : "bg-white text-[#111814]"
      }`}
    >
      <p className={`text-sm font-bold ${featured ? "text-white" : "text-[#111814]"}`}>{label}</p>
      <p className="mt-8 text-5xl font-bold leading-none tracking-tight">{value}</p>
      <p className={`mt-5 text-sm ${featured ? "text-white/75" : "text-[#70786f]"}`}>{note}</p>
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="grid h-full min-h-48 place-items-center rounded-2xl border border-dashed border-[#dfe4dd] bg-[#fafbf8] text-center text-sm font-semibold text-[#8b938a]">
      {text}
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
    const headcountData = Object.entries(source.headcount)
      .map(([name, count]) => ({ name: labelize(name), count }))
      .sort((a, b) => b.count - a.count);
    const attendanceData = Object.entries(source.attendance).map(([name, count]) => ({
      name: labelize(name),
      count,
    }));
    const leaveData = Object.entries(source.leaveRequests).map(([name, value]) => ({
      name: labelize(name),
      value,
    }));

    const employees = headcountData.reduce((sum, item) => sum + item.count, 0);
    const present = numberFrom(source.attendance, ["PRESENT", "present"]);
    const absent = numberFrom(source.attendance, ["ABSENT", "absent"]);
    const onLeave = numberFrom(source.attendance, ["LEAVE", "leave", "ON_LEAVE"]);
    const pending = numberFrom(source.leaveRequests, ["PENDING", "pending"]);
    const approved = numberFrom(source.leaveRequests, ["APPROVED", "approved"]);
    const rejected = numberFrom(source.leaveRequests, ["REJECTED", "rejected"]);
    const leaveTotal = approved + pending + rejected;
    const approvalRate = leaveTotal > 0 ? Math.round((approved / leaveTotal) * 100) : 0;
    const attendanceTotal = present + absent + onLeave;
    const presentRate = attendanceTotal > 0 ? Math.round((present / attendanceTotal) * 100) : 0;

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
      rejected,
      leaveTotal,
      approvalRate,
      presentRate,
    };
  }, [data]);

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
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-[#111814] sm:text-5xl">Dashboard</h1>
          <p className="mt-3 max-w-2xl text-base text-[#7b837a]">
            Live HR overview from attendance, leave, and employee records.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/employees/new"
            className="rounded-full bg-[#0f7a4b] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#0b633c]"
          >
            + Add Employee
          </Link>
          <Link
            href="/employees"
            className="rounded-full border border-[#133f2a] bg-white px-6 py-3 text-sm font-bold text-[#133f2a] transition hover:bg-[#eef0ec]"
          >
            View Directory
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Employees" value={dashboard.employees} note="Active records in the company" featured />
        <StatCard label="Present Today" value={dashboard.present} note={`${dashboard.presentRate}% of today's attendance`} />
        <StatCard label="On Leave" value={dashboard.onLeave} note="Marked as leave in attendance" />
        <StatCard
          label="Pending Leave"
          value={dashboard.pending}
          note={dashboard.pending ? "Needs admin review" : "No pending approvals"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-[#111814]">Headcount By Department</h2>
              <p className="mt-1 text-sm text-[#7b837a]">Uses the department data saved on employee profiles.</p>
            </div>
            <span className="rounded-full bg-[#eef4ef] px-3 py-1 text-xs font-bold text-[#0f7a4b]">
              {dashboard.employees} total
            </span>
          </div>
          <div className="mt-6 h-80">
            {dashboard.headcountData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboard.headcountData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#7b837a", fontSize: 12 }} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#7b837a", fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: "rgba(15,122,75,0.08)" }}
                    contentStyle={{
                      border: "1px solid #edf0eb",
                      borderRadius: 14,
                      boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
                    }}
                  />
                  <Bar dataKey="count" radius={[18, 18, 6, 6]} barSize={54}>
                    {dashboard.headcountData.map((_, index) => (
                      <Cell key={index} fill={index % 3 === 0 ? "#0f7a4b" : index % 3 === 1 ? "#68be92" : "#d6ddd4"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState text="No department data yet" />
            )}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-[#111814]">Attendance Mix</h2>
          <p className="mt-1 text-sm text-[#7b837a]">Today’s status split from attendance records.</p>
          <div className="mt-6 space-y-5">
            {[
              ["Present", dashboard.present, "#168350"],
              ["Absent", dashboard.absent, "#e45d46"],
              ["On Leave", dashboard.onLeave, "#f5b233"],
            ].map(([label, value, color]) => {
              const width =
                dashboard.present + dashboard.absent + dashboard.onLeave > 0
                  ? Math.round((Number(value) / (dashboard.present + dashboard.absent + dashboard.onLeave)) * 100)
                  : 0;
              return (
                <div key={String(label)}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-[#111814]">{label}</span>
                    <span className="font-semibold text-[#7b837a]">{value}</span>
                  </div>
                  <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#e4e9e2]">
                    <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: String(color) }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr_1fr]">
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-[#111814]">Leave Requests</h2>
          <p className="mt-1 text-sm text-[#7b837a]">Current request status distribution.</p>
          <div className="mt-6 h-64">
            {dashboard.leaveTotal > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Approved", value: dashboard.approved },
                      { name: "Pending", value: dashboard.pending },
                      { name: "Rejected", value: dashboard.rejected },
                    ].filter((item) => item.value > 0)}
                    innerRadius={58}
                    outerRadius={88}
                    dataKey="value"
                    paddingAngle={4}
                  >
                    <Cell fill="#168350" />
                    <Cell fill="#f5b233" />
                    <Cell fill="#e45d46" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState text="No leave requests yet" />
            )}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-[#f6f8f4] p-3">
              <p className="text-2xl font-bold text-[#111814]">{dashboard.approved}</p>
              <p className="text-xs text-[#7b837a]">Approved</p>
            </div>
            <div className="rounded-2xl bg-[#f6f8f4] p-3">
              <p className="text-2xl font-bold text-[#111814]">{dashboard.pending}</p>
              <p className="text-xs text-[#7b837a]">Pending</p>
            </div>
            <div className="rounded-2xl bg-[#f6f8f4] p-3">
              <p className="text-2xl font-bold text-[#111814]">{dashboard.approvalRate}%</p>
              <p className="text-xs text-[#7b837a]">Approval</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-[#111814]">Admin Actions</h2>
          <p className="mt-1 text-sm text-[#7b837a]">Useful places to continue real workflows.</p>
          <div className="mt-6 space-y-3">
            {[
              ["Review attendance", "/admin/attendance", `${dashboard.present} present today`],
              ["Review leave queue", "/admin/time-off", `${dashboard.pending} pending`],
              ["Manage employees", "/employees", `${dashboard.employees} employee records`],
              ["Create employee", "/admin/employees/new", "Generate login credentials"],
            ].map(([label, href, note]) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between gap-3 rounded-2xl border border-[#edf0eb] bg-[#fafbf8] px-4 py-4 transition hover:border-[#0f7a4b]/30 hover:bg-[#f3f6f1]"
              >
                <span>
                  <span className="block text-sm font-bold text-[#111814]">{label}</span>
                  <span className="mt-1 block text-xs text-[#7b837a]">{note}</span>
                </span>
                <span className="text-lg text-[#0f7a4b]">›</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-[#063a23] p-6 text-white shadow-sm">
          <h2 className="text-xl font-bold">Operational Snapshot</h2>
          <p className="mt-1 text-sm text-white/65">A compact health check from today’s records.</p>
          <div className="mt-8 space-y-5">
            <div>
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>Attendance coverage</span>
                <span>{dashboard.presentRate}%</span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-white" style={{ width: `${dashboard.presentRate}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>Leave approvals</span>
                <span>{dashboard.approvalRate}%</span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-[#68be92]" style={{ width: `${dashboard.approvalRate}%` }} />
              </div>
            </div>
            <p className="rounded-2xl bg-white/10 p-4 text-sm leading-relaxed text-white/78">
              {dashboard.pending
                ? `${dashboard.pending} leave request${dashboard.pending === 1 ? "" : "s"} still need review.`
                : "No pending leave reviews right now."}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
