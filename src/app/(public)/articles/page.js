import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";

export const metadata = {
  title: "আর্টিকেলসমূহ | Popular Homeo Center",
  description: "আমাদের স্বাস্থ্য বিষয়ক আর্টিকেল ও ব্লগ পোস্টসমূহ। বিভিন্ন রোগ ও হোমিওপ্যাথি চিকিৎসা সম্পর্কে জানুন।",
};

function formatBanglaDate(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return d.toLocaleDateString("bn-BD", options);
}

export default async function ArticlesPage({ searchParams }) {
  const params = await searchParams;
  const categorySlug = params.category;
  const tagName = params.tag;
  const searchQuery = params.search;
  const page = parseInt(params.page) || 1;

  const supabase = await createClient();

  // Fetch site_config for posts_per_page and enable_search
  const { data: siteConfig } = await supabase
    .from("site_config")
    .select("posts_per_page, enable_search, show_author_name, show_reading_time")
    .eq("id", 1)
    .maybeSingle();

  const postsPerPage = siteConfig?.posts_per_page || 10;
  const enableSearch = siteConfig?.enable_search !== false; // default true
  const showAuthor = siteConfig?.show_author_name !== false; // default true
  const showReadingTime = siteConfig?.show_reading_time !== false; // default true

  // 1. Resolve Category if filtering by category
  let categoryData = null;
  if (categorySlug) {
    const { data } = await supabase
      .from("categories")
      .select("id, name, slug")
      .eq("slug", categorySlug)
      .single();
    categoryData = data;
  }

  // 2. Fetch Articles with pagination
  let query = supabase
    .from("articles")
    .select("*, categories(name, slug)", { count: "exact" })
    .eq("status", "published");

  if (categoryData) {
    query = query.eq("category_id", categoryData.id);
  }

  if (tagName) {
    query = query.contains("tags", [tagName]);
  }

  if (searchQuery && enableSearch) {
    query = query.or(
      `title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%`
    );
  }

  // Apply pagination
  const from = (page - 1) * postsPerPage;
  const to = from + postsPerPage - 1;

  // Order by published date
  const { data: articles, error, count } = await query
    .order("published_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error fetching articles:", error);
  }

  const totalPages = Math.ceil((count || 0) / postsPerPage);

  // If filtering by category and there's exactly one article, go directly to it
  if (categorySlug && !searchQuery && !tagName && articles && articles.length === 1 && count === 1) {
    redirect(`/articles/${articles[0].slug}`);
  }

  // Calculate reading time
  function getReadingTime(content) {
    if (!content) return 1;
    const wordCount = content.replace(/<[^>]+>/g, '').split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / 200));
  }

  // Determine Title / Header
  let pageHeader = "সব আর্টিকেল";
  if (categoryData) {
    pageHeader = categoryData.name;
  } else if (tagName) {
    pageHeader = `ট্যাগ: ${tagName}`;
  } else if (searchQuery) {
    pageHeader = `অনুসন্ধান: "${searchQuery}"`;
  }

  // Build pagination URL
  function buildPageUrl(pageNum) {
    const params = new URLSearchParams();
    if (categorySlug) params.set("category", categorySlug);
    if (tagName) params.set("tag", tagName);
    if (searchQuery) params.set("search", searchQuery);
    if (pageNum > 1) params.set("page", pageNum.toString());
    const qs = params.toString();
    return `/articles${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="container">
      <div className="blog-layout">
        <div className="blog-content" id="articles-list-container">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
              marginBottom: "30px",
              paddingBottom: "16px",
              borderBottom: "2px solid #eee",
            }}
          >
            <h1
              className="post-title"
              style={{ margin: 0, fontSize: "1.8rem", color: "var(--primary-dark)" }}
            >
              {pageHeader}
              {count > 0 && (
                <span style={{ fontSize: "14px", fontWeight: 400, color: "#999", marginLeft: "8px" }}>
                  ({count}টি)
                </span>
              )}
            </h1>

            {/* Search Form - only if enabled */}
            {enableSearch && (
              <form
                action="/articles"
                method="GET"
                style={{ display: "flex", gap: "8px", maxWidth: "100%", width: "320px" }}
              >
                {categorySlug && (
                  <input type="hidden" name="category" value={categorySlug} />
                )}
                {tagName && <input type="hidden" name="tag" value={tagName} />}
                <input
                  type="text"
                  name="search"
                  defaultValue={searchQuery || ""}
                  placeholder="আর্টিকেল খুঁজুন..."
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    fontSize: "14px",
                  }}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: "8px 16px", borderRadius: "8px", fontSize: "14px" }}
                >
                  <i className="fas fa-search"></i>
                </button>
              </form>
            )}
          </div>

          {/* Articles Grid */}
          {articles && articles.length > 0 ? (
            <div className="news-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
              {articles.map((article) => (
                <div className="news-card" key={article.id} style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                  {article.cover_image ? (
                    <img
                      src={article.cover_image}
                      alt={article.title}
                      style={{ height: "160px", objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        height: "160px",
                        background: "linear-gradient(135deg, #e8f5e9, #c8e6c9)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--primary)",
                      }}
                    >
                      <i className="fas fa-leaf" style={{ fontSize: "40px" }} />
                    </div>
                  )}
                  <div className="news-card-body" style={{ flex: 1, display: "flex", flexDirection: "column", padding: "20px" }}>
                    <span className="author" style={{ fontSize: "12px", marginBottom: "6px" }}>
                      {article.categories?.name || "সাধারণ"}
                    </span>
                    <h3 style={{ fontSize: "1.1rem", lineHeight: "1.4", marginBottom: "10px", fontWeight: "600" }}>
                      <Link href={`/articles/${article.slug}`} style={{ color: "var(--text-dark)" }}>
                        {article.title}
                      </Link>
                    </h3>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", flex: 1, marginBottom: "16px", lineHeight: "1.6" }}>
                      {article.excerpt || (article.content ? article.content.replace(/<[^>]+>/g, '').substring(0, 100) + "..." : "")}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: "auto",
                        borderTop: "1px solid #f0f0f0",
                        paddingTop: "12px",
                      }}
                    >
                      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          <i className="far fa-calendar-alt" style={{ marginRight: "4px" }} />
                          {formatBanglaDate(article.published_at)}
                        </span>
                        {showAuthor && article.author_name && (
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                            <i className="far fa-user" style={{ marginRight: "3px" }} />
                            {article.author_name}
                          </span>
                        )}
                        {showReadingTime && (
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                            <i className="far fa-clock" style={{ marginRight: "3px" }} />
                            {getReadingTime(article.content)} মিনিট
                          </span>
                        )}
                      </div>
                      <Link href={`/articles/${article.slug}`} className="read-more" style={{ fontSize: "13px" }}>
                        পড়ুন →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "80px 40px",
                background: "#f9f9f9",
                borderRadius: "12px",
                border: "1px dashed #ddd",
              }}
            >
              <i
                className="fas fa-feather"
                style={{ fontSize: "48px", color: "#ccc", marginBottom: "16px" }}
              />
              <h3 style={{ fontWeight: 500, color: "#666", marginBottom: "8px" }}>
                কোনো আর্টিকেল পাওয়া যায়নি
              </h3>
              <p style={{ color: "#999", fontSize: "14px" }}>
                অন্য কোনো বিভাগ বা ট্যাগ নির্বাচন করুন অথবা অন্য কিছু লিখে অনুসন্ধান করুন।
              </p>
              {(categorySlug || tagName || searchQuery) && (
                <Link
                  href="/articles"
                  className="btn btn-primary"
                  style={{ marginTop: "20px", display: "inline-flex", padding: "10px 20px", fontSize: "14px" }}
                >
                  সব আর্টিকেল দেখুন
                </Link>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px",
              marginTop: "40px",
              flexWrap: "wrap",
            }}>
              {page > 1 && (
                <Link
                  href={buildPageUrl(page - 1)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "8px",
                    border: "1px solid #ddd",
                    color: "var(--primary)",
                    fontSize: "13px",
                    textDecoration: "none",
                  }}
                >
                  ← আগে
                </Link>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={buildPageUrl(p)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "8px",
                    border: p === page ? "1px solid var(--primary)" : "1px solid #ddd",
                    background: p === page ? "var(--primary)" : "white",
                    color: p === page ? "white" : "#555",
                    fontSize: "13px",
                    fontWeight: p === page ? "700" : "400",
                    textDecoration: "none",
                  }}
                >
                  {p}
                </Link>
              ))}
              {page < totalPages && (
                <Link
                  href={buildPageUrl(page + 1)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "8px",
                    border: "1px solid #ddd",
                    color: "var(--primary)",
                    fontSize: "13px",
                    textDecoration: "none",
                  }}
                >
                  পরে →
                </Link>
              )}
            </div>
          )}
        </div>
        <Sidebar />
      </div>
    </div>
  );
}
