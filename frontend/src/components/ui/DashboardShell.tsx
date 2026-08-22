"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { YuIcon } from "./YuIcons";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Close drawer on escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsMobileDrawerOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!user) return null; // Let the layout wrapper handle redirects

  const isAdmin = user.role === "ADMIN";

  const menuItems = isAdmin
    ? [
        { label: "Dashboard", href: "/admin/analytics", icon: "target-04" },
        { label: "Employees", href: "/employees", icon: "users-01" },
        { label: "Attendance", href: "/admin/attendance", icon: "check" },
        { label: "Time Off", href: "/admin/time-off", icon: "clipboard" },
      ]
    : [
        { label: "Dashboard", href: "/attendance", icon: "target-04" },
        { label: "Profile", href: "/profile", icon: "user-plus-01" },
        { label: "Time Off", href: "/time-off", icon: "clipboard" },
        { label: "Directory", href: "/employees", icon: "users-01" },
      ];

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ backgroundColor: "var(--bg-canvas)" }}>
      {/* Mobile Overlay */}
      {isMobileDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setIsMobileDrawerOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        id="sidebar"
        className={`flex-shrink-0 h-full flex flex-col sidebar-collapsed ${
          isMobileDrawerOpen ? "active" : ""
        }`}
        style={{
          width: "280px",
          backgroundColor: "var(--bg-sidebar)",
          borderRight: "1px solid var(--border-default)",
        }}
      >
        <div className="flex-1 overflow-y-auto px-[18px] py-[19px] flex flex-col">
          {/* Brand block */}
          <div className="relative flex items-center mb-[37px] h-12">
            <div
              className="flex-shrink-0 flex items-center justify-center rounded-[14px]"
              style={{ width: "48px", height: "48px", backgroundColor: "var(--bg-logo)" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L22 12L12 22L2 12L12 2Z" stroke="black" strokeWidth="2" fill="none" />
                <path d="M12 6L18 12L12 18L6 12L12 6Z" stroke="black" strokeWidth="2" fill="none" />
              </svg>
            </div>
            <div className="ml-[13px] flex flex-col justify-center overflow-hidden">
              <span className="text-heading-brand text-primary truncate whitespace-nowrap">Shiftly</span>
              <span className="text-body-regular text-tertiary truncate whitespace-nowrap">
                {isAdmin ? "Admin workspace" : "Employee workspace"}
              </span>
            </div>
            <div className="absolute right-0 text-icon-muted">
              <YuIcon name="chevron-selector-vertical" width={16} height={16} />
            </div>
          </div>

          {/* Search field */}
          <div
            className="relative flex items-center mb-[21px] rounded-[10px]"
            style={{ width: "244px", height: "38px", backgroundColor: "var(--bg-field)" }}
          >
            <div className="pl-[12px] text-icon-muted">
              <YuIcon name="search-lg" width={16} height={16} />
            </div>
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-transparent border-none outline-none pl-[8px] text-body-regular text-tertiary"
            />
            <div
              className="absolute right-[8px] flex items-center justify-center rounded-[6px]"
              style={{ width: "26px", height: "20px", backgroundColor: "var(--bg-canvas)" }}
            >
              <span className="text-body-small text-tertiary">/</span>
            </div>
          </div>

          {/* Nav list */}
          <nav className="flex flex-col gap-[4px] flex-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center rounded-[10px] transition-colors"
                  style={{
                    height: "38px",
                    padding: "0 12px",
                    backgroundColor: isActive ? "var(--bg-primary)" : "transparent",
                    boxShadow: isActive ? "0 2px 5px rgba(13,15,20,.08), 0 1px 1px rgba(13,15,20,.05)" : "none",
                  }}
                  onClick={() => setIsMobileDrawerOpen(false)}
                >
                  <div style={{ color: isActive ? "var(--icon-strong)" : "var(--icon-default)" }}>
                    {/* @ts-ignore */}
                    <YuIcon name={item.icon} width={16} height={16} />
                  </div>
                  <span
                    className="ml-[8px] text-body-regular whitespace-nowrap overflow-hidden"
                    style={{ color: isActive ? "var(--text-on-primary)" : "var(--text-secondary)" }}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User block */}
        <div className="px-[18px] pb-[19px] mt-auto">
          <div className="relative flex items-center">
            <div className="relative flex-shrink-0" style={{ width: "40px", height: "40px", marginLeft: "4px" }}>
              <div
                className="w-full h-full rounded-full flex items-center justify-center font-semibold text-lg text-black"
                style={{ backgroundColor: "var(--border-default)" }}
              >
                {user.name.charAt(0)}
              </div>
              {/* Online dot */}
              <div
                className="absolute bottom-0 right-0 rounded-full"
                style={{
                  width: "14px",
                  height: "14px",
                  backgroundColor: "var(--bg-sidebar)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div className="rounded-full" style={{ width: "10px", height: "10px", backgroundColor: "var(--green-400)" }} />
              </div>
            </div>
            <div className="ml-[12px] flex flex-col justify-center overflow-hidden">
              <span className="text-heading-brand text-primary truncate whitespace-nowrap">{user.name}</span>
              <span className="text-body-regular text-tertiary truncate whitespace-nowrap">{user.email}</span>
            </div>
            <button onClick={handleLogout} className="ml-auto text-icon-muted hover:text-icon-strong p-2">
              <YuIcon name="settings-01" width={16} height={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Column */}
      <main className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header
          className="flex-shrink-0 flex items-center justify-between"
          style={{ height: "67px", borderBottom: "1px solid var(--border-default)", padding: "0 18px" }}
        >
          <div className="flex items-center gap-4">
            {/* Hamburger for mobile */}
            <button
              className="md:hidden text-icon-default"
              onClick={() => setIsMobileDrawerOpen(true)}
              aria-expanded={isMobileDrawerOpen}
            >
              <YuIcon name="list" width={20} height={20} />
            </button>
            <h1
              className="text-heading-page text-primary truncate"
              style={{ paddingLeft: "0.6px" }} /* 18.6px from left if 18px padding is set */
            >
              Dashboard
            </h1>
          </div>

          <div className="flex-1" />

          {/* Right Header Controls */}
          <div className="flex items-center">
            <div className="hidden md:flex items-center" style={{ gap: "22px" }}>
              <YuIcon name="info-circle" width={16} height={16} className="text-icon-default cursor-pointer" />
              <YuIcon name="settings-01" width={16} height={16} className="text-icon-default cursor-pointer" />
              <YuIcon name="bell-01" width={16} height={16} className="text-icon-default cursor-pointer" />
            </div>
            <div className="hidden md:block w-[16px]" />
            <button
              className="flex items-center justify-center hover:bg-primary-hover transition-colors whitespace-nowrap flex-shrink-0"
              style={{
                width: "62px",
                height: "38px",
                borderRadius: "10px",
                backgroundColor: "var(--bg-primary)",
                color: "var(--text-on-primary)",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              Share
            </button>
          </div>
        </header>

        {/* Page Content scrolls here */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
