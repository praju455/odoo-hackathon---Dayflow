"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import DashboardShell from "@/components/ui/DashboardShell";
import CheckInWidget from "@/components/employee/CheckInWidget";
import ChatWidget from "@/components/employee/ChatWidget";
import { AttendanceStatusProvider } from "@/context/AttendanceStatusContext";

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.replace("/login");
    else if (user.mustChangePassword) router.replace("/change-password");
  }, [user, isLoading, router]);

  if (isLoading || !user || user.mustChangePassword) {
    return <div className="min-h-screen" style={{ backgroundColor: "var(--bg-canvas)" }} />;
  }

  return (
    <AttendanceStatusProvider>
      <DashboardShell>{children}</DashboardShell>
      <CheckInWidget />
      <ChatWidget />
    </AttendanceStatusProvider>
  );
}
