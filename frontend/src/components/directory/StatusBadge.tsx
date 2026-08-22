// StatusBadge — the live status indicator shown in the top-right corner of
// each EmployeeCard on the directory grid.
//
// Green dot  = present (checked in today)
// ✈ icon     = on approved leave today
// Yellow dot = absent (no check-in, no approved leave)

import type { EmployeeStatus } from "@/types/employee";

interface StatusBadgeProps {
  status: EmployeeStatus;
  /** Show a text label beside the indicator (used in profile header) */
  showLabel?: boolean;
}

const config: Record<
  EmployeeStatus,
  { dot?: string; icon?: string; label: string; ring: string }
> = {
  present: {
    dot: "bg-green-500",
    label: "Present",
    ring: "ring-green-100",
  },
  "on-leave": {
    icon: "✈",
    label: "On Leave",
    ring: "ring-indigo-100",
  },
  absent: {
    dot: "bg-yellow-400",
    label: "Absent",
    ring: "ring-yellow-100",
  },
};

export default function StatusBadge({
  status,
  showLabel = false,
}: StatusBadgeProps) {
  const { dot, icon, label, ring } = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${showLabel ? "text-xs font-medium text-gray-600" : ""}`}
      title={label}
      aria-label={label}
    >
      <span
        className={`relative flex h-3 w-3 items-center justify-center rounded-full ring-2 ${ring} ${dot ?? "bg-indigo-100"}`}
      >
        {dot ? (
          <>
            {/* Pulse animation for "present" only */}
            {status === "present" && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-50" />
            )}
            <span className={`relative inline-flex h-3 w-3 rounded-full ${dot}`} />
          </>
        ) : (
          <span className="text-[8px] leading-none">{icon}</span>
        )}
      </span>
      {showLabel && <span>{label}</span>}
    </span>
  );
}
