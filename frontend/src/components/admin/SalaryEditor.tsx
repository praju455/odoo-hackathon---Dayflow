"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

type SalaryInfo = {
  baseSalary: number;
  currency: string;
  bonus: number;
  effectiveDate: string;
};

export default function SalaryEditor({ employeeId }: { employeeId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [salary, setSalary] = useState<SalaryInfo>({
    baseSalary: 0,
    currency: "USD",
    bonus: 0,
    effectiveDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    async function fetchSalary() {
      setLoading(true);
      try {
        // TODO: replace with real API `GET /api/employees/${employeeId}/salary`
        let data: SalaryInfo | null = null;
        try {
          const res = await api.get<{ salary: SalaryInfo }>(`/employees/${employeeId}/salary`);
          data = res.data.salary;
        } catch (err) {
          // Fallback to mock data if endpoint is missing
          data = {
            baseSalary: 75000,
            currency: "USD",
            bonus: 5000,
            effectiveDate: "2026-01-01",
          };
        }
        
        if (data) {
          setSalary(data);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load salary info");
      } finally {
        setLoading(false);
      }
    }
    
    fetchSalary();
  }, [employeeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    if (salary.baseSalary <= 0) {
      setError("Base salary must be greater than 0.");
      setSaving(false);
      return;
    }
    
    if (salary.bonus < 0) {
      setError("Bonus cannot be negative.");
      setSaving(false);
      return;
    }

    try {
      // TODO: replace with real API `PATCH /api/employees/${employeeId}/salary`
      // await api.patch(`/employees/${employeeId}/salary`, salary);
      
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 600));
      setSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save salary info");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse flex space-x-4"><div className="h-4 bg-gray-200 rounded w-1/4"></div></div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      {error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="rounded-md bg-green-50 p-4 border border-green-200">
          <p className="text-sm text-green-700 font-medium">Salary information updated successfully.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
        <div className="sm:col-span-1">
          <label htmlFor="baseSalary" className="block text-sm font-medium text-gray-700">
            Base Salary
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              name="baseSalary"
              id="baseSalary"
              min="1"
              required
              className="block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 py-2 border outline-none"
              placeholder="0.00"
              value={salary.baseSalary || ""}
              onChange={(e) => setSalary({ ...salary, baseSalary: Number(e.target.value) })}
            />
            <div className="absolute inset-y-0 right-0 flex items-center">
              <label htmlFor="currency" className="sr-only">Currency</label>
              <select
                id="currency"
                name="currency"
                className="h-full py-0 pl-2 pr-7 border-transparent bg-transparent text-gray-500 sm:text-sm rounded-md focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                value={salary.currency}
                onChange={(e) => setSalary({ ...salary, currency: e.target.value })}
              >
                <option>USD</option>
                <option>EUR</option>
                <option>GBP</option>
                <option>INR</option>
              </select>
            </div>
          </div>
        </div>

        <div className="sm:col-span-1">
          <label htmlFor="bonus" className="block text-sm font-medium text-gray-700">
            Annual Bonus Target
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              name="bonus"
              id="bonus"
              min="0"
              className="block w-full pl-7 pr-3 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 py-2 border outline-none"
              placeholder="0.00"
              value={salary.bonus === 0 ? "" : salary.bonus}
              onChange={(e) => setSalary({ ...salary, bonus: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="effectiveDate" className="block text-sm font-medium text-gray-700">
            Effective Date
          </label>
          <div className="mt-1">
            <input
              type="date"
              name="effectiveDate"
              id="effectiveDate"
              required
              className="block w-full sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 py-2 px-3 border outline-none"
              value={salary.effectiveDate}
              onChange={(e) => setSalary({ ...salary, effectiveDate: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="pt-4 flex justify-end border-t border-gray-100">
        <button
          type="submit"
          disabled={saving}
          className="btn-primary"
        >
          {saving ? "Saving..." : "Save Salary Info"}
        </button>
      </div>
    </form>
  );
}
