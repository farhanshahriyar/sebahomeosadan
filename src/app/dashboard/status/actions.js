"use server";

import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) return null;

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function fetchSystemStatus() {
  // Verify the calling user is super_admin
  const { createClient: createAuthClient } = await import("@/lib/supabase/server");
  const supabaseAuth = await createAuthClient();
  const { data: { user: callingUser } } = await supabaseAuth.auth.getUser();

  if (!callingUser) {
    return { error: "Access Denied: You must be logged in." };
  }

  const { data: callerProfile } = await supabaseAuth
    .from("profiles")
    .select("role")
    .eq("id", callingUser.id)
    .single();

  if (callerProfile?.role !== "super_admin") {
    return { error: "Access Denied: Only Super Admins can fetch system status." };
  }

  const supabase = getAdminClient();
  if (!supabase) {
    return { error: "Missing SUPABASE_SERVICE_ROLE_KEY" };
  }

  const now = new Date();
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  // 1. Database health check — simple query
  let dbStatus = "Healthy";
  let dbLatency = 0;
  const dbStart = Date.now();
  try {
    const { error } = await supabase.from("profiles").select("id").limit(1);
    dbLatency = Date.now() - dbStart;
    if (error) dbStatus = "Error";
  } catch {
    dbLatency = Date.now() - dbStart;
    dbStatus = "Unreachable";
  }

  // 2. Auth health check
  let authStatus = "Healthy";
  const authStart = Date.now();
  let authLatency = 0;
  try {
    const { error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    authLatency = Date.now() - authStart;
    if (error) authStatus = "Error";
  } catch {
    authLatency = Date.now() - authStart;
    authStatus = "Unreachable";
  }

  // 3. Total users count
  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  // 4. Users by role
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("role, created_at, full_name, id");

  const roleCounts = {
    super_admin: 0,
    admin: 0,
    author: 0,
  };
  const recentSignups = [];

  allProfiles?.forEach((p) => {
    if (roleCounts[p.role] !== undefined) roleCounts[p.role]++;
    if (new Date(p.created_at) >= sevenDaysAgo) {
      recentSignups.push(p);
    }
  });

  // 5. Fetch recent auth users for activity log (last 10 users with last_sign_in)
  let recentActivity = [];
  try {
    const { data: authData } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 20,
    });
    if (authData?.users) {
      recentActivity = authData.users
        .filter((u) => u.last_sign_in_at)
        .sort((a, b) => new Date(b.last_sign_in_at) - new Date(a.last_sign_in_at))
        .slice(0, 10)
        .map((u) => ({
          id: u.id,
          email: u.email,
          lastSignIn: u.last_sign_in_at,
          createdAt: u.created_at,
          fullName: u.user_metadata?.full_name || u.email?.split("@")[0],
          role: u.user_metadata?.role || "author",
          provider: u.app_metadata?.provider || "email",
        }));
    }
  } catch {
    // Auth listing failed — non-critical
  }

  return {
    database: {
      status: dbStatus,
      latency: dbLatency,
    },
    auth: {
      status: authStatus,
      latency: authLatency,
    },
    users: {
      total: totalUsers || 0,
      roleCounts,
      recentSignups: recentSignups.length,
    },
    activity: recentActivity,
    timestamp: now.toISOString(),
  };
}
