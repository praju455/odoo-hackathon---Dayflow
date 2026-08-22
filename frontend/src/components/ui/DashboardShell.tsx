"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { YuIcon } from "./YuIcons";

const titles: Record<string, string> = {
  "/admin/analytics": "Overview",
  "/admin/attendance": "Attendance",
  "/admin/time-off": "Time off",
  "/admin/projects": "Projects",
  "/admin/chat": "Team Chat",
  "/admin/messages": "Messages",
  "/employees": "People",
  "/attendance": "My workday",
  "/profile": "My profile",
  "/time-off": "Time off",
  "/dashboard": "Dashboard",
  "/analytics": "Analytics",
  "/projects": "Projects",
  "/chat": "Team Chat",
  "/messages": "Messages",
};

const adminItems = [
  { label: "Overview",    href: "/admin/analytics",  icon: "grid-01" as const },
  { label: "People",      href: "/employees",         icon: "users-01" as const },
  { label: "Attendance",  href: "/admin/attendance",  icon: "check" as const },
  { label: "Time off",    href: "/admin/time-off",    icon: "clipboard" as const },
  { label: "Projects",    href: "/admin/projects",    icon: "folder" as const },
  { label: "Team Chat",   href: "/admin/chat",        icon: "chat" as const },
  { label: "Messages",    href: "/admin/messages",    icon: "mail" as const },
];

const employeeItems = [
  { label: "Dashboard",   href: "/dashboard",   icon: "home" as const },
  { label: "Analytics",   href: "/analytics",   icon: "analytics" as const },
  { label: "Projects",    href: "/projects",    icon: "folder" as const },
  { label: "My workday",  href: "/attendance",  icon: "target-04" as const },
  { label: "Time off",    href: "/time-off",    icon: "clipboard" as const },
  { label: "Chat",        href: "/chat",        icon: "chat" as const },
  { label: "Messages",    href: "/messages",    icon: "mail" as const },
  { label: "My profile",  href: "/profile",     icon: "user-plus-01" as const },
  { label: "Directory",   href: "/employees",   icon: "users-01" as const },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  if (!user) return null;

  const isAdmin = user.role === "ADMIN";
  const menuItems = isAdmin ? adminItems : employeeItems;
  const title =
    Object.entries(titles).find(
      ([route]) => pathname === route || pathname.startsWith(`${route}/`),
    )?.[1] ?? "Shiftly";

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#070807] text-white">
      {drawerOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[252px] flex-col border-r border-white/10 bg-[#0b0c0b] transition-transform lg:static lg:translate-x-0 ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex min-h-20 items-center gap-3 border-b border-white/10 px-6">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-white text-black">
            <span className="grid h-4 w-4 rotate-45 place-items-center border-2 border-black">
              <span className="h-1.5 w-1.5 border border-black" />
            </span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">Shiftly</p>
            <p className="truncate text-xs text-white/45">
              {isAdmin ? "Admin workspace" : "Employee workspace"}
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">
            Workspace
          </p>
          {menuItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setDrawerOpen(false)}
                className={`flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition ${active ? "bg-white text-black" : "text-white/55 hover:bg-white/5 hover:text-white"}`}
              >
                <YuIcon name={item.icon} width={17} height={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <Link
            href="/profile"
            className="mb-2 flex min-w-0 items-center gap-3 rounded-md px-2 py-2 hover:bg-white/5"
          >
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#26d07c] font-semibold text-black">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs text-white/40">{user.email}</p>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm text-white/50 hover:bg-white/5 hover:text-white"
          >
            <YuIcon name="switch-vertical-01" width={16} height={16} />
            Sign out
          </button>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-20 shrink-0 items-center gap-4 border-b border-white/10 bg-[#080908] px-4 sm:px-6">
          <button
            aria-label="Open navigation"
            className="grid h-10 w-10 place-items-center rounded-md border border-white/10 lg:hidden"
            onClick={() => setDrawerOpen(true)}
          >
            <YuIcon name="list" width={19} height={19} />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold sm:text-2xl">{title}</h1>
            <p className="mt-0.5 hidden text-xs text-white/40 sm:block">
              {isAdmin
                ? "Company operations and people data"
                : "Your work, profile, and requests"}
            </p>
          </div>
          <div className="ml-auto rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-white/55">
            {isAdmin ? "Admin" : "Employee"}
          </div>
        </header>
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </section>
    </div>
  );
}
