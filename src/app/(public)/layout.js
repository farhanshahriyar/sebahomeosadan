import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MarqueeBar from "@/components/MarqueeBar";
import FloatingContact from "@/components/FloatingContact";
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
  // Fetch active categories from database for the navbar and landing page settings
  let categories = [];
  let landingSettings = null;
  try {
    const supabase = createPublicClient();
    
    const [categoriesRes, settingsRes] = await Promise.all([
      supabase
        .from("categories")
        .select("id, name, slug, description, parent_id")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("landing_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle()
    ]);

    if (categoriesRes.data) {
      // Find main categories (subjects)
      const subjects = categoriesRes.data.filter((c) => !c.parent_id);
      // Map topics as children of subjects
      categories = subjects.map((subject) => {
        const topics = categoriesRes.data.filter((c) => c.parent_id === subject.id);
        return {
          ...subject,
          children: topics.length > 0 ? topics.map((t) => ({
            label: t.name,
            href: `/articles?category=${t.slug}`,
          })) : null,
        };
      });
    }

    if (settingsRes.data) {
      landingSettings = settingsRes.data;
    }
  } catch (e) {
    // Silently fail — navbar will fall back to static items only
    console.error("Failed to fetch layout data:", e);
  }

  return (
    <>
      <div className="top-banner">
        <img src={landingSettings?.banner_image || "/img/banner.png"} alt="Good Health Homeo Care ব্যানার" />
      </div>
      <MarqueeBar text={landingSettings?.marquee_text} />
      <Navbar categories={categories} />
      <main>{children}</main>
      <FloatingContact />
      <Footer />
    </>
  );
}
