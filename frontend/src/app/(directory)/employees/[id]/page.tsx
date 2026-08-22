"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import ProfileView from "@/components/directory/ProfileView";
import Avatar from "@/components/ui/Avatar";
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
        <div className="card p-6 flex gap-5 items-center">
          <div className="h-20 w-20 rounded-full bg-gray-200" />
          <div className="space-y-3 flex-1">
            <div className="h-5 bg-gray-200 rounded w-48" />
            <div className="h-4 bg-gray-100 rounded w-32" />
          </div>
        </div>
        <div className="card p-6 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-100 rounded w-full" />
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error || !employee) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-8 text-center space-y-3">
        <p className="text-red-600 font-medium">{error ?? "Something went wrong."}</p>
        <Link
          href="/employees"
          className="inline-block text-sm text-indigo-600 hover:underline"
        >
          ← Back to Employees
        </Link>
      </div>
    );
  }

  // ── Profile (read-only for others) ───────────────────────────────────────
  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/employees" className="hover:text-indigo-600 transition-colors">
          Employees
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{employee.name}</span>
      </nav>

      <ProfileView
        employee={employee}
        readOnly={true}
        isAdmin={isAdmin}
      />
    </div>
  );
}
