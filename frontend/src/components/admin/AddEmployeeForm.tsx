"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import type { DirectoryEmployee } from "@/types/employee";

export default function AddEmployeeForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    loginId: string;
    tempPassword: string;
    name: string;
  } | null>(null);

  const [employees, setEmployees] = useState<DirectoryEmployee[]>([]);

  useEffect(() => {
    async function fetchEmployees() {
      try {
        const res = await api.get<{ employees: DirectoryEmployee[] }>("/employees");
        setEmployees(res.data.employees);
      } catch (err) {
        console.error("Failed to load employees for manager dropdown:", err);
      }
    }
    fetchEmployees();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string || undefined,
      department: formData.get("department") as string,
      jobTitle: formData.get("jobTitle") as string,
      managerId: formData.get("managerId") as string || undefined,
      joiningDate: formData.get("joiningDate") as string,
    };

    try {
      const res = await api.post("/employees", data);
      setSuccessData({
        loginId: res.data.employee.loginId,
        tempPassword: res.data.tempPassword,
        name: res.data.employee.name,
      });
    } catch (err: any) {
      setError(
        err.response?.data?.error || err.message || "Failed to create employee"
      );
    } finally {
      setLoading(false);
    }
  }

  const handleCopyCredentials = () => {
    if (!successData) return;
    const text = `Login ID: ${successData.loginId}\nPassword: ${successData.tempPassword}`;
    navigator.clipboard.writeText(text);
    alert("Credentials copied to clipboard!");
  };

  if (successData) {
    return (
      <div className="card p-8 max-w-md mx-auto text-center space-y-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Employee Created</h2>
          <p className="text-sm text-gray-500 mt-2">
            Share these credentials with {successData.name}.<br/>
            They will only be shown this one time.
          </p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 text-left border border-gray-200">
          <div className="mb-3">
            <span className="text-xs font-semibold text-gray-500 uppercase">Login ID</span>
            <div className="font-mono text-gray-900 font-medium">{successData.loginId}</div>
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase">Temp Password</span>
            <div className="font-mono text-gray-900 font-medium">{successData.tempPassword}</div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button onClick={handleCopyCredentials} className="btn-primary w-full">
            Copy Credentials
          </button>
          <button onClick={() => router.push("/employees")} className="btn-ghost w-full">
            Return to Directory
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6 md:p-8 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Add New Employee</h2>
      
      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name *</label>
            <input required type="text" name="name" id="name" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address *</label>
            <input required type="email" name="email" id="email" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
            <input type="tel" name="phone" id="phone" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>

          <div className="space-y-2">
            <label htmlFor="joiningDate" className="block text-sm font-medium text-gray-700">Joining Date *</label>
            <input required type="date" name="joiningDate" id="joiningDate" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>

          <div className="space-y-2">
            <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department *</label>
            <input required type="text" name="department" id="department" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>

          <div className="space-y-2">
            <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700">Job Title *</label>
            <input required type="text" name="jobTitle" id="jobTitle" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label htmlFor="managerId" className="block text-sm font-medium text-gray-700">Manager</label>
            <select name="managerId" id="managerId" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white">
              <option value="">-- None --</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button type="button" onClick={() => router.back()} className="btn-ghost" disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Creating..." : "Create Employee"}
          </button>
        </div>
      </form>
    </div>
  );
}
