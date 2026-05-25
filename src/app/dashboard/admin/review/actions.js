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

export async function approveArticleAction(id) {
  const supabase = await createClient();
  const isAdmin = await checkAdminRole(supabase);

  if (!isAdmin) {
    return { error: "உங்களுக்கு இந்த செயல் செய்ய অনুমতি இல்லை (Access Denied)" };
  }

  try {
    // Fetch slug to revalidate specifically
    const { data: article } = await supabase
      .from("articles")
      .select("slug")
      .eq("id", id)
      .single();

    const { error } = await supabase
      .from("articles")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/dashboard/admin/review");
    revalidatePath("/dashboard");
    revalidatePath("/articles");
    if (article?.slug) {
      revalidatePath(`/articles/${article.slug}`);
    }
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Error approving article:", error);
    return { error: error.message || "আর্টিকেলটি প্রকাশ করতে সমস্যা হয়েছে।" };
  }
}

export async function rejectArticleAction(id) {
  const supabase = await createClient();
  const isAdmin = await checkAdminRole(supabase);

  if (!isAdmin) {
    return { error: "Access Denied" };
  }

  try {
    const { error } = await supabase
      .from("articles")
      .update({
        status: "draft",
      })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/dashboard/admin/review");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/author");
    revalidatePath("/articles");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Error rejecting article:", error);
    return { error: error.message || "আর্টিকেলটি ড্রাফটে ফেরত পাঠাতে সমস্যা হয়েছে।" };
  }
}
