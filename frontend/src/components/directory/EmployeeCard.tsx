// EmployeeCard — one card in the directory grid.
// Shows photo/avatar, name, department/title, and a live status indicator.
// Clicking navigates to /employees/[id].

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
      className="group relative flex flex-col items-center gap-3 rounded-2xl bg-white p-5
                 shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-100
                 transition-all duration-200 cursor-pointer"
      aria-label={`View ${employee.name}'s profile`}
    >
      {/* Status badge — top-right corner */}
      <span className="absolute top-3 right-3">
        <StatusBadge status={status} />
      </span>

      {/* Avatar */}
      <div className="mt-2">
        <Avatar
          name={employee.name}
          src={employee.profilePictureUrl}
          size="lg"
        />
      </div>

      {/* Info */}
      <div className="text-center min-w-0 w-full">
        <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-indigo-600 transition-colors">
          {employee.name}
        </p>
        {employee.department && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {employee.department}
          </p>
        )}
        {employee.role === "ADMIN" && (
          <span className="mt-2 inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600 uppercase tracking-wide">
            Admin
          </span>
        )}
      </div>
    </Link>
  );
}
