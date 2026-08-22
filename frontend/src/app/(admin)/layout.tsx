"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Avatar from "@/components/ui/Avatar";

const menuItems = [
  { label: "Dashboard", href: "/admin/analytics", icon: "grid" },
  { label: "Employees", href: "/employees", icon: "team" },
  { label: "Attendance", href: "/admin/attendance", icon: "chart" },
  { label: "Time Off", href: "/admin/time-off", icon: "calendar" },
];

function Icon({ name }: { name: string }) {
  if (name === "team") {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M16 11a4 4 0 1 0-8 0" />
        <path d="M5 20a7 7 0 0 1 14 0" />
        <path d="M18 9.5a3 3 0 0 1 3 3" />
        <path d="M3 12.5a3 3 0 0 1 3-3" />
      </svg>
    );
  }

  if (name === "chart") {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="M8 16v-5" />
        <path d="M12 16V8" />
        <path d="M16 16v-7" />
      </svg>
    );
  }

  if (name === "calendar") {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M7 3v4" />
        <path d="M17 3v4" />
        <path d="M4 9h16" />
        <path d="M5 5h14v15H5z" />
      </svg>
    );
  }

  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 4h7v7H4z" />
      <path d="M13 4h7v7h-7z" />
      <path d="M4 13h7v7H4z" />
      <path d="M13 13h7v7h-7z" />
    </svg>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.replace("/login");
    else if (user.mustChangePassword) router.replace("/change-password");
    else if (user.role !== "ADMIN") router.replace("/employees");
  }, [isLoading, router, user]);

  if (isLoading || !user || user.mustChangePassword || user.role !== "ADMIN") {
    return <div className="min-h-screen bg-[#eef0ef]" />;
  }

  return (
    <div className="min-h-screen bg-[#e7e8e6] px-3 py-4 text-[#111814] sm:px-6 lg:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl overflow-hidden rounded-[28px] border-[10px] border-white bg-[#f7f7f4] shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
        <aside className="hidden w-56 shrink-0 flex-col border-r border-[#e6e8e4] bg-[#f3f4f1] px-5 py-7 lg:flex">
          <Link href="/admin/analytics" className="mb-12 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#0f7a4b] text-[#0f7a4b]">
              <span className="h-3 w-3 rounded-full border-4 border-current" />
            </div>
            <span className="text-lg font-bold tracking-tight">Shiftly</span>
          </Link>

          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9a9f99]">
            Menu
          </p>
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "bg-white text-[#0f7a4b] shadow-sm"
                      : "text-[#929891] hover:bg-white/70 hover:text-[#1f2a24]"
                  }`}
                >
                  {active && (
                    <span className="absolute -left-5 h-10 w-1.5 rounded-r-full bg-[#14844f]" />
                  )}
                  <Icon name={item.icon} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <p className="mb-4 mt-12 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9a9f99]">
            General
          </p>
          <div className="space-y-2">
            <Link
              href="/profile"
              className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-[#929891] hover:bg-white/70 hover:text-[#1f2a24]"
            >
              <Icon name="team" />
              Profile
            </Link>
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold text-[#929891] hover:bg-white/70 hover:text-[#1f2a24]"
            >
              <Icon name="calendar" />
              Logout
            </button>
          </div>

          <div className="mt-auto overflow-hidden rounded-3xl bg-[#063a23] p-4 text-white shadow-lg">
            <p className="text-sm font-bold leading-tight">Team operations, all in one place</p>
            <p className="mt-2 text-[11px] leading-relaxed text-white/65">
              Attendance, leave and people metrics stay connected.
            </p>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between gap-4 border-b border-[#e6e8e4] bg-[#f7f7f4] px-4 py-4 sm:px-6">
            <div className="relative hidden min-w-0 max-w-sm flex-1 sm:block">
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[#7d847c]">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m21 21-4.3-4.3" />
                  <circle cx="11" cy="11" r="7" />
                </svg>
              </span>
              <input
                type="search"
                placeholder="Search team"
                className="h-12 w-full rounded-2xl border border-[#eceee9] bg-white pl-11 pr-4 text-sm text-[#1f2a24] outline-none transition placeholder:text-[#a8ada6] focus:border-[#14844f]"
              />
            </div>

            <nav className="flex gap-2 overflow-x-auto lg:hidden">
              {menuItems.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                      active ? "bg-[#137d4c] text-white" : "bg-white text-[#7d847c]"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="ml-auto flex items-center gap-3">
              <button className="hidden h-11 w-11 place-items-center rounded-2xl bg-white text-[#1f2a24] shadow-sm sm:grid" aria-label="Messages">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 6h16v12H4z" />
                  <path d="m4 7 8 6 8-6" />
                </svg>
              </button>
              <button className="hidden h-11 w-11 place-items-center rounded-2xl bg-white text-[#1f2a24] shadow-sm sm:grid" aria-label="Notifications">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                  <path d="M10 21h4" />
                </svg>
              </button>
              <Link href="/profile" className="flex min-w-0 items-center gap-3 rounded-2xl bg-white py-1.5 pl-2 pr-4 shadow-sm">
                <Avatar name={user.name} src={user.profilePictureUrl} size="sm" />
                <span className="hidden min-w-0 sm:block">
                  <span className="block max-w-[150px] truncate text-sm font-bold text-[#111814]">{user.name}</span>
                  <span className="block max-w-[150px] truncate text-xs text-[#7d847c]">{user.email}</span>
                </span>
              </Link>
            </div>
          </header>

          <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
        </section>
      </div>
    </div>
  );
}
