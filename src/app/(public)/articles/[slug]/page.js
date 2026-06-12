import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const supabase = await createClient();
  const decodedSlug = decodeURIComponent(slug);
  const { data: article } = await supabase
    .from("articles")
    .select("title, excerpt, categories(name)")
    .or(`slug.eq.${slug},slug.eq.${decodedSlug}`)
    .eq("status", "published")
    .limit(1)
    .maybeSingle();

  if (!article) {
    return { title: "পোস্ট পাওয়া যায়নি | Popular Homeo Center" };
  }

  return {
    title: `${article.title} | Popular Homeo Center`,
    description: article.excerpt || article.title,
  };
}

function formatBanglaDate(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return d.toLocaleDateString("bn-BD", options);
}

function formatBanglaTime(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  return d.toLocaleTimeString("bn-BD", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getReadingTime(content) {
  if (!content) return 1;
  const wordCount = content.replace(/<[^>]+>/g, '').split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const supabase = await createClient();

  const decodedSlug = decodeURIComponent(slug);

  // Fetch article and site_config in parallel
  const [articleRes, configRes] = await Promise.all([
    supabase
      .from("articles")
      .select("*, categories(name)")
      .or(`slug.eq.${slug},slug.eq.${decodedSlug}`)
      .eq("status", "published")
      .limit(1)
      .maybeSingle(),
    supabase
      .from("site_config")
      .select("show_author_name, show_reading_time")
      .eq("id", 1)
      .maybeSingle()
  ]);

  const article = articleRes.data;
  const error = articleRes.error;
  const siteConfig = configRes.data;

  const showAuthor = siteConfig?.show_author_name !== false;
  const showReadingTime = siteConfig?.show_reading_time !== false;

  if (error || !article) {
    notFound();
  }

  // Increment view count (fire and forget)
  supabase
    .from("articles")
    .update({ views: (article.views || 0) + 1 })
    .eq("id", article.id)
    .then(() => { });

  // Fetch previous and next articles for navigation
  const { data: prevArticle } = await supabase
    .from("articles")
    .select("title, slug")
    .eq("status", "published")
    .lt("published_at", article.published_at)
    .order("published_at", { ascending: false })
    .limit(1)
    .single();

  const { data: nextArticle } = await supabase
    .from("articles")
    .select("title, slug")
    .eq("status", "published")
    .gt("published_at", article.published_at)
    .order("published_at", { ascending: true })
    .limit(1)
    .single();

  return (
    <div className="container">
      <div className="blog-layout">
        <div className="blog-content" id="article-content">
          <span className="category">{article.categories?.name || "সাধারণ"}</span>
          <h1 className="post-title">{article.title}</h1>
          <div className="post-meta">
            {showAuthor && article.author_name && <span>{article.author_name}</span>}
            <span>{formatBanglaDate(article.published_at)}</span>
            <span>{formatBanglaTime(article.published_at)}</span>
            {showReadingTime && (
              <span>
                <i className="far fa-clock" style={{ marginRight: "4px" }} />
                {getReadingTime(article.content)} মিনিট পড়ার সময়
              </span>
            )}
          </div>

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

          {/* Render HTML content from the editor */}
          <div
            className="article-body"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div style={{ marginTop: "24px" }}>
              <div className="tag-list">
                {article.tags.map((tag, i) => (
                  <span key={i} className="tag-item">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="post-navigation">
            <div>
              {prevArticle && (
                <a href={`/articles/${prevArticle.slug}`}>
                  <i className="fas fa-arrow-left" /> {prevArticle.title}
                </a>
              )}
            </div>
            <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
              <div className="post-share">
                <i className="fa fa-share-alt" />
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                    `https://goodhealthhomeocare.com/articles/${article.slug}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Facebook
                </a>
              </div>
              {nextArticle && (
                <div>
                  <a href={`/articles/${nextArticle.slug}`}>
                    {nextArticle.title} <i className="fas fa-arrow-right" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
        <Sidebar />
      </div>
    </div>
  );
}
