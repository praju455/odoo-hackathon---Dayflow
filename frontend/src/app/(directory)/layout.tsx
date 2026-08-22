"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import ChatWidget from "@/components/employee/ChatWidget";
import DashboardShell from "@/components/ui/DashboardShell";
import { useAuth } from "@/context/AuthContext";

export default function DirectoryLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.replace("/login");
    else if (user.mustChangePassword) router.replace("/change-password");
  }, [isLoading, router, user]);

  if (isLoading || !user || user.mustChangePassword) {
    return <div className="min-h-screen bg-[#070807]" />;
  }

  return (
    <DashboardShell>
      {children}
      <ChatWidget offsetRight="1.25rem" />
    </DashboardShell>
  );
}
