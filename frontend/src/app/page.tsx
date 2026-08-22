import { redirect } from "next/navigation";

<<<<<<< HEAD
export default function Home() {
  // The root path automatically redirects to login.
  // The auth context and _middleware will handle forwarding 
  // logged-in users to /employees or their dashboard.
  redirect("/login");
=======
// The root "/" redirects to the Employees directory, which is the landing
// page for everyone (both Admin and Employee roles).
export default function RootPage() {
  redirect("/employees");
>>>>>>> 36018d7dffbeb7822d439059207690d3548a9668
}
