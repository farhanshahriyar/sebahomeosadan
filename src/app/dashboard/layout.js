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
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, role, avatar_url, is_banned")
    .eq("id", user.id)
    .single();

  // Debug: log to server console
  console.log("[Dashboard] user.id:", user.id);
  console.log("[Dashboard] profile:", profile);
  console.log("[Dashboard] profileError:", profileError);

  // If user is banned, redirect to login
  if (profile?.is_banned) {
    redirect("/login?error=banned");
  }

  const userInfo = {
    name: profile?.full_name || user.email?.split("@")[0] || "User",
    email: user.email,
    role: profile?.role || "author",
    avatar: profile?.avatar_url || null,
  };

  console.log("[Dashboard] resolved userInfo:", userInfo);

  return <DashboardShell userInfo={userInfo}>{children}</DashboardShell>;
}
