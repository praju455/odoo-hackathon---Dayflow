"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Avatar from "@/components/ui/Avatar";

const adminNav = [
  { label: "Dashboard", href: "/admin/analytics" },
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
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href={isAdmin ? "/admin/analytics" : "/attendance"} className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-700 text-white shadow-sm">
            <span className="text-lg font-bold">S</span>
          </div>
          <div>
            <p className="text-xl font-bold tracking-tight text-slate-950">Shiftly</p>
            <p className="hidden text-xs font-medium text-slate-500 sm:block">HRMS workspace</p>
          </div>
        </Link>

        <nav className="hidden items-center rounded-full bg-slate-100 p-1 md:flex">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "bg-white text-emerald-800 shadow-sm"
                    : "text-slate-600 hover:text-slate-950"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {user && (
            <Link href="/profile" className="hidden items-center gap-3 rounded-2xl bg-slate-50 py-2 pl-2 pr-4 sm:flex">
              <Avatar name={user.name} src={user.profilePictureUrl} size="sm" />
              <div className="min-w-0">
                <p className="max-w-[150px] truncate text-sm font-bold text-slate-950">{user.name}</p>
                <p className="max-w-[150px] truncate text-xs text-slate-500">{user.role.toLowerCase()}</p>
              </div>
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            Sign out
          </button>
        </div>
      </div>

      <nav className="flex gap-2 overflow-x-auto border-t border-slate-100 px-4 py-3 md:hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                isActive ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
