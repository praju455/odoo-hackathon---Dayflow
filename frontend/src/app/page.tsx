import { redirect } from "next/navigation";

// The root "/" redirects to the Employees directory, which is the landing
// page for everyone (both Admin and Employee roles).
export default function RootPage() {
  redirect("/employees");
}
