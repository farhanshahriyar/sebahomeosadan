"use server";

import { revalidatePath } from "next/cache";

export async function revalidatePost(slug) {
  try {
    revalidatePath("/articles");
    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/posts");
    if (slug) {
      revalidatePath(`/articles/${slug}`);
    }
    return { success: true };
  } catch (error) {
    console.error("Failed to revalidate path:", error);
    return { error: error.message };
  }
}
