"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export async function createUserAction(formData) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    return { error: "Missing SUPABASE_SERVICE_ROLE_KEY in .env file. You need to add this key from your Supabase Project Settings > API to allow creating users from the admin panel." };
  }

  // Verify the calling user's role using cookie-based auth
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
    return { error: "Access Denied: Only Super Admins can create new users." };
  }

  const email = formData.get("email");
  const password = formData.get("password");
  const fullName = formData.get("full_name");
  const role = formData.get("role");

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

export async function updateUserNameAction(userId, newName) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return { error: "Missing SUPABASE_SERVICE_ROLE_KEY" };
  }

  // Verify the calling user is a super_admin
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

  if (callerProfile?.role !== "super_admin") {
    return { error: "শুধুমাত্র Super Admin ব্যবহারকারীর নাম পরিবর্তন করতে পারেন।" };
  }

  if (!newName || !newName.trim()) {
    return { error: "নাম খালি রাখা যাবে না।" };
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleKey,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );

  // 1. Update name in auth.users metadata
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    { user_metadata: { full_name: newName.trim() } }
  );

  if (authError) return { error: authError.message };

  // 2. Update name in profiles table
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({ full_name: newName.trim() })
    .eq("id", userId);

  if (profileError) return { error: profileError.message };

  revalidatePath("/dashboard/admin");
  return { success: true };
}

export async function deleteUserAction(userId) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return { error: "Missing SUPABASE_SERVICE_ROLE_KEY" };
  }

  // Verify the calling user is a super_admin
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

  if (callerProfile?.role !== "super_admin") {
    return { error: "শুধুমাত্র Super Admin ব্যবহারকারী মুছতে পারেন।" };
  }

  // Prevent super_admin from deleting themselves
  if (userId === callingUser.id) {
    return { error: "আপনি নিজের অ্যাকাউন্ট মুছতে পারবেন না।" };
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleKey,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );

  // Check the target user's role — prevent deleting other super_admins
  const { data: targetProfile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (targetProfile?.role === "super_admin") {
    return { error: "অন্য Super Admin কে মুছতে পারবেন না।" };
  }

  // Delete user from Supabase Auth (this cascades to profiles via trigger/FK)
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (deleteError) return { error: deleteError.message };

  // Also explicitly delete from profiles table in case cascade isn't set up
  await supabaseAdmin
    .from("profiles")
    .delete()
    .eq("id", userId);

  revalidatePath("/dashboard/admin");
  return { success: true };
}

export async function toggleBanUserAction(userId, shouldBan) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return { error: "Missing SUPABASE_SERVICE_ROLE_KEY" };
  }

  // Verify the calling user is a super_admin
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

  if (callerProfile?.role !== "super_admin") {
    return { error: "শুধুমাত্র Super Admin ব্যবহারকারী ব্যান/আনব্যান করতে পারেন।" };
  }

  // Prevent banning yourself
  if (userId === callingUser.id) {
    return { error: "আপনি নিজেকে ব্যান করতে পারবেন না।" };
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleKey,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );

  // Check the target user's role — prevent banning other super_admins
  const { data: targetProfile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (targetProfile?.role === "super_admin") {
    return { error: "অন্য Super Admin কে ব্যান করা যাবে না।" };
  }

  try {
    if (shouldBan) {
      // Ban the user via Supabase Auth (permanent ban)
      const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { ban_duration: "876000h" } // ~100 years = permanent
      );
      if (banError) return { error: banError.message };
    } else {
      // Unban the user
      const { error: unbanError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { ban_duration: "none" }
      );
      if (unbanError) return { error: unbanError.message };
    }

    // Also update is_banned in profiles table for easy UI display
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ is_banned: shouldBan })
      .eq("id", userId);

    if (profileError) {
      // If profiles table doesn't have is_banned column yet, that's OK
      console.warn("[toggleBanUserAction] profiles update warning:", profileError.message);
    }

    revalidatePath("/dashboard/admin");
    return { success: true, banned: shouldBan };
  } catch (err) {
    return { error: "ব্যান/আনব্যান করতে সমস্যা হয়েছে: " + (err.message || "অজানা ত্রুটি") };
  }
}

export async function updateOwnProfileAction(newName) {
  // Verify user is logged in
  const { createClient: createAuthClient } = await import("@/lib/supabase/server");
  const supabaseAuth = await createAuthClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();

  if (!user) {
    return { error: "Access Denied: You must be logged in." };
  }

  if (!newName || !newName.trim()) {
    return { error: "নাম খালি রাখা যাবে না।" };
  }

  // 1. Update name in profiles table
  const { error: profileError } = await supabaseAuth
    .from("profiles")
    .update({ full_name: newName.trim() })
    .eq("id", user.id);

  if (profileError) {
    return { error: profileError.message };
  }

  // 2. Update name in auth.users metadata
  const { error: authError } = await supabaseAuth.auth.updateUser({
    data: { full_name: newName.trim() }
  });

  if (authError) {
    return { error: authError.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function changeOwnPasswordAction(newPassword) {
  // Verify user is logged in
  const { createClient: createAuthClient } = await import("@/lib/supabase/server");
  const supabaseAuth = await createAuthClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();

  if (!user) {
    return { error: "Access Denied: You must be logged in." };
  }

  if (!newPassword || newPassword.length < 6) {
    return { error: "পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।" };
  }

  const { error: authError } = await supabaseAuth.auth.updateUser({
    password: newPassword
  });

  if (authError) {
    return { error: authError.message };
  }

  return { success: true };
}

