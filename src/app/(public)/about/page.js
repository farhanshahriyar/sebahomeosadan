import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";

export async function generateMetadata() {
  const supabase = await createClient();
  const { data: category } = await supabase
    .from("categories")
    .select("name, description")
    .eq("slug", "about-us")
    .maybeSingle();

  return {
    title: `${category?.name || "আমাদের সম্পর্কে"} | Popular Homeo Center`,
    description: category?.description || "আমাদের সম্পর্কে জানুন",
  };
}

export default async function AboutUsPage() {
  const supabase = await createClient();

  // 1. Fetch the category ID
  const { data: category } = await supabase
    .from("categories")
    .select("id, name")
    .eq("slug", "about-us")
    .maybeSingle();

  let article = null;
  if (category) {
    // 2. Fetch the latest published article in this category
    const { data: fetchedArticles } = await supabase
      .from("articles")
      .select("*, categories(name)")
      .eq("status", "published")
      .eq("category_id", category.id)
      .order("published_at", { ascending: false })
      .limit(1);
    
    if (fetchedArticles && fetchedArticles.length > 0) {
      article = fetchedArticles[0];
    }
  }

  return (
    <div className="container">
      <div className="blog-layout">
        <div className="blog-content" id="about-us-content">
          <span className="category">{category?.name || "আমাদের সম্পর্কে"}</span>
          {article ? (
            <>
              <h1 className="post-title">{article.title}</h1>
              {article.cover_image && (
                <img
                  src={article.cover_image}
                  alt={article.title}
                  style={{
                    width: "100%",
                    borderRadius: "12px",
                    marginBottom: "24px",
                    objectFit: "cover",
                    maxHeight: "400px",
                  }}
                />
              )}
              <div
                className="article-body"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            </>
          ) : (
            <div style={{
              padding: "80px 40px",
              textAlign: "center",
              background: "#fafafa",
              borderRadius: "16px",
              border: "2px dashed #e2e8f0",
              margin: "30px 0"
            }}>
              <i className="fas fa-file-alt" style={{ fontSize: "50px", color: "#cbd5e0", marginBottom: "20px" }} />
              <h2 style={{ fontSize: "1.6rem", color: "#4a5568", marginBottom: "12px", fontWeight: "600" }}>
                তথ্য শীঘ্রই আপডেট করা হবে
              </h2>
              <p style={{ color: "#718096", fontSize: "15px", lineHeight: "1.6", maxWidth: "460px", margin: "0 auto 24px" }}>
                এই পেজের তথ্য বর্তমানে তৈরি বা আপডেট করা হচ্ছে। খুব শীঘ্রই আমাদের ক্লিনিকের বিস্তারিত তথ্য এখানে যুক্ত করা হবে।
              </p>
              <Link href="/" className="btn btn-primary" style={{ padding: "10px 24px", fontSize: "14px", display: "inline-flex", gap: "8px", alignItems: "center" }}>
                <i className="fas fa-home" /> প্রচ্ছদে ফিরে যান
              </Link>
            </div>
          )}
        </div>
        <Sidebar />
      </div>
    </div>
  );
}
