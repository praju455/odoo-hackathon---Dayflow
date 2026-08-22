"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAttendanceStatus, TodayAttendanceStatus } from "@/context/AttendanceStatusContext";
import { api } from "@/lib/api";

interface Notification {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// ─── Nav tabs ─────────────────────────────────────────────────────────────────
// Employees → Member 4's directory landing page
// Attendance → Member 3's Step 6
// Time Off   → Member 3's Step 7
const NAV_TABS = [
  { label: "Employees",  href: "/employees"  },
  { label: "Attendance", href: "/attendance" },
  { label: "Time Off",   href: "/time-off"   },
] as const;

// ─── Status dot ───────────────────────────────────────────────────────────────
// null     → grey  (unknown / not yet fetched — Step 4 populates this)
// PRESENT  → green pulsing dot (checked in today)
// ABSENT   → yellow dot (no check-in, no approved leave)
// LEAVE    → airplane icon (on approved leave today — from Member 2's data)
function StatusDot({ status }: { status: TodayAttendanceStatus }) {
  if (status === "PRESENT") {
    return (
      <span className="relative flex h-2.5 w-2.5" aria-label="Checked in">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-70" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
      </span>
    );
  }
  if (status === "ABSENT") {
    return (
      <span
        className="inline-flex rounded-full h-2.5 w-2.5 bg-yellow-400"
        aria-label="Absent"
      />
    );
  }
  if (status === "LEAVE") {
    return (
      <span aria-label="On leave">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-4 h-4 text-indigo-400"
          aria-hidden="true"
        >
          {/* Paper-plane / send icon — matches the "airplane" indicator in the wireframe */}
          <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
        </svg>
      </span>
    );
  }
  // null → grey / unknown
  return (
    <span
      className="inline-flex rounded-full h-2.5 w-2.5 bg-slate-600"
      aria-label="Status unknown"
    />
  );
}

// ─── NavShell ─────────────────────────────────────────────────────────────────
export default function NavShell() {
  const pathname  = usePathname();
  const router    = useRouter();
  const { user, logout }   = useAuth();
  const { todayStatus }    = useAttendanceStatus();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    api.get<{ data: Notification[] }>("/notifications")
      .then((response) => setNotifications(response.data.data))
      .catch(() => setNotifications([]));
  }, []);

  useEffect(() => {
    if (notifOpen && notifications.some(n => !n.read)) {
      api.patch("/notifications/read-all")
        .then(() => setNotifications((current) => current.map((item) => ({ ...item, read: true }))))
        .catch(() => undefined);
    }
  }, [notifOpen, notifications]);

  // Close the dropdowns when the user clicks outside
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
      if (
        notifRef.current &&
        !notifRef.current.contains(e.target as Node)
      ) {
        setNotifOpen(false);
      }
    }
    if (dropdownOpen || notifOpen) {
      document.addEventListener("mousedown", onClickOutside);
    }
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [dropdownOpen, notifOpen]);

  // Close dropdown on route change (e.g. navigating via My Profile link)
  useEffect(() => {
    setDropdownOpen(false);
  }, [pathname]);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  const avatarInitial = user?.name?.charAt(0)?.toUpperCase() ?? "?";

  // A tab is "active" if we're exactly on its href or on a child route of it
  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className="fixed inset-x-0 top-0 z-50 h-16 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/40"
    >
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* ── Left: Brand ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-md shadow-indigo-500/30 shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 text-white"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
            </svg>
          </div>
          <span className="text-white font-semibold text-lg tracking-tight select-none">
            Shiftly
          </span>
        </div>

        {/* ── Center: Nav tabs ───────────────────────────────────────────── */}
        <div className="flex items-center gap-0.5">
          {NAV_TABS.map((tab) => {
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`
                  relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${
                    active
                      ? "text-white bg-indigo-600/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/70"
                  }
                `}
              >
                {tab.label}
                {/* Active underline indicator */}
                {active && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-indigo-500 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>

        {/* ── Right: Status dot + avatar ─────────────────────────────────── */}
        <div className="flex items-center gap-3 shrink-0">

          {/* Status dot + label */}
          <div className="flex items-center gap-1.5" aria-label="Today's attendance status">
            <StatusDot status={todayStatus} />
            <span className="text-xs text-slate-500 hidden sm:block">
              {todayStatus === "PRESENT" && "Checked in"}
              {todayStatus === "ABSENT"  && "Absent"}
              {todayStatus === "LEAVE"   && "On leave"}
            </span>
          </div>

          {/* ── Notification Bell ──── */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              aria-label="Open notifications"
              aria-expanded={notifOpen}
              className="relative p-2 text-slate-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              {notifications.some(n => !n.read) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-slate-900" />
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-slate-800 border border-slate-700/50 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-4 py-3 border-b border-slate-700/50">
                  <p className="text-white text-sm font-medium">Notifications</p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-xs text-slate-400 text-center">No notifications yet.</p>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="p-4 border-b border-slate-700/50 last:border-0 hover:bg-slate-700/30 transition-colors">
                        <p className="text-sm text-slate-200">{n.message}</p>
                        <p className="text-[10px] text-slate-500 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Avatar button + dropdown ──── */}
          <div className="relative" ref={dropdownRef}>
            <button
              id="nav-avatar-btn"
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              aria-haspopup="true"
              aria-expanded={dropdownOpen}
              aria-label="Open user menu"
              className="flex items-center gap-2 rounded-xl px-1.5 py-1 hover:bg-slate-800/70 transition-colors duration-150"
            >
              {/* Avatar image or initial */}
              {user?.profilePictureUrl ? (
                <Image
                  src={user.profilePictureUrl}
                  alt={user.name}
                  width={32}
                  height={32}
                  unoptimized
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/40"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-sm font-bold ring-2 ring-indigo-500/30 shrink-0">
                  {avatarInitial}
                </div>
              )}

              {/* Name + role (hidden on very small screens) */}
              <div className="hidden sm:block text-left min-w-0">
                <p className="text-white text-xs font-medium leading-tight truncate max-w-[100px]">
                  {user?.name}
                </p>
                <p className="text-slate-500 text-[10px] leading-tight capitalize">
                  {user?.role?.toLowerCase()}
                </p>
              </div>

              {/* Chevron */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div
                role="menu"
                aria-label="User menu"
                className="
                  absolute right-0 top-full mt-2 w-56
                  bg-slate-800 border border-slate-700/50
                  rounded-xl shadow-2xl shadow-black/50
                  overflow-hidden z-50
                  animate-in fade-in slide-in-from-top-1 duration-150
                "
              >
                {/* User info header (non-interactive) */}
                <div className="px-4 py-3 border-b border-slate-700/50">
                  <p className="text-white text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-slate-400 text-xs truncate font-mono">{user?.loginId}</p>
                </div>

                {/* My Profile */}
                <div className="py-1">
                  <Link
                    href="/profile"
                    role="menuitem"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700/60 transition-colors duration-100"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4 text-slate-400 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    My Profile
                  </Link>
                </div>

                {/* Log Out (red, separated by border) */}
                <div className="border-t border-slate-700/50 py-1">
                  <button
                    id="nav-logout-btn"
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-slate-700/60 transition-colors duration-100"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
