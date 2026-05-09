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

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleKey,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );

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
