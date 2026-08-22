"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import ProfileView from "@/components/directory/ProfileView";
import type { UserProfile } from "@/types/employee";

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
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center gap-5 rounded-[28px] border border-slate-200 bg-white p-6">
          <div className="h-20 w-20 rounded-full bg-slate-200" />
          <div className="space-y-3 flex-1">
            <div className="h-5 w-48 rounded bg-slate-200" />
            <div className="h-4 w-32 rounded bg-slate-100" />
          </div>
        </div>
        <div className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 w-full rounded bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error || !employee) {
    return (
      <div className="space-y-3 rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="font-semibold text-red-700">{error ?? "Something went wrong."}</p>
        <Link
          href="/employees"
          className="inline-block text-sm font-semibold text-emerald-700 hover:underline"
        >
          Back to Employees
        </Link>
      </div>
    );
  }

  // ── Profile (read-only for others) ───────────────────────────────────────
  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/employees" className="font-semibold transition-colors hover:text-emerald-700">
          Employees
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-950">{employee.name}</span>
      </nav>

      <ProfileView
        employee={employee}
        readOnly={true}
        isAdmin={isAdmin}
      />
    </div>
  );
}
