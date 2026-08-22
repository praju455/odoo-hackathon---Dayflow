"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Avatar from "@/components/ui/Avatar";

const navItems = [
  { label: "Employees", href: "/employees" },
  { label: "Attendance", href: "/admin/attendance", adminOnly: true },
  { label: "Time Off", href: "/admin/time-off", adminOnly: true },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  
  const isAdmin = user?.role === "ADMIN";
  const visibleNav = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/employees" className="flex items-center gap-2 shrink-0">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-sm">
            D
          </span>
          <span className="text-lg font-bold text-gray-900 tracking-tight">
            Dayflow
          </span>
        </Link>

        {/* Nav tabs */}
        <nav className="hidden sm:flex items-center gap-1">
          {visibleNav.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User menu */}
        <div className="flex items-center gap-3">
          {user && (
            <>
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 hover:bg-gray-100 transition-colors"
                title="My Profile"
              >
                <Avatar name={user.name} size="sm" />
                <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                  {user.name}
                </span>
              </Link>
              <button
                onClick={logout}
                className="text-xs text-gray-500 hover:text-red-500 transition-colors px-2 py-1 rounded"
                aria-label="Sign out"
              >
                Sign out
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      <div className="sm:hidden border-t border-gray-100 flex overflow-x-auto px-4 py-2 gap-2">
        {visibleNav.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
