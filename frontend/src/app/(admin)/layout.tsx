"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import DashboardShell from "@/components/ui/DashboardShell";
import ChatWidget from "@/components/employee/ChatWidget";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.replace("/login");
    else if (user.mustChangePassword) router.replace("/change-password");
    else if (user.role !== "ADMIN") router.replace("/employees");
  }, [isLoading, router, user]);

  if (isLoading || !user || user.mustChangePassword || user.role !== "ADMIN") {
    return <div className="min-h-screen" style={{ backgroundColor: "var(--bg-canvas)" }} />;
  }

  return (
    <>
      <DashboardShell>{children}</DashboardShell>
      <ChatWidget offsetRight="1.5rem" />
    </>
  );
}
