"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export async function createUserAction(formData) {
  const email = formData.get("email");
  const password = formData.get("password");
  const fullName = formData.get("full_name");
  const role = formData.get("role");

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    return { error: "Missing SUPABASE_SERVICE_ROLE_KEY in .env file. You need to add this key from your Supabase Project Settings > API to allow creating users from the admin panel." };
  }

  // Use the service role key to bypass RLS and create the user without logging out the current admin
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm so they don't need to click a link
      user_metadata: {
        full_name: fullName,
        role: role,
      },
    });

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch (err) {
    return { error: "An unexpected error occurred while creating the user." };
  }
}

export async function updateUserRoleAction(userId, newRole) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return { error: "Missing SUPABASE_SERVICE_ROLE_KEY" };
  }

  // Verify the calling user's role using cookie-based auth
  const { createClient: createAuthClient } = await import("@/lib/supabase/server");
  const supabaseAuth = await createAuthClient();
  const { data: { user: callingUser } } = await supabaseAuth.auth.getUser();

  if (!callingUser) {
    return { error: "আপনি লগইন করেননি।" };
  }

  const { data: callerProfile } = await supabaseAuth
    .from("profiles")
    .select("role")
    .eq("id", callingUser.id)
    .single();

  const callerRole = callerProfile?.role;

  // Only super_admin can assign admin or super_admin roles
  if ((newRole === "admin" || newRole === "super_admin") && callerRole !== "super_admin") {
    return { error: "শুধুমাত্র Super Admin এই রোল পরিবর্তন করতে পারেন। (Only Super Admin can assign Admin or Super Admin roles.)" };
  }

  // Only super_admin can change another admin's or super_admin's role
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleKey,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );

  // Fetch the target user's current role
  const { data: targetProfile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (targetProfile && (targetProfile.role === "admin" || targetProfile.role === "super_admin") && callerRole !== "super_admin") {
    return { error: "শুধুমাত্র Super Admin অন্য Admin বা Super Admin এর রোল পরিবর্তন করতে পারেন।" };
  }

  // 1. Update the role in auth.users metadata
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    { user_metadata: { role: newRole } }
  );

  if (authError) return { error: authError.message };

  // 2. Update the role in profiles table
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);

  if (profileError) return { error: profileError.message };

  revalidatePath("/dashboard/admin");
  return { success: true };
}
