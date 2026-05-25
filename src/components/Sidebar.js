import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function Sidebar() {
  const supabase = await createClient();

  // Fetch recent published articles
  const { data: recentPosts } = await supabase
    .from("articles")
    .select("title, slug, published_at, categories(name)")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(5);

  // Fetch active categories (admin-approved)
  const { data: categoryData } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const categories = categoryData || [];

  // Fetch unique tags from published articles
  const { data: tagData } = await supabase
    .from("articles")
    .select("tags")
    .eq("status", "published");

  const allTags = tagData
    ? [...new Set(tagData.flatMap((t) => t.tags || []))]
    : [];

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("bn-BD", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <aside>
      {/* Recent Posts */}
      <div className="sidebar-widget">
        <h3>সাম্প্রতিক পোস্ট</h3>
        <ul>
          {recentPosts && recentPosts.length > 0 ? (
            recentPosts.map((post) => (
              <li key={post.slug}>
                <Link href={`/articles/${post.slug}`}>
                  <h5>{post.title}</h5>
                  <span>{formatDate(post.published_at)}</span>
                </Link>
              </li>
            ))
          ) : (
            <li style={{ color: "#999", fontSize: "14px" }}>
              এখনও কোনো পোস্ট প্রকাশিত হয়নি
            </li>
          )}
        </ul>
      </div>

      {/* Categories */}
      <div className="sidebar-widget">
        <h3>বিভাগসমূহ</h3>
        <ul>
          {categories.length > 0 ? (
            categories.map((cat) => (
              <li key={cat.id}>
                <Link href={`/articles?category=${encodeURIComponent(cat.slug)}`}>
                  {cat.name}
                </Link>
              </li>
            ))
          ) : (
            <li style={{ color: "#999", fontSize: "14px" }}>
              এখনও কোনো বিভাগ যোগ করা হয়নি
            </li>
          )}
        </ul>
      </div>

      {/* Tags */}
      <div className="sidebar-widget">
        <h3>ট্যাগ</h3>
        <div className="tag-list">
          {allTags.length > 0 ? (
            allTags.slice(0, 10).map((tag) => (
              <Link
                key={tag}
                href={`/articles?tag=${encodeURIComponent(tag)}`}
                className="tag-item"
              >
                {tag}
              </Link>
            ))
          ) : (
            <>
              <Link href="#" className="tag-item">এনাটমি</Link>
              <Link href="#" className="tag-item">ফিজিওলজি</Link>
              <Link href="#" className="tag-item">প্যাথলজি</Link>
              <Link href="#" className="tag-item">হোমিওপ্যাথি</Link>
              <Link href="#" className="tag-item">ওষুধ</Link>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
