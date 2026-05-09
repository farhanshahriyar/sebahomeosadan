import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { fetchSystemStatus } from "./actions";
import StatusDashboard from "@/components/dashboard/StatusDashboard";

export const metadata = {
  title: "System Status | Dashboard",
};

export default async function StatusPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Ensure user is an admin or super_admin to view this page
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "super_admin") {
    redirect("/dashboard");
  }

  // Fetch real system data
  const statusData = await fetchSystemStatus();

  return (
    <>
      <div className="dashboard-header">
        <div>
          <h1>System Status & Analytics</h1>
          <div className="breadcrumb">
            <a href="/dashboard">Dashboard</a> / Status
          </div>
        </div>
      </div>

      <StatusDashboard initialData={statusData} />
    </>
  );
}
