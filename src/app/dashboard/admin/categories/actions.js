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

export async function saveCategoryAction(formData) {
  const supabase = await createClient();
  const isAdmin = await checkAdminRole(supabase);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "দয়া করে প্রথমে লগইন করুন।" };
  }

  const id = formData.get("id");
  const name = formData.get("name")?.trim();
  const slug = formData.get("slug")?.trim();
  const description = formData.get("description")?.trim();
  const sortOrder = parseInt(formData.get("sort_order") || "0", 10);
  const parentId = formData.get("parent_id") || null;
  // If not admin, is_active is ALWAYS false (suggestions require admin approval)
  const isActive = isAdmin ? (formData.get("is_active") === "true") : false;

  if (!isAdmin && id) {
    return { error: "ক্যাটাগরি সম্পাদনা করার অনুমতি আপনার নেই (Access Denied)।" };
  }

  if (!name || !slug) {
    return { error: "নাম এবং স্লাগ অবশ্যই পূরণ করতে হবে।" };
  }

  const categoryData = {
    name,
    slug,
    description: description || null,
    sort_order: sortOrder,
    is_active: isActive,
    created_by: user.id,
    parent_id: parentId || null
  };

  try {
    let result;
    if (id) {
      // Update
      result = await supabase
        .from("categories")
        .update(categoryData)
        .eq("id", id)
        .select()
        .single();
    } else {
      // Insert
      result = await supabase
        .from("categories")
        .insert(categoryData)
        .select()
        .single();
    }

    if (result.error) {
      if (result.error.code === "23505") {
        return { error: "এই নামের অথবা স্লাগের একটি ক্যাটাগরি ইতিমধ্যে বিদ্যমান রয়েছে।" };
      }
      throw result.error;
    }

    revalidatePath("/dashboard/admin/categories");
    revalidatePath("/articles");
    revalidatePath("/");
    return { success: true, data: result.data };
  } catch (error) {
    console.error("Error saving category:", error);
    return { error: error.message || "ক্যাটাগরি সংরক্ষণে সমস্যা হয়েছে।" };
  }
}

export async function toggleCategoryAction(id, currentActiveStatus) {
  const supabase = await createClient();
  const isAdmin = await checkAdminRole(supabase);

  if (!isAdmin) {
    return { error: "Access Denied" };
  }

  try {
    const { error } = await supabase
      .from("categories")
      .update({ is_active: !currentActiveStatus })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/dashboard/admin/categories");
    revalidatePath("/articles");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error toggling category status:", error);
    return { error: error.message };
  }
}

export async function deleteCategoryAction(id) {
  const supabase = await createClient();
  const isAdmin = await checkAdminRole(supabase);

  if (!isAdmin) {
    return { error: "Access Denied" };
  }

  try {
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id);

    if (error) {
      if (error.code === "23503") {
        return { error: "এই ক্যাটাগরির অধীনে আর্টিকেল রয়েছে, তাই এটি মুছে ফেলা সম্ভব নয়। প্রথমে আর্টিকেলগুলোর ক্যাটাগরি পরিবর্তন করুন।" };
      }
      throw error;
    }

    revalidatePath("/dashboard/admin/categories");
    revalidatePath("/articles");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting category:", error);
    return { error: error.message || "ক্যাটাগরি মুছতে সমস্যা হয়েছে।" };
  }
}
