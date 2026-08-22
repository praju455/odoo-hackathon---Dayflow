"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import NavShell from "@/components/employee/NavShell";
import { AttendanceStatusProvider } from "@/context/AttendanceStatusContext";

// ─── Auth-guarded layout for all (employee) routes ───────────────────────────
// This layout wraps: /attendance, /time-off, /profile  (Steps 5–7).
// It does NOT wrap /login or /change-password (those are outside this group).
//
// Guards:
//   • No user in context → redirect to /login
//   • mustChangePassword is still true → redirect to /change-password
//     (prevents employees from skipping the forced password change by typing
//     a URL directly)
//
// Member 4 note: import NavShell from "@/components/employee/NavShell" and
// wrap your own layout(s) with <AttendanceStatusProvider> so the status dot
// works across the full app.

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // wait until localStorage has been read

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.mustChangePassword) {
      router.replace("/change-password");
    }
  }, [user, isLoading, router]);

  // ── Loading / unauthenticated state ──────────────────────────────────────
  // Render a full-screen spinner while auth is being determined, so the
  // protected page content never flashes before the redirect fires.
  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="animate-spin w-8 h-8 text-indigo-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-label="Loading"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          <p className="text-slate-500 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  // ── Authenticated: render nav + page ─────────────────────────────────────
  return (
    <AttendanceStatusProvider>
      <div className="min-h-screen bg-slate-950">
        <NavShell />
        {/*
          pt-16 offsets the fixed nav bar (h-16 = 64px).
          Pages fill the rest of the viewport below the nav.
        */}
        <main className="pt-16">
          {children}
        </main>
      </div>
    </AttendanceStatusProvider>
  );
}
