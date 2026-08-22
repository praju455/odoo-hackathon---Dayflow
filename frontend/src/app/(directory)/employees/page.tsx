"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { YuIcon } from "@/components/ui/YuIcons";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Employee {
  id: string;
  loginId: string;
  name: string;
  email: string;
  department: string | null;
  jobTitle: string | null;
  role: string;
  joiningDate: string;
  manager?: { id: string; name: string } | null;
}

// ─── KPI sparkline ────────────────────────────────────────────────────────────
const SparkUp = () => (
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
);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });

type StatusKey = "ACTIVE" | "ON_LEAVE" | "INACTIVE";
const STATUS_STYLE: Record<StatusKey, { bg: string; tx: string; label: string }> = {
  ACTIVE:   { bg: "--green-50", tx: "--green-700",  label: "ACTIVE"   },
  ON_LEAVE: { bg: "--amber-50", tx: "--amber-700",  label: "ON LEAVE" },
  INACTIVE: { bg: "--red-50",   tx: "--red-700",    label: "INACTIVE" },
};

const TYPE_STYLE: Record<string, { bg: string; tx: string }> = {
  EMPLOYEE: { bg: "--green-50",  tx: "--green-700" },
  ADMIN:    { bg: "--amber-50",  tx: "--amber-700" },
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading]     = useState(true);
  const [query, setQuery]         = useState("");
  const [deptFilter, setDeptFilter] = useState("All");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<{ employees: Employee[] }>("/employees");
      setEmployees(res.data.employees || []);
    } catch {
      // silently fail — empty state handles it
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const departments = ["All", ...Array.from(new Set(employees.map((e) => e.department || "Unassigned").sort()))];

  const filtered = employees.filter((e) => {
    const q = query.toLowerCase();
    const matchQ = !q || e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q) || (e.department || "").toLowerCase().includes(q);
    const matchD = deptFilter === "All" || (e.department || "Unassigned") === deptFilter;
    return matchQ && matchD;
  });

  const totalEmployees = employees.length;
  const activeCount    = employees.filter((e) => e.role !== "ADMIN").length;

  return (
    <div className="flex flex-col min-w-0 pb-[100px]">
      {/* ─── KPI Strip ──────────────────────────────────────────────────────── */}
      <div className="kpi-scroll-container flex border-b border-[var(--border-default)]" style={{ height: "112px" }}>
        <div className="flex w-full min-w-[1160px]">
          <div className="relative flex-shrink-0" style={{ width: "290px", height: "111px" }}>
            <div className="absolute top-[19.8px] left-[20.8px] text-body-medium text-secondary">Total Employees</div>
            <div className="absolute top-[53px] left-[20.8px] flex items-center gap-2">
              <span className="text-kpi-value text-primary">{loading ? "…" : totalEmployees}</span>
              <div className="flex items-center rounded-[7px] px-2 h-[26px]" style={{ backgroundColor: "var(--green-50)" }}>
                <YuIcon name="trend-up-01" width={16} height={16} className="text-[#4ade80]" />
                <span className="ml-[4px] text-label-score" style={{ color: "var(--green-700)" }}>Live</span>
              </div>
            </div>
            <div className="absolute top-[44px] right-[18.5px]"><SparkUp /></div>
          </div>

          <div className="relative flex-shrink-0 border-l border-[var(--border-default)]" style={{ width: "290px", height: "111px" }}>
            <div className="absolute top-[19.8px] left-[20.8px] text-body-medium text-secondary">Active Employees</div>
            <div className="absolute top-[53px] left-[20.8px] flex items-center gap-2">
              <span className="text-kpi-value text-primary">{loading ? "…" : activeCount}</span>
              <div className="flex items-center rounded-[7px] px-2 h-[26px]" style={{ backgroundColor: "var(--green-50)" }}>
                <span className="text-label-score" style={{ color: "var(--green-700)" }}>EMPLOYEE</span>
              </div>
            </div>
          </div>

          <div className="relative flex-shrink-0 border-l border-[var(--border-default)]" style={{ width: "290px", height: "111px" }}>
            <div className="absolute top-[19.8px] left-[20.8px] text-body-medium text-secondary">Departments</div>
            <div className="absolute top-[53px] left-[20.8px] flex items-center gap-2">
              <span className="text-kpi-value text-primary">{loading ? "…" : departments.length - 1}</span>
            </div>
          </div>

          <div className="relative flex-shrink-0 border-l border-[var(--border-default)] flex-1" style={{ minWidth: "290px", height: "111px" }}>
            <div className="absolute top-[19.8px] left-[20.8px] text-body-medium text-secondary">Admins</div>
            <div className="absolute top-[53px] left-[20.8px] flex items-center gap-2">
              <span className="text-kpi-value text-primary">{loading ? "…" : employees.filter((e) => e.role === "ADMIN").length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="tabs-scroll-container flex border-b border-[var(--border-default)] relative" style={{ height: "55px" }}>
        <div className="flex items-center h-full min-w-[1160px] pl-[20px] overflow-x-auto">
          {departments.slice(0, 6).map((dept, i) => (
            <button
              key={dept}
              onClick={() => setDeptFilter(dept)}
              className={`flex items-center h-full relative whitespace-nowrap ${deptFilter === dept ? "text-primary" : "text-secondary"}`}
              style={{ padding: i === 0 ? "0 14px 0 16.6px" : "0 22px" }}
            >
              <span className="text-label-tab">{dept === "All" ? `All Employees` : dept}</span>
              {dept === "All" && (
                <>
                  <div className="w-[4.4px]" />
                  <div className="flex items-center justify-center rounded-[7px] bg-field-on-canvas w-[37px] h-[26px] ml-1">
                    <span className="text-label-score text-secondary">{totalEmployees}</span>
                  </div>
                </>
              )}
              {deptFilter === dept && (
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Toolbar ────────────────────────────────────────────────────────── */}
      <div className="flex items-center min-w-0" style={{ height: "93px", paddingTop: "29px", paddingBottom: "26px", paddingLeft: "18px", paddingRight: "18px" }}>
        <div className="flex items-center">
          <div className="flex items-center rounded-[10px] bg-field-on-canvas" style={{ width: "283px", height: "38px", paddingLeft: "9px" }}>
            <YuIcon name="search-md" width={16} height={16} className="text-icon-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search employees"
              className="ml-[8px] text-body-regular text-primary bg-transparent border-none outline-none w-full"
            />
          </div>
          <div className="w-[22px]" />
          <YuIcon name="filter-funnel-01" width={16} height={16} className="text-icon-default mr-[42px]" />
        </div>
        <div className="flex-1" />
        <div className="flex items-center">
          <YuIcon name="list" width={16} height={16} className="text-icon-strong mr-[36px]" />
          <Link href="/admin/employees/new" className="flex items-center justify-center rounded-[10px] bg-primary text-on-primary whitespace-nowrap" style={{ width: "138px", height: "36px", padding: "0 12px", gap: "8px" }}>
            <YuIcon name="plus" width={16} height={16} />
            <span className="text-body-medium font-semibold">New Employee</span>
          </Link>
        </div>
      </div>

      {/* ─── Table ──────────────────────────────────────────────────────────── */}
      <div className="table-scroll-container">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-secondary text-body-regular">Loading employees…</div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-24 text-secondary text-body-regular">No employees found</div>
        ) : (
          <table className="w-full text-left table-fixed table-min-width" style={{ borderCollapse: "collapse" }}>
            <colgroup>
              <col style={{ width: "66px" }} />
              <col style={{ width: "180px" }} />
              <col style={{ width: "140px" }} />
              <col />
              <col style={{ width: "130px" }} />
              <col style={{ width: "140px" }} />
              <col style={{ width: "80px" }} />
              <col style={{ width: "130px" }} />
              <col style={{ width: "34px" }} />
            </colgroup>
            <thead>
              <tr style={{ height: "33px", borderBottom: "1px solid var(--border-default)" }}>
                <th scope="col" className="font-normal" style={{ paddingLeft: "19px" }}>
                  <div className="flex items-center justify-center rounded-[5px] bg-primary w-[18px] h-[18px]">
                    <div className="w-[10px] h-[2px] bg-[var(--text-on-primary)]" />
                  </div>
                </th>
                {["Employee", "Department", "Email", "Status", "Manager", "Role", "Joined"].map((h) => (
                  <th key={h} scope="col" className="text-body-regular text-secondary font-normal p-0">{h}</th>
                ))}
                <th scope="col" className="font-normal" style={{ paddingRight: "18px" }} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => {
                const statusKey: StatusKey = "ACTIVE";
                const st = STATUS_STYLE[statusKey];
                const ty = TYPE_STYLE[emp.role] || TYPE_STYLE.EMPLOYEE;
                return (
                  <tr key={emp.id} className="group hover:bg-sidebar transition-colors" style={{ height: "61.5px", borderBottom: "1px solid var(--border-default)" }}>
                    <td className="sticky-col-1" style={{ paddingLeft: "19px" }}>
                      <div className="flex items-center justify-center rounded-[5px] w-[18px] h-[18px] bg-field" />
                    </td>
                    <td className="sticky-col-2 p-0 pr-2">
                      <Link href={`/employees/${emp.id}`} className="text-body-medium text-primary truncate hover:underline block">{emp.name}</Link>
                    </td>
                    <td className="p-0 text-body-regular text-secondary truncate pr-2">{emp.department || "—"}</td>
                    <td className="p-0 text-body-regular text-secondary truncate pr-2">{emp.email}</td>
                    <td className="p-0">
                      <span className="inline-flex items-center justify-center rounded-[7px] border text-label-caps" style={{ height: "23px", padding: "0 8px", backgroundColor: "white", color: `var(${st.tx})`, borderColor: `var(${st.tx})` }}>
                        {st.label}
                      </span>
                    </td>
                    <td className="p-0 text-body-medium text-primary truncate pr-2">{emp.manager?.name || "—"}</td>
                    <td className="p-0" style={{ paddingTop: "3px" }}>
                      <span className="inline-flex items-center justify-center rounded-[7px] text-label-score" style={{ height: "26px", padding: "4px 6px", backgroundColor: `var(${ty.bg})`, color: `var(${ty.tx})` }}>
                        {emp.role === "ADMIN" ? "Admin" : "Employee"}
                      </span>
                    </td>
                    <td className="p-0 text-body-regular text-secondary truncate pr-2">{fmtDate(emp.joiningDate)}</td>
                    <td className="p-0" style={{ paddingRight: "18px" }}>
                      <Link href={`/employees/${emp.id}`} className="text-icon-muted hover:text-icon-strong">
                        <YuIcon name="dots-horizontal" width={16} height={16} className="float-right" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
