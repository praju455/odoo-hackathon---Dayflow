"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";

type WageType = "MONTHLY" | "YEARLY";
type ComponentType = "FIXED" | "PERCENT_OF_WAGE" | "PERCENT_OF_BASIC";
interface SalaryComponent { name: string; compType: ComponentType; value: number; }
interface SalaryForm {
  wageType: WageType;
  fixedWage: number;
  pfEmployeePercent: number;
  pfEmployerPercent: number;
  professionalTax: number;
  components: SalaryComponent[];
}
interface SalaryResponse {
  data: {
    structure: SalaryForm & { components: Array<SalaryComponent & { calculatedAmount: number | string }> };
    breakdown: SalaryBreakdown;
  };
}
interface SalaryBreakdown {
  basicAmount: number;
  grossEarnings: number;
  unallocatedWage: number;
  netSalary: number;
  deductions: { pfEmployee: number; pfEmployer: number; professionalTax: number; totalDeductions: number };
}

const EMPTY_SALARY: SalaryForm = {
  wageType: "MONTHLY",
  fixedWage: 0,
  pfEmployeePercent: 12,
  pfEmployerPercent: 12,
  professionalTax: 200,
  components: [
    { name: "Basic", compType: "PERCENT_OF_WAGE", value: 50 },
    { name: "HRA", compType: "PERCENT_OF_BASIC", value: 40 },
  ],
};

function errorMessage(error: unknown) {
  return (error as { response?: { data?: { error?: string } } })?.response?.data?.error
    ?? "Unable to save salary structure.";
}

function amountFor(component: SalaryComponent, wage: number, basicAmount: number) {
  if (component.compType === "FIXED") return component.value;
  if (component.compType === "PERCENT_OF_WAGE") return wage * component.value / 100;
  return basicAmount * component.value / 100;
}

function money(value: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(value || 0);
}

export default function SalaryEditor({ employeeId }: { employeeId: string }) {
  const [form, setForm] = useState<SalaryForm>(EMPTY_SALARY);
  const [savedBreakdown, setSavedBreakdown] = useState<SalaryBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get<SalaryResponse>(`/salary/${employeeId}`);
        const structure = response.data.data.structure;
        setForm({
          wageType: structure.wageType,
          fixedWage: Number(structure.fixedWage),
          pfEmployeePercent: Number(structure.pfEmployeePercent),
          pfEmployerPercent: Number(structure.pfEmployerPercent),
          professionalTax: Number(structure.professionalTax),
          components: structure.components.map((component) => ({
            name: component.name,
            compType: component.compType,
            value: Number(component.value),
          })),
        });
        setSavedBreakdown(response.data.data.breakdown);
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status !== 404) setError(errorMessage(err));
        setForm(EMPTY_SALARY);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [employeeId]);

  const preview = useMemo(() => {
    const basic = form.components.find((component) => component.name.trim().toLowerCase() === "basic");
    const basicAmount = basic
      ? (basic.compType === "PERCENT_OF_BASIC" ? 0 : amountFor(basic, form.fixedWage, 0))
      : 0;
    const calculated = form.components.map((component) => ({
      ...component,
      calculatedAmount: amountFor(component, form.fixedWage, basicAmount),
    }));
    const total = calculated.reduce((sum, component) => sum + component.calculatedAmount, 0);
    return { basic, basicAmount, calculated, total, exceedsWage: total > form.fixedWage };
  }, [form]);

  function updateComponent(index: number, patch: Partial<SalaryComponent>) {
    setForm((current) => ({
      ...current,
      components: current.components.map((component, i) => i === index ? { ...component, ...patch } : component),
    }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    if (!preview.basic) return setError("A component named Basic is required.");
    if (preview.basic.compType === "PERCENT_OF_BASIC") return setError("Basic cannot be a percentage of itself.");
    if (preview.exceedsWage) return setError("Component total cannot exceed the fixed wage.");
    if (new Set(form.components.map((component) => component.name.trim().toLowerCase())).size !== form.components.length) {
      return setError("Component names must be unique.");
    }
    setSaving(true);
    try {
      const response = await api.put<SalaryResponse>(`/salary/${employeeId}`, form);
      setSavedBreakdown(response.data.data.breakdown);
      setSuccess(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-gray-400">Loading salary structure...</p>;

  return (
    <form onSubmit={submit} className="space-y-6">
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">Salary structure saved.</div>}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-gray-700">Wage type
          <select value={form.wageType} onChange={(event) => setForm({ ...form, wageType: event.target.value as WageType })} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2">
            <option value="MONTHLY">Monthly</option><option value="YEARLY">Yearly</option>
          </select>
        </label>
        <label className="text-sm font-medium text-gray-700">Fixed wage (INR)
          <input type="number" min="1" required value={form.fixedWage || ""} onChange={(event) => setForm({ ...form, fixedWage: Number(event.target.value) })} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2" />
        </label>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Earning components</h3>
          <button type="button" onClick={() => setForm({ ...form, components: [...form.components, { name: "", compType: "FIXED", value: 0 }] })} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-[#0a0a0a]">Add component</button>
        </div>
        <div className="space-y-3">
          {preview.calculated.map((component, index) => (
            <div key={index} className="grid gap-3 rounded-lg border border-white/10 p-3 sm:grid-cols-[1.2fr_1.4fr_0.8fr_1fr_auto] sm:items-end">
              <label className="text-xs text-gray-500">Name<input required value={component.name} onChange={(event) => updateComponent(index, { name: event.target.value })} className="mt-1 w-full rounded-md border border-gray-300 px-2 py-2 text-sm" /></label>
              <label className="text-xs text-gray-500">Calculation<select value={component.compType} onChange={(event) => updateComponent(index, { compType: event.target.value as ComponentType })} className="mt-1 w-full rounded-md border border-gray-300 px-2 py-2 text-sm"><option value="FIXED">Fixed</option><option value="PERCENT_OF_WAGE">% of wage</option><option value="PERCENT_OF_BASIC">% of Basic</option></select></label>
              <label className="text-xs text-gray-500">Value<input type="number" min="0" step="0.01" required value={component.value} onChange={(event) => updateComponent(index, { value: Number(event.target.value) })} className="mt-1 w-full rounded-md border border-gray-300 px-2 py-2 text-sm" /></label>
              <div><p className="text-xs text-gray-500">Amount</p><p className="py-2 text-sm font-semibold text-white">INR {money(component.calculatedAmount)}</p></div>
              <button type="button" title="Remove component" aria-label="Remove component" disabled={form.components.length === 1} onClick={() => setForm({ ...form, components: form.components.filter((_, i) => i !== index) })} className="h-9 w-9 rounded-md border border-gray-300 text-lg text-gray-500 disabled:opacity-30">×</button>
            </div>
          ))}
        </div>
        <div className={`mt-3 flex justify-between rounded-lg px-4 py-3 text-sm font-semibold ${preview.exceedsWage ? "bg-red-50 text-red-700" : "bg-[#0a0a0a] text-white"}`}><span>Component total</span><span>INR {money(preview.total)} / {money(form.fixedWage)}</span></div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="text-sm font-medium text-gray-700">Employee PF %<input type="number" min="0" max="100" value={form.pfEmployeePercent} onChange={(event) => setForm({ ...form, pfEmployeePercent: Number(event.target.value) })} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2" /></label>
        <label className="text-sm font-medium text-gray-700">Employer PF %<input type="number" min="0" max="100" value={form.pfEmployerPercent} onChange={(event) => setForm({ ...form, pfEmployerPercent: Number(event.target.value) })} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2" /></label>
        <label className="text-sm font-medium text-gray-700">Professional tax<input type="number" min="0" value={form.professionalTax} onChange={(event) => setForm({ ...form, professionalTax: Number(event.target.value) })} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2" /></label>
      </div>

      {savedBreakdown && <div className="grid grid-cols-2 gap-3 rounded-lg bg-[#0a0a0a] p-4 text-sm sm:grid-cols-4"><div><p className="text-gray-500">Basic</p><p className="font-semibold">INR {money(Number(savedBreakdown.basicAmount))}</p></div><div><p className="text-gray-500">Gross</p><p className="font-semibold">INR {money(Number(savedBreakdown.grossEarnings))}</p></div><div><p className="text-gray-500">Deductions</p><p className="font-semibold">INR {money(Number(savedBreakdown.deductions.totalDeductions))}</p></div><div><p className="text-gray-500">Net</p><p className="font-semibold">INR {money(Number(savedBreakdown.netSalary))}</p></div></div>}

      <div className="flex justify-end border-t border-gray-100 pt-4"><button type="submit" disabled={saving || preview.exceedsWage} className="btn-primary disabled:opacity-50">{saving ? "Saving..." : "Save salary structure"}</button></div>
    </form>
  );
}
