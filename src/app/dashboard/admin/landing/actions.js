"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Verify if user is super_admin
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

export async function saveLandingSettingsAction(formData) {
  const supabase = await createClient();
  const isSuperAdmin = await checkSuperAdminRole(supabase);

  if (!isSuperAdmin) {
    return { error: "এই অ্যাকশনটি সম্পন্ন করার ক্ষমতা আপনার নেই (Access Denied)।" };
  }

  const heroTitle = formData.get("hero_title")?.trim();
  const heroSubtitle = formData.get("hero_subtitle")?.trim();
  const heroQuote = formData.get("hero_quote")?.trim();
  const heroQuoteAuthor = formData.get("hero_quote_author")?.trim();
  const heroPhone = formData.get("hero_phone")?.trim();
  const heroImage = formData.get("hero_image")?.trim();
  const bannerImage = formData.get("banner_image")?.trim();
  const marqueeText = formData.get("marquee_text")?.trim();
  const featuredArticlesJson = formData.get("featured_articles");

  let featuredArticles = [];
  try {
    featuredArticles = featuredArticlesJson ? JSON.parse(featuredArticlesJson) : [];
  } catch (err) {
    console.error("Error parsing featured_articles:", err);
  }

  if (!heroTitle || !heroSubtitle) {
    return { error: "হিরো সেকশনের শিরোনাম এবং উপশিরোনাম অবশ্যই পূরণ করতে হবে।" };
  }

  const settingsData = {
    hero_title: heroTitle,
    hero_subtitle: heroSubtitle,
    hero_quote: heroQuote || "",
    hero_quote_author: heroQuoteAuthor || "",
    hero_phone: heroPhone || "",
    hero_image: heroImage || "/img/img2.png",
    banner_image: bannerImage || "/img/banner.png",
    marquee_text: marqueeText || "",
    featured_articles: featuredArticles,
    updated_at: new Date().toISOString()
  };

  try {
    const { error } = await supabase
      .from("landing_settings")
      .update(settingsData)
      .eq("id", 1);

    if (error) {
      throw error;
    }

    revalidatePath("/");
    revalidatePath("/dashboard/admin/landing");
    return { success: true };
  } catch (error) {
    console.error("Error saving landing settings:", error);
    return { error: error.message || "ল্যান্ডিং পেজ সেটিংস সংরক্ষণে সমস্যা হয়েছে।" };
  }
}
