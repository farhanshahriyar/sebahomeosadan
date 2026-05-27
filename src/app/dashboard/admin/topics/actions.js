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

// Save or Update a Topic
export async function saveTopicAction(formData) {
  const supabase = await createClient();
  const isAdmin = await checkAdminRole(supabase);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "দয়া করে প্রথমে লগইন করুন।" };
  }

  if (!isAdmin) {
    return { error: "এই কাজটি করার অনুমতি আপনার নেই (Access Denied)।" };
  }

  const id = formData.get("id");
  const name = formData.get("name")?.trim();
  const slug = formData.get("slug")?.trim();
  const description = formData.get("description")?.trim();
  const sortOrder = parseInt(formData.get("sort_order") || "0", 10);
  const parentId = formData.get("parent_id");
  const isActive = formData.get("is_active") === "true";

  if (!name || !slug) {
    return { error: "নাম এবং স্লাগ অবশ্যই পূরণ করতে হবে।" };
  }

  if (!parentId) {
    return { error: "টপিকের জন্য একটি অভিভাবক বিষয় (Subject) নির্বাচন করা আবশ্যক।" };
  }

  const topicData = {
    name,
    slug,
    description: description || null,
    sort_order: sortOrder,
    is_active: isActive,
    created_by: user.id,
    parent_id: parentId
  };

  try {
    let result;
    if (id) {
      // Update
      result = await supabase
        .from("categories")
        .update(topicData)
        .eq("id", id)
        .select()
        .single();
    } else {
      // Insert
      result = await supabase
        .from("categories")
        .insert(topicData)
        .select()
        .single();
    }

    if (result.error) {
      if (result.error.code === "23505") {
        return { error: "এই নামের অথবা স্লাগের একটি টপিক ইতিমধ্যে বিদ্যমান রয়েছে।" };
      }
      throw result.error;
    }

    revalidatePath("/dashboard/admin/topics");
    revalidatePath("/dashboard/admin/categories");
    revalidatePath("/articles");
    revalidatePath("/");
    return { success: true, data: result.data };
  } catch (error) {
    console.error("Error saving topic:", error);
    return { error: error.message || "টপিক সংরক্ষণে সমস্যা হয়েছে।" };
  }
}

// Approve a suggested Topic (set is_active to true)
export async function approveTopicAction(id) {
  const supabase = await createClient();
  const isAdmin = await checkAdminRole(supabase);

  if (!isAdmin) {
    return { error: "Access Denied" };
  }

  try {
    const { error } = await supabase
      .from("categories")
      .update({ is_active: true })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/dashboard/admin/topics");
    revalidatePath("/dashboard/admin/categories");
    revalidatePath("/articles");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error approving topic:", error);
    return { error: error.message || "টপিক অনুমোদন করতে সমস্যা হয়েছে।" };
  }
}

// Delete a Topic
export async function deleteTopicAction(id) {
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
        return { error: "এই টপিকের অধীনে আর্টিকেল রয়েছে, তাই এটি মুছে ফেলা সম্ভব নয়। প্রথমে আর্টিকেলগুলোর টপিক পরিবর্তন করুন।" };
      }
      throw error;
    }

    revalidatePath("/dashboard/admin/topics");
    revalidatePath("/dashboard/admin/categories");
    revalidatePath("/articles");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting topic:", error);
    return { error: error.message || "টপিক মুছতে সমস্যা হয়েছে।" };
  }
}
