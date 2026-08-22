"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Avatar from "@/components/ui/Avatar";
import ChatWidget from "@/components/employee/ChatWidget";

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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
    return <div className="min-h-screen bg-[#f5f6f3]" />;
  }

  return (
    <div className="flex min-h-screen bg-[#f5f6f3] text-[#111814]">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-[#e2e5df] bg-[#eef0ec] px-6 py-7 lg:flex">
        <Link href="/admin/analytics" className="mb-12 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full border-2 border-[#0f7a4b] text-[#0f7a4b]">
            <span className="h-3 w-3 rounded-full border-4 border-current" />
          </div>
          <span className="text-xl font-bold tracking-tight">Shiftly</span>
        </Link>

        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#9a9f99]">Menu</p>
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  active
                    ? "bg-[#050505] text-[#0f7a4b] shadow-2xl"
                    : "text-[#8b938a] hover:bg-[#050505]/75 hover:text-[#1f2a24]"
                }`}
              >
                {active && <span className="absolute -left-6 h-11 w-1.5 rounded-r-full bg-[#14844f]" />}
                <Icon name={item.icon} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <p className="mb-4 mt-12 text-xs font-semibold uppercase tracking-[0.16em] text-[#9a9f99]">General</p>
        <div className="space-y-2">
          <Link
            href="/profile"
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-[#8b938a] hover:bg-[#050505]/75 hover:text-[#1f2a24]"
          >
            <Icon name="team" />
            Profile
          </Link>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-[#8b938a] hover:bg-[#050505]/75 hover:text-[#1f2a24]"
          >
            <Icon name="calendar" />
            Logout
          </button>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex min-h-20 items-center justify-between gap-4 border-b border-[#e2e5df] bg-[#f8f9f6]/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="hidden min-w-0 sm:block">
            <p className="text-sm font-bold text-[#111814]">Admin workspace</p>
            <p className="mt-0.5 text-xs text-[#7b837a]">People, attendance, and leave operations</p>
          </div>

          <nav className="flex gap-2 overflow-x-auto lg:hidden">
            {menuItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                    active ? "bg-[#137d4c] text-white" : "bg-[#050505] text-[#7d847c]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Link href="/profile" className="ml-auto flex min-w-0 items-center gap-3 rounded-2xl bg-[#050505] py-1.5 pl-2 pr-4 shadow-2xl">
            <Avatar name={user.name} src={user.profilePictureUrl} size="sm" />
            <span className="hidden min-w-0 sm:block">
              <span className="block max-w-[180px] truncate text-sm font-bold text-[#111814]">{user.name}</span>
              <span className="block max-w-[180px] truncate text-xs text-[#7d847c]">{user.email}</span>
            </span>
          </Link>
        </header>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </section>

      <ChatWidget offsetRight="1.5rem" />
    </div>
  );
}
