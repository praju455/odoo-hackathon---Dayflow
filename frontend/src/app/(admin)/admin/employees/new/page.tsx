import AddEmployeeForm from "@/components/admin/AddEmployeeForm";

export default function AddEmployeePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Area</h1>
        <p className="text-sm text-gray-500 mt-1">Manage employees and settings.</p>
      </div>
      
      <AddEmployeeForm />
    </div>
  );
}
