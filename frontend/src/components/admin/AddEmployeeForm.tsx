"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import type { DirectoryEmployee } from "@/types/employee";
import { YuIcon } from "@/components/ui/YuIcons";

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
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      setError(
        e.response?.data?.error || e.message || "Failed to create employee"
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
      <div className="bg-field border border-[var(--border-default)] rounded-[16px] p-8 max-w-md mx-auto text-center space-y-6 shadow-sm mt-8">
        <div className="mx-auto flex h-[56px] w-[56px] items-center justify-center rounded-full bg-primary/10">
          <YuIcon name="user-plus-01" width={24} height={24} className="text-primary" />
        </div>
        <div>
          <h2 className="text-[24px] font-semibold text-primary">Employee Created</h2>
          <p className="text-body-regular text-secondary mt-2">
            Share these credentials with {successData.name}.<br/>
            They will only be shown this one time.
          </p>
        </div>
        
        <div className="bg-field-on-canvas rounded-[12px] p-5 text-left border border-[var(--border-default)] space-y-4">
          <div>
            <span className="text-label-caps text-secondary uppercase block mb-1">Login ID</span>
            <div className="font-mono text-body-medium text-primary">{successData.loginId}</div>
          </div>
          <div>
            <span className="text-label-caps text-secondary uppercase block mb-1">Temp Password</span>
            <div className="font-mono text-body-medium text-primary">{successData.tempPassword}</div>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <button onClick={handleCopyCredentials} className="px-5 py-2.5 rounded-[10px] text-body-medium font-semibold text-on-primary bg-primary hover:opacity-90 active:opacity-100 transition-all shadow-sm">
            Copy Credentials
          </button>
          <button onClick={() => router.push("/admin/analytics")} className="px-5 py-2.5 rounded-[10px] text-body-medium font-semibold text-secondary bg-field hover:bg-field-on-canvas border border-[var(--border-default)] transition-all shadow-sm">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const inputClass = "w-full px-3 py-2 rounded-[8px] bg-field border border-[var(--border-default)] text-body-regular text-primary placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--border-strong)] transition-all";
  const labelClass = "block text-body-medium text-secondary mb-1.5";

  return (
    <div className="bg-field-on-canvas border border-[var(--border-default)] rounded-[16px] p-6 md:p-8 max-w-2xl mx-auto shadow-sm mt-8 pb-[100px]">
      <h2 className="text-[24px] font-semibold text-primary mb-6">Add New Employee</h2>
      
      {error && (
        <div className="flex items-start gap-2.5 rounded-[8px] px-4 py-3 mb-6 text-body-regular" style={{ backgroundColor: "var(--red-50)", color: "var(--red-700)" }}>
          <YuIcon name="info-circle" width={16} height={16} className="mt-0.5 shrink-0 text-current" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div>
            <label htmlFor="name" className={labelClass}>Full Name *</label>
            <input required type="text" name="name" id="name" className={inputClass} placeholder="e.g. Jane Doe" />
          </div>
          
          <div>
            <label htmlFor="email" className={labelClass}>Email Address *</label>
            <input required type="email" name="email" id="email" className={inputClass} placeholder="jane@shiftly.local" />
          </div>

          <div>
            <label htmlFor="phone" className={labelClass}>Phone</label>
            <input type="tel" name="phone" id="phone" className={inputClass} placeholder="+1 555-0199" />
          </div>

          <div>
            <label htmlFor="joiningDate" className={labelClass}>Joining Date *</label>
            <input required type="date" name="joiningDate" id="joiningDate" className={inputClass} />
          </div>

          <div>
            <label htmlFor="department" className={labelClass}>Department *</label>
            <input required type="text" name="department" id="department" className={inputClass} placeholder="Engineering" />
          </div>

          <div>
            <label htmlFor="jobTitle" className={labelClass}>Job Title *</label>
            <input required type="text" name="jobTitle" id="jobTitle" className={inputClass} placeholder="Frontend Developer" />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="managerId" className={labelClass}>Manager</label>
            <select name="managerId" id="managerId" className={`${inputClass} appearance-none`}>
              <option value="">-- None --</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-[var(--border-default)] mt-4">
          <button type="button" onClick={() => router.back()} disabled={loading} className="px-5 py-2.5 rounded-[10px] text-body-medium font-semibold text-secondary bg-field hover:bg-field-on-canvas border border-[var(--border-default)] transition-all shadow-sm">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="px-5 py-2.5 rounded-[10px] text-body-medium font-semibold text-on-primary bg-primary hover:opacity-90 active:opacity-100 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-sm">
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4 text-on-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Creating...
              </>
            ) : "Create Employee"}
          </button>
        </div>
      </form>
    </div>
  );
}
