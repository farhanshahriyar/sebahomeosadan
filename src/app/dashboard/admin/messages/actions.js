"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Helper to verify if the user is admin/super_admin
async function checkAdminRole(supabase) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "admin" || profile?.role === "super_admin";
}

export async function toggleMessageReadAction(id, currentReadStatus) {
  const supabase = await createClient();
  const isAdmin = await checkAdminRole(supabase);

  if (!isAdmin) {
    return { error: "Access Denied" };
  }

  try {
    const { error } = await supabase
      .from("contacts")
      .update({ is_read: !currentReadStatus })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/dashboard/admin/messages");
    return { success: true };
  } catch (error) {
    console.error("Error toggling message read status:", error);
    return { error: error.message };
  }
}

export async function deleteMessageAction(id) {
  const supabase = await createClient();
  const isAdmin = await checkAdminRole(supabase);

  if (!isAdmin) {
    return { error: "Access Denied" };
  }

  try {
    const { error } = await supabase
      .from("contacts")
      .delete()
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/dashboard/admin/messages");
    return { success: true };
  } catch (error) {
    console.error("Error deleting message:", error);
    return { error: error.message || "বার্তা মুছতে সমস্যা হয়েছে।" };
  }
}

export async function markAllMessagesReadAction() {
  const supabase = await createClient();
  const isAdmin = await checkAdminRole(supabase);

  if (!isAdmin) {
    return { error: "Access Denied" };
  }

  try {
    const { error } = await supabase
      .from("contacts")
      .update({ is_read: true })
      .eq("is_read", false);

    if (error) throw error;

    revalidatePath("/dashboard/admin/messages");
    return { success: true };
  } catch (error) {
    console.error("Error marking all messages as read:", error);
    return { error: error.message };
  }
}
