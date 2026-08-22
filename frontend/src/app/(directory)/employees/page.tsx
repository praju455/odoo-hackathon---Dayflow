"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {
  EmptyState,
  LoadingState,
  MetricCard,
  PageIntro,
  StatusPill,
  inputClass,
  primaryButton,
} from "@/components/ui/Workspace";

type Employee = {
  id: string;
  name: string;
  email: string;
  loginId: string;
  role: string;
  department?: string;
  jobTitle?: string;
  joiningDate?: string;
  manager?: { name: string } | null;
};

export default function EmployeesPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/employees")
      .then((response) => setEmployees(response.data.data || []))
      .catch((requestError) => setError(requestError.response?.data?.error || "Could not load employees"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const needle = query.toLowerCase();
    return employees.filter((employee) =>
      `${employee.name} ${employee.email} ${employee.department || ""} ${employee.jobTitle || ""}`
        .toLowerCase()
        .includes(needle),
    );
  }, [employees, query]);

  const departmentCount = new Set(employees.map((employee) => employee.department).filter(Boolean)).size;
  const recentHires = employees.filter((employee) =>
    employee.joiningDate && Date.now() - new Date(employee.joiningDate).getTime() < 90 * 86400000,
  ).length;

  return (
    <div>
      <PageIntro
        eyebrow="People"
        title="Employee directory"
        description="Your company team, roles and reporting lines from Shiftly."
        actions={user?.role === "ADMIN" ? <Link className={primaryButton} href="/admin/employees/new">Add employee</Link> : undefined}
      />
      <div className="grid grid-cols-1 gap-px border-b border-white/10 bg-white/10 sm:grid-cols-3">
        <MetricCard label="Team members" value={employees.length} detail="Active company accounts" />
        <MetricCard label="Departments" value={departmentCount} detail="Teams represented" />
        <MetricCard label="Joined recently" value={recentHires} detail="Started in the last 90 days" />
      </div>
      <div className="p-4 sm:p-6">
        <input
          aria-label="Search employees"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name, email, department or role"
          className={`${inputClass} max-w-xl`}
        />
      </div>
      {loading ? <LoadingState /> : error ? (
        <EmptyState title="Directory unavailable" detail={error} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No employees found" detail="Try a different search." />
      ) : (
        <div className="grid gap-3 px-4 pb-8 sm:grid-cols-2 sm:px-6 xl:grid-cols-3">
          {filtered.map((employee) => (
            <Link
              key={employee.id}
              href={`/employees/${employee.id}`}
              className="group border border-white/10 bg-[#0b0b0b] p-5 transition hover:border-emerald-400/60 hover:bg-white/[.03]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid size-11 shrink-0 place-items-center rounded-full bg-emerald-400/10 font-semibold text-emerald-300">
                    {employee.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-white">{employee.name}</h2>
                    <p className="truncate text-sm text-white/50">{employee.email}</p>
                  </div>
                </div>
                <StatusPill status={employee.role} />
              </div>
              <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
                <div><dt className="text-white/40">Department</dt><dd className="mt-1 text-white/80">{employee.department || "Unassigned"}</dd></div>
                <div><dt className="text-white/40">Role</dt><dd className="mt-1 text-white/80">{employee.jobTitle || "Team member"}</dd></div>
                <div><dt className="text-white/40">Manager</dt><dd className="mt-1 text-white/80">{employee.manager?.name || "Not assigned"}</dd></div>
                <div><dt className="text-white/40">Login ID</dt><dd className="mt-1 truncate font-mono text-white/80">{employee.loginId}</dd></div>
              </dl>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
