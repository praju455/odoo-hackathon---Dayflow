import { redirect } from "next/navigation";

export default function Home() {
  // The root path automatically redirects to login.
  // The auth context and _middleware will handle forwarding 
  // logged-in users to /employees or their dashboard.
  redirect("/login");
}
