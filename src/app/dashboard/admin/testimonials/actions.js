"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Helper to verify if the user is super_admin
async function checkSuperAdminRole(supabase) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "super_admin";
}

export async function saveTestimonialAction(formData) {
  const supabase = await createClient();
  const isSuperAdmin = await checkSuperAdminRole(supabase);

  if (!isSuperAdmin) {
    return { error: "এই অ্যাকশনটি সম্পন্ন করার ক্ষমতা আপনার নেই (Access Denied)।" };
  }

  const id = formData.get("id");
  const name = formData.get("name")?.trim();
  const title = formData.get("title")?.trim();
  const text = formData.get("text")?.trim();
  const img = formData.get("img")?.trim();

  if (!name || !title || !text) {
    return { error: "নাম, উপাধি এবং বক্তব্য অবশ্যই পূরণ করতে হবে।" };
  }

  const testimonialData = {
    name,
    title,
    text,
    img: img || null,
    updated_at: new Date().toISOString()
  };

  try {
    let result;
    if (id) {
      // Update
      result = await supabase
        .from("testimonials")
        .update(testimonialData)
        .eq("id", id)
        .select()
        .single();
    } else {
      // Get max display_order to append at the end
      const { data: maxOrderData } = await supabase
        .from("testimonials")
        .select("display_order")
        .order("display_order", { ascending: false })
        .limit(1);

      const maxOrder = maxOrderData?.[0]?.display_order || 0;
      testimonialData.display_order = maxOrder + 1;
      testimonialData.created_at = new Date().toISOString();

      // Insert
      result = await supabase
        .from("testimonials")
        .insert(testimonialData)
        .select()
        .single();
    }

    if (result.error) throw result.error;

    revalidatePath("/dashboard/admin/testimonials");
    revalidatePath("/");
    return { success: true, data: result.data };
  } catch (error) {
    console.error("Error saving testimonial:", error);
    return { error: error.message || "টেস্টিমোনিয়াল সংরক্ষণে সমস্যা হয়েছে।" };
  }
}

export async function deleteTestimonialAction(id) {
  const supabase = await createClient();
  const isSuperAdmin = await checkSuperAdminRole(supabase);

  if (!isSuperAdmin) {
    return { error: "Access Denied" };
  }

  try {
    const { error } = await supabase
      .from("testimonials")
      .delete()
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/dashboard/admin/testimonials");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting testimonial:", error);
    return { error: error.message || "টেস্টিমোনিয়াল মুছতে সমস্যা হয়েছে।" };
  }
}

export async function updateTestimonialOrderAction(orderedIds) {
  const supabase = await createClient();
  const isSuperAdmin = await checkSuperAdminRole(supabase);

  if (!isSuperAdmin) {
    return { error: "Access Denied" };
  }

  try {
    // Perform updates for each testimonial
    for (let i = 0; i < orderedIds.length; i++) {
      const { error } = await supabase
        .from("testimonials")
        .update({ display_order: i + 1 })
        .eq("id", orderedIds[i]);

      if (error) throw error;
    }

    revalidatePath("/dashboard/admin/testimonials");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error updating testimonials order:", error);
    return { error: error.message || "অর্ডার আপডেট করতে সমস্যা হয়েছে।" };
  }
}
