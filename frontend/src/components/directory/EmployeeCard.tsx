import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import StatusBadge from "@/components/directory/StatusBadge";
import type { DirectoryEmployee, EmployeeStatus } from "@/types/employee";

interface EmployeeCardProps {
  employee: DirectoryEmployee;
  status: EmployeeStatus;
}

export default function EmployeeCard({ employee, status }: EmployeeCardProps) {
  return (
    <Link
      href={`/employees/${employee.id}`}
      className="group block rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg"
      aria-label={`View ${employee.name}'s profile`}
    >
      <div className="flex items-start justify-between gap-3">
        <Avatar name={employee.name} src={employee.profilePictureUrl} size="lg" />
        <StatusBadge status={status} />
      </div>

      <div className="mt-5 min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-base font-bold text-slate-950 group-hover:text-emerald-800">
            {employee.name}
          </p>
          {employee.role === "ADMIN" && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
              Admin
            </span>
          )}
        </div>
        <p className="mt-1 truncate text-sm text-slate-500">
          {employee.jobTitle || "Team member"}
        </p>
        <p className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {employee.department || "Unassigned"}
        </p>
      </div>
    </Link>
  );
}
