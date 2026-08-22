"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import ProfileView from "@/components/directory/ProfileView";
import type { UserProfile } from "@/types/employee";
import { YuIcon } from "@/components/ui/YuIcons";

export default function EmployeeProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const id = params?.id as string;

  const [employee, setEmployee] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Smart routing: own profile → delegate to Member 3's /profile ──────────
  useEffect(() => {
    if (user && id === user.id) {
      router.replace("/profile");
      return;
    }

    async function fetchEmployee() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get<{ employee: UserProfile }>(
          `/employees/${id}`,
        );
        setEmployee(res.data.employee);
      } catch (err: unknown) {
        if (
          err &&
          typeof err === "object" &&
          "response" in err &&
          (err as { response?: { status?: number } }).response?.status === 404
        ) {
          setError("Employee not found.");
        } else {
          setError("Failed to load profile. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchEmployee();
    }
  }, [id, user, router]);

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-[100px] mt-8">
        <div className="bg-field border border-[var(--border-default)] rounded-[16px] p-8 flex gap-6 items-center shadow-sm animate-pulse">
          <div className="h-[88px] w-[88px] rounded-[16px] bg-[var(--bg-canvas)]" />
          <div className="space-y-3 flex-1">
            <div className="h-6 w-48 rounded bg-[var(--bg-canvas)]" />
            <div className="h-4 w-32 rounded bg-[var(--bg-canvas)]" />
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error || !employee) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)] px-4">
        <div className="rounded-[16px] border border-[var(--border-default)] bg-field-on-canvas p-8 text-center max-w-sm shadow-sm space-y-4">
          <div className="mx-auto flex h-[48px] w-[48px] items-center justify-center rounded-full" style={{ backgroundColor: "var(--red-50)" }}>
            <YuIcon name="info-circle" width={24} height={24} className="text-[#f87171]" />
          </div>
          <p className="text-body-medium text-primary">{error ?? "Something went wrong."}</p>
          <Link
            href="/employees"
            className="inline-block mt-4 px-5 py-2.5 rounded-[10px] text-body-medium font-semibold text-secondary bg-field hover:bg-field-on-canvas border border-[var(--border-default)] transition-all shadow-sm"
          >
            Back to Directory
          </Link>
        </div>
      </div>
    );
  }

  // ── Profile (read-only for others) ───────────────────────────────────────
  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-body-small text-tertiary px-6 sm:px-8 mt-6">
        <Link href="/employees" className="font-semibold transition-colors hover:text-primary">
          Employees
        </Link>
        <span>/</span>
        <span className="font-semibold text-primary">{employee.name}</span>
      </nav>

      <ProfileView
        employee={employee}
        readOnly={true}
        isAdmin={isAdmin}
      />
    </div>
  );
}
