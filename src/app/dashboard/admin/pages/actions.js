"use server";

import { revalidatePath } from "next/cache";

export async function revalidatePagePath(slug) {
  try {
    if (slug === "about-us") {
      revalidatePath("/about");
    } else if (slug === "services") {
      revalidatePath("/services");
    } else if (slug === "privacy-policy") {
      revalidatePath("/privacy");
    }
    
    // Revalidate dashboard and main index paths as well to update any navigation caching
    revalidatePath("/");
    revalidatePath("/dashboard/admin/pages");
    
    return { success: true };
  } catch (error) {
    console.error("Failed to revalidate page path:", error);
    return { error: error.message };
  }
}
