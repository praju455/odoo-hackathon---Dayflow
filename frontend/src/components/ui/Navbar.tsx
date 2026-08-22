"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Avatar from "@/components/ui/Avatar";

const adminNav = [
  { label: "Analytics", href: "/admin/analytics" },
  { label: "Employees", href: "/employees" },
  { label: "Attendance", href: "/admin/attendance" },
  { label: "Time Off", href: "/admin/time-off" },
];

const employeeNav = [
  { label: "Dashboard", href: "/attendance" },
  { label: "Profile", href: "/profile" },
  { label: "Time Off", href: "/time-off" },
  { label: "Directory", href: "/employees" },
];

// Diamond logo matching Shiftly style
function DiamondLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L22 12L12 22L2 12L12 2Z" stroke="white" strokeWidth="1.5" fill="none" />
      <path d="M12 6L18 12L12 18L6 12L12 6Z" stroke="white" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const navItems = isAdmin ? adminNav : employeeNav;

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <div
      className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4"
      style={{ pointerEvents: "none" }}
    >
      <header
        className="flex items-center justify-between w-full max-w-6xl rounded-full px-5 py-3"
        style={{
          background: "rgba(8,8,8,0.92)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 4px 30px rgba(0,0,0,0.6)",
          pointerEvents: "all",
        }}
      >
        {/* Logo / Brand */}
        <Link
          href={isAdmin ? "/admin/analytics" : "/attendance"}
          className="flex items-center gap-3 shrink-0"
        >
          <DiamondLogo />
          <span style={{ fontSize: "16px", fontWeight: 400, color: "white", letterSpacing: "-0.01em" }}>
            Shiftly
          </span>
        </Link>

        {/* Center nav pills */}
        <nav className="hidden md:flex items-center" style={{ gap: "4px", background: "rgba(255,255,255,0.04)", borderRadius: "999px", padding: "4px", border: "1px solid rgba(255,255,255,0.07)" }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: "6px 18px",
                  borderRadius: "999px",
                  fontSize: "13px",
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? "black" : "rgba(255,255,255,0.5)",
                  background: isActive ? "white" : "transparent",
                  textDecoration: "none",
                  transition: "all 0.2s",
                  boxShadow: isActive ? "0 0 12px rgba(255,255,255,0.25)" : "none",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right — user + sign out */}
        <div className="flex items-center" style={{ gap: "12px" }}>
          {user && (
            <Link
              href="/profile"
              className="hidden sm:flex items-center gap-2"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "999px",
                padding: "5px 14px 5px 6px",
                textDecoration: "none",
              }}
            >
              <div style={{ borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
                <Avatar name={user.name} src={user.profilePictureUrl} size="sm" />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: "13px", fontWeight: 500, color: "white", maxWidth: "130px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.name}
                </p>
                <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textTransform: "lowercase" }}>
                  {user.role}
                </p>
              </div>
            </Link>
          )}
          <button
            onClick={handleLogout}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "999px",
              padding: "7px 16px",
              fontSize: "13px",
              fontWeight: 400,
              color: "rgba(255,255,255,0.5)",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            className="hover:text-white hover:border-red-500/40 hover:bg-red-500/10 transition-all"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav
        className="md:hidden fixed bottom-4 left-4 right-4 flex overflow-x-auto"
        style={{
          background: "rgba(8,8,8,0.92)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "20px",
          padding: "8px",
          gap: "4px",
          pointerEvents: "all",
        }}
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                flex: 1,
                textAlign: "center",
                padding: "8px 4px",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: isActive ? 500 : 400,
                color: isActive ? "black" : "rgba(255,255,255,0.4)",
                background: isActive ? "white" : "transparent",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
