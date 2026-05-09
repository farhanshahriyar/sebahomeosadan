import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import "./dashboard.css";

export default async function DashboardLayout({ children }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Double-check: if somehow middleware didn't catch it
  if (!user) {
    redirect("/login");
  }

  // Fetch user profile/role from a profiles table (fallback to email metadata)
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, avatar_url")
    .eq("id", user.id)
    .single();

  const userInfo = {
    name: profile?.full_name || user.email?.split("@")[0] || "User",
    email: user.email,
    role: profile?.role || "author",
    avatar: profile?.avatar_url || null,
  };

  return <DashboardShell userInfo={userInfo}>{children}</DashboardShell>;
}
