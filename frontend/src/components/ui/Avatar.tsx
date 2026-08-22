// Reusable Avatar component — shows profile picture or initials fallback.
// Used in EmployeeCard, ProfileView, and the navbar.

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

// Deterministic background color from name — same person always gets same color
function nameToColor(name: string): string {
  const colors = [
    "bg-indigo-500",
    "bg-violet-500",
    "bg-pink-500",
    "bg-rose-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-emerald-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

const sizeMap = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl",
};

export default function Avatar({
  name,
  src,
  size = "md",
  className = "",
}: AvatarProps) {
  const sizeClass = sizeMap[size];

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={`${sizeClass} rounded-full object-cover ring-2 ring-white ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} ${nameToColor(name)} rounded-full flex items-center justify-center font-semibold text-white ring-2 ring-white ${className}`}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  );
}
