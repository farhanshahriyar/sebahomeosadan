"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Helper to verify if the user is authenticated (author, admin, or super_admin)
async function checkAuthenticatedRole(supabase) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "author" || profile?.role === "admin" || profile?.role === "super_admin";
}

// Generate slug from medicine name
function generateSlug(name) {
  // Extract English name from brackets if present, e.g. "একোনাইটাম নেপেলাস [Aconitum Napellus]" → "aconitum-napellus"
  const bracketMatch = name.match(/\[([^\]]+)\]/);
  const base = bracketMatch ? bracketMatch[1] : name;

  return base
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function saveMedicineAction(formData) {
  const supabase = await createClient();
  const isAuthorized = await checkAuthenticatedRole(supabase);

  if (!isAuthorized) {
    return { error: "এই অ্যাকশনটি সম্পন্ন করার ক্ষমতা আপনার নেই (Access Denied)।" };
  }

  const id = formData.get("id");
  const name = formData.get("name")?.trim();
  const customSlug = formData.get("slug")?.trim();
  const contentAllen = formData.get("content_allen")?.trim() || null;
  const contentRoerick = formData.get("content_roerick")?.trim() || null;
  const contentKent = formData.get("content_kent")?.trim() || null;
  const contentNash = formData.get("content_nash")?.trim() || null;
  const contentNote = formData.get("content_note")?.trim() || null;

  if (!name) {
    return { error: "ওষুধের নাম অবশ্যই পূরণ করতে হবে।" };
  }

  const slug = customSlug || generateSlug(name);

  if (!slug) {
    return { error: "স্ল্যাগ তৈরি করা যায়নি। অনুগ্রহ করে ম্যানুয়ালি একটি স্ল্যাগ দিন।" };
  }

  const medicineData = {
    name,
    slug,
    content_allen: contentAllen,
    content_roerick: contentRoerick,
    content_kent: contentKent,
    content_nash: contentNash,
    content_note: contentNote,
    updated_at: new Date().toISOString()
  };

  try {
    let result;
    if (id) {
      // Update
      result = await supabase
        .from("medicines")
        .update(medicineData)
        .eq("id", id)
        .select()
        .single();
    } else {
      // Get current user for created_by
      const { data: { user } } = await supabase.auth.getUser();
      medicineData.created_by = user?.id || null;
      medicineData.created_at = new Date().toISOString();

      // Insert
      result = await supabase
        .from("medicines")
        .insert(medicineData)
        .select()
        .single();
    }

    if (result.error) throw result.error;

    revalidatePath("/dashboard/medicines");
    revalidatePath("/medicines");
    revalidatePath("/dashboard");
    return { success: true, data: result.data };
  } catch (error) {
    console.error("Error saving medicine:", error);
    if (error.code === "23505") {
      return { error: "এই স্ল্যাগ (slug) ইতিমধ্যে ব্যবহৃত হচ্ছে। অনুগ্রহ করে একটি ভিন্ন স্ল্যাগ ব্যবহার করুন।" };
    }
    return { error: error.message || "ওষুধ সংরক্ষণে সমস্যা হয়েছে।" };
  }
}

export async function deleteMedicineAction(id) {
  const supabase = await createClient();
  const isAuthorized = await checkAuthenticatedRole(supabase);

  if (!isAuthorized) {
    return { error: "Access Denied" };
  }

  try {
    const { error } = await supabase
      .from("medicines")
      .delete()
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/dashboard/medicines");
    revalidatePath("/medicines");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error deleting medicine:", error);
    return { error: error.message || "ওষুধ মুছতে সমস্যা হয়েছে।" };
  }
}
