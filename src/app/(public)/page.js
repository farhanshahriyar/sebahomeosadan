import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Testimonials from "@/components/Testimonials";

export const metadata = {
  title: "Good Health Homeo Care | চিকিৎসা সেবা ও তথ্য",
  description: "আপনার সঠিক সিদ্ধান্তই আপনাকে রাখতে পারে সুস্থ এবং সুরক্ষিত। হোমিওপ্যাথি চিকিৎসা সেবা ও পরামর্শ কেন্দ্র।",
};

export default async function HomePage() {
  const supabase = await createClient();

  // Fetch the latest 3 published articles
  const { data: articles, error } = await supabase
    .from("articles")
    .select("*, categories(name)")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(3);

  if (error) {
    console.error("Error fetching homepage articles:", error);
  }

  // Fallback static articles in case database is empty or queries fail
  const fallbackArticles = [
    {
      id: "fallback-1",
      title: "হোমিওপ্যাথি চিকিৎসাকে জনপ্রিয় করা হবে",
      author_name: "রাইজিংবিডি.কম",
      excerpt: "চিকিৎসা ক্ষেত্রে হোমিওপ্যাথি ব্যবস্থাকে জনপ্রিয় এবং সাধারন মানুষের দোড়গোড়ায় পৌঁছে দেওয়ার উদ্যোগ নেওয়া হবে বলে জানিয়েছেন অর্থমন্ত্রী।",
      cover_image: "/img/latest news/sim1.JPG",
      isExternal: true,
      href: "https://www.risingbd.com/health/news/251846"
    },
    {
      id: "fallback-2",
      title: "এনাটমি, ফিজিওলজি - দেহতন্ত্রের প্রাথমিক জ্ঞান",
      author_name: "মোঃ আমিরুল ইসলাম প্রামানিক",
      excerpt: "এনাটমি হলো শরীরের গঠন সম্পর্কে জ্ঞান এবং বিভিন্ন অংশের সঙ্গে অন্যটির সম্পর্ক। স্থানিক বা Regional এনাটমি হলো...",
      cover_image: "/img/img1.png",
      href: "/anatomy"
    },
    {
      id: "fallback-3",
      title: "একোনাইটাম নেপেলাস",
      author_name: "মোঃ আমিরুল ইসলাম প্রামানিক",
      excerpt: "যুবক-যুবtীদের বিশেষতঃ বালিকাদের যারা পূর্ণ রক্তপ্রধান ধাতুবিশিষ্ট এবং অলসভাবে সময় কাটায়...",
      cover_image: "/img/img2.png",
      href: "/medicines/aconitum-napellus"
    }
  ];

  const displayArticles = articles && articles.length > 0 ? articles : fallbackArticles;

  return (
    <>
      {/* Hero Section */}
      <section className="hero" id="hero-section">
        <div className="container">
          <div className="hero-text">
            <h1>
              <span className="highlight">আপনার সঠিক সিদ্ধান্তই আপনাকে</span>
              রাখতে পারে সুস্থ এবং সুরক্ষিত।
            </h1>
            <div className="quote">
              <p>
                &ldquo;Medicine is a science of experience; its object is to
                eradicate diseases by means of remedies. The knowledge of
                disease, the knowledge of remedies and the knowledge of their
                employment, constitute medicine.&rdquo;
              </p>
              <p>— Samuel Hahnemann</p>
            </div>
            <a href="tel:+8801720970031" className="btn btn-primary" id="contact-btn">
              <i className="fa fa-phone" /> যোগাযোগ করুন
            </a>
          </div>
          <div className="hero-img">
            <img src="/img/img2.png" alt="হোমিওপ্যাথি চিকিৎসা" />
          </div>
        </div>
      </section>

      {/* Latest News Section */}
      <section className="section news-section" id="latest-news">
        <div className="container">
          <div className="section-header">
            <h2>সাম্প্রতিক পোস্ট</h2>
            <p>আমাদের সর্বশেষ ব্লগ পোস্ট দেখুন</p>
          </div>
          <div className="news-grid">
            {displayArticles.map((article) => {
              const isExternal = article.isExternal;
              const href = isExternal ? article.href : `/articles/${article.slug || ""}`;
              const linkProps = isExternal 
                ? { href, target: "_blank", rel: "noopener noreferrer" } 
                : { href: article.href || href };

              return (
                <div className="news-card" key={article.id} id={`news-card-${article.id}`}>
                  {article.cover_image ? (
                    <img src={article.cover_image} alt={article.title} />
                  ) : (
                    <div
                      style={{
                        height: "180px",
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
                  <div className="news-card-body">
                    <h3>{article.title}</h3>
                    <span className="author">{article.author_name || article.categories?.name || "Good Health Homeo"}</span>
                    <p>
                      {article.excerpt || (article.content ? article.content.substring(0, 100) + "..." : "")}
                    </p>
                    {isExternal ? (
                      <a {...linkProps} className="read-more">
                        আরও পড়ুন →
                      </a>
                    ) : (
                      <Link href={article.href || href} className="read-more">
                        আরও পড়ুন →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {articles && articles.length > 0 && (
            <div style={{ textAlign: "center", marginTop: "40px" }}>
              <Link href="/articles" className="btn btn-primary" style={{ padding: "10px 24px", fontSize: "14px" }}>
                সব আর্টিকেল দেখুন
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <Testimonials />
    </>
  );
}
