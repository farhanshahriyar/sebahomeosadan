import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MarqueeBar from "@/components/MarqueeBar";
import { createServerClient } from "@supabase/ssr";

// A lightweight Supabase client that does NOT use cookies,
// suitable for public read-only queries during static generation.
function createPublicClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() { return []; },
        setAll() {},
      },
    }
  );
}

export default async function PublicLayout({ children }) {
  // Fetch active categories from database for the navbar
  let categories = [];
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("categories")
      .select("id, name, slug, description")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (data) {
      categories = data;
    }
  } catch (e) {
    // Silently fail — navbar will fall back to static items only
    console.error("Failed to fetch categories for navbar:", e);
  }

  return (
    <>
      <div className="top-banner">
        <img src="/img/banner.png" alt="Good Health Homeo Care ব্যানার" />
      </div>
      <MarqueeBar />
      <Navbar categories={categories} />
      <main>{children}</main>
      <Footer />
    </>
  );
}
