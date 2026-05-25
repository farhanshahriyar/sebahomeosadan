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
      .select("id, name, slug, description, parent_id")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (data) {
      // Find main categories (subjects)
      const subjects = data.filter((c) => !c.parent_id);
      // Map topics as children of subjects
      categories = subjects.map((subject) => {
        const topics = data.filter((c) => c.parent_id === subject.id);
        return {
          ...subject,
          children: topics.length > 0 ? topics.map((t) => ({
            label: t.name,
            href: `/articles?category=${t.slug}`,
          })) : null,
        };
      });
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
