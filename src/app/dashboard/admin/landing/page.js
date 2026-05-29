"use client";
import { useState, useEffect, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import CoverImageUpload from "@/components/dashboard/CoverImageUpload";
import { saveLandingSettingsAction } from "./actions";

export default function LandingAdminPage() {
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [dbError, setDbError] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  // Fields
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroQuote, setHeroQuote] = useState("");
  const [heroQuoteAuthor, setHeroQuoteAuthor] = useState("");
  const [heroPhone, setHeroPhone] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [bannerImage, setBannerImage] = useState("");
  const [marqueeText, setMarqueeText] = useState("");

  // Featured Articles (Drag and Drop recent posts)
  const [allArticles, setAllArticles] = useState([]);
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [articleSearch, setArticleSearch] = useState("");
  const [draggedIndex, setDraggedIndex] = useState(null);

  const supabase = createClient();

  // 1. Authorize User
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin" && profile?.role !== "super_admin") {
        window.location.href = "/dashboard";
        return;
      }
      setAuthChecking(false);
    }
    checkAuth();
  }, [supabase]);

  // 2. Fetch Settings and Published Articles
  useEffect(() => {
    if (authChecking) return;

    async function fetchSettings() {
      setLoading(true);
      setDbError(false);
      try {
        const { data, error } = await supabase
          .from("landing_settings")
          .select("*")
          .eq("id", 1)
          .maybeSingle();

        // Also fetch all published articles
        const { data: allArticlesData, error: articlesError } = await supabase
          .from("articles")
          .select("id, title, slug, cover_image, excerpt, published_at, categories(name)")
          .eq("status", "published")
          .order("published_at", { ascending: false });

        if (error) {
          // If table doesn't exist
          if (error.code === "P0001" || error.message?.includes("relation") || error.message?.includes("does not exist")) {
            setDbError(true);
          } else {
            setErrorMsg("সেটিংস লোড করতে সমস্যা হয়েছে: " + error.message);
          }
        } else {
          if (allArticlesData) {
            setAllArticles(allArticlesData);
          }

          if (data) {
            setHeroTitle(data.hero_title || "");
            setHeroSubtitle(data.hero_subtitle || "");
            setHeroQuote(data.hero_quote || "");
            setHeroQuoteAuthor(data.hero_quote_author || "");
            setHeroPhone(data.hero_phone || "");
            setHeroImage(data.hero_image || "");
            setBannerImage(data.banner_image || "");
            setMarqueeText(data.marquee_text || "");

            // Map saved UUIDs to actual article objects in saved order
            const savedIds = data.featured_articles || [];
            if (allArticlesData) {
              const featured = savedIds
                .map(id => allArticlesData.find(a => a.id === id))
                .filter(Boolean);
              setFeaturedArticles(featured);
            }
          } else {
            // Try inserting initial values
            const { error: insertError } = await supabase
              .from("landing_settings")
              .insert([{ id: 1 }]);
            if (insertError) {
              setDbError(true);
            }
          }
        }
      } catch (err) {
        console.error(err);
        setDbError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, [authChecking, supabase]);

  // Featured Articles handlers
  const addFeaturedArticle = (article) => {
    if (featuredArticles.some(a => a.id === article.id)) return;
    setFeaturedArticles([...featuredArticles, article]);
  };

  const removeFeaturedArticle = (id) => {
    setFeaturedArticles(featuredArticles.filter(a => a.id !== id));
  };

  const moveFeaturedItem = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= featuredArticles.length) return;

    const updated = [...featuredArticles];
    const item = updated[index];
    updated.splice(index, 1);
    updated.splice(nextIndex, 0, item);
    setFeaturedArticles(updated);
  };

  // HTML5 Drag and Drop Handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const reordered = [...featuredArticles];
    const draggedItem = reordered[draggedIndex];
    reordered.splice(draggedIndex, 1);
    reordered.splice(index, 0, draggedItem);

    setDraggedIndex(index);
    setFeaturedArticles(reordered);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    const formData = new FormData();
    formData.append("hero_title", heroTitle);
    formData.append("hero_subtitle", heroSubtitle);
    formData.append("hero_quote", heroQuote);
    formData.append("hero_quote_author", heroQuoteAuthor);
    formData.append("hero_phone", heroPhone);
    formData.append("hero_image", heroImage);
    formData.append("banner_image", bannerImage);
    formData.append("marquee_text", marqueeText);

    // Add featured articles JSON list of UUIDs
    formData.append("featured_articles", JSON.stringify(featuredArticles.map(a => a.id)));

    startTransition(async () => {
      const res = await saveLandingSettingsAction(formData);
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg("ল্যান্ডিং পেজ সেটিংস সফলভাবে আপডেট করা হয়েছে!");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  };

  if (authChecking) {
    return (
      <div style={{ padding: "100px", textAlign: "center", color: "#999" }}>
        <i className="fas fa-shield-alt fa-spin" style={{ fontSize: "32px", color: "var(--primary)" }} />
        <p style={{ marginTop: "16px" }}>অনুমোদন যাচাই করা হচ্ছে...</p>
      </div>
    );
  }

  if (dbError) {
    return (
      <>
        <div className="dashboard-header">
          <h1>ল্যান্ডিং পেজ ব্যবস্থাপনা (Manage Landing Page)</h1>
          <div className="breadcrumb">
            <a href="/dashboard">Dashboard</a> / <a href="/dashboard/admin">Admin</a> / Landing Page
          </div>
        </div>

        <div className="dashboard-panel" style={{ borderLeft: "4px solid #e74c3c" }}>
          <div className="panel-header" style={{ color: "#e74c3c" }}>
            <h2><i className="fas fa-exclamation-triangle" style={{ marginRight: "10px" }} />ডাটাবেস টেবিল / কলাম অনুপস্থিত (Table or Column Missing)</h2>
          </div>
          <div className="panel-body" style={{ padding: "24px", lineHeight: "1.6" }}>
            <p style={{ marginBottom: "16px", fontSize: "15px", color: "#333" }}>
              ল্যান্ডিং পেজ নিয়ন্ত্রণ করার জন্য প্রয়োজনীয় ডাটাবেস টেবিল অথবা কলামটি (<strong>featured_articles</strong>) এখনও তৈরি করা হয়নি।
            </p>
            <div style={{ background: "#fdf3f2", border: "1px solid #f5c6cb", padding: "16px", borderRadius: "8px", marginBottom: "20px" }}>
              <h4 style={{ color: "#721c24", marginBottom: "8px" }}>কী করতে হবে? (Steps to resolve):</h4>
              <ol style={{ paddingLeft: "20px", color: "#721c24", fontSize: "14px" }}>
                <li style={{ marginBottom: "6px" }}>প্রজেক্টের রুট ডিরেক্টরিতে থাকা <code>supabase-landing.sql</code> ফাইলটি ওপেন করুন।</li>
                <li style={{ marginBottom: "6px" }}>ফাইলের কোডগুলো কপি করুন।</li>
                <li style={{ marginBottom: "6px" }}>আপনার <strong>Supabase Dashboard</strong>-এ গিয়ে <strong>SQL Editor</strong>-এ পেস্ট করে <strong>Run</strong> বাটনে ক্লিক করুন।</li>
                <li>রান হওয়ার পর এই পেজটি রিলোড (Reload) দিন।</li>
              </ol>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => window.location.reload()}
              style={{ display: "inline-flex", gap: "8px" }}
            >
              <i className="fas fa-sync-alt" /> পেজ রিলোড করুন
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="dashboard-header">
        <div>
          <h1>ল্যান্ডিং পেজ ব্যবস্থাপনা (Landing Page Controls)</h1>
          <div className="breadcrumb">
            <a href="/dashboard">Dashboard</a> / <a href="/dashboard/admin">Admin</a> / Landing Page
          </div>
        </div>
      </div>

      {successMsg && (
        <div style={{ background: "#d4edda", color: "#155724", border: "1px solid #c3e6cb", padding: "12px 20px", borderRadius: "8px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", fontSize: "14px" }}>
          <i className="fas fa-check-circle" style={{ fontSize: "18px" }}></i>
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{ background: "#f8d7da", color: "#721c24", border: "1px solid #f5c6cb", padding: "12px 20px", borderRadius: "8px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", fontSize: "14px" }}>
          <i className="fas fa-exclamation-circle" style={{ fontSize: "18px" }}></i>
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="dashboard-panel">
        <div className="panel-header">
          <h2>হোমপেজ ও ব্যানার কনফিগারেশন</h2>
        </div>
        <div className="panel-body" style={{ padding: "24px" }}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#999" }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: "24px", color: "var(--primary)" }} />
              <p style={{ marginTop: "12px" }}>লোড হচ্ছে...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "28px" }}>


              {/* Marquee Settings */}
              <div style={{ borderBottom: "1px solid #eee", paddingBottom: "24px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px", color: "var(--primary-dark)" }}>
                  <i className="fas fa-bullhorn" style={{ marginRight: "8px" }} /> টপ নোটিশ স্ক্রল (Marquee Text Notice)
                </h3>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>স্ক্রলিং লেখা (Notice Text)</label>
                  <textarea
                    value={marqueeText}
                    onChange={(e) => setMarqueeText(e.target.value)}
                    placeholder="সাম্প্রতিক নোটিশ বা বিজ্ঞপ্তির লেখা লিখুন যা উপরে স্ক্রল করবে..."
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      fontSize: "14px",
                      minHeight: "80px",
                      outline: "none"
                    }}
                  />
                </div>
              </div>

              {/* Images Settings */}
              <div style={{ borderBottom: "1px solid #eee", paddingBottom: "24px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px", color: "var(--primary-dark)" }}>
                  <i className="fas fa-images" style={{ marginRight: "8px" }} /> মিডিয়া ও ব্যানার ছবি (Media & Banners)
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
                  <CoverImageUpload
                    label="ওয়েবসাইট ব্যানার ছবি (Top Banner Image)"
                    value={bannerImage}
                    onChange={setBannerImage}
                  />
                  <CoverImageUpload
                    label="হিরো সেকশন ছবি (Hero Side Image)"
                    value={heroImage}
                    onChange={setHeroImage}
                  />
                </div>
              </div>

              {/* Hero Section Settings */}
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px", color: "var(--primary-dark)" }}>
                  <i className="fas fa-heading" style={{ marginRight: "8px" }} /> হিরো সেকশন কনটেন্ট (Hero Section Content)
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className="form-group">
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>হিরো প্রধান শিরোনাম (Main Title)</label>
                    <input
                      type="text"
                      value={heroTitle}
                      onChange={(e) => setHeroTitle(e.target.value)}
                      placeholder="যেমন: আপনার সঠিক সিদ্ধান্তই আপনাকে"
                      style={{
                        width: "100%",
                        padding: "12px",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        fontSize: "14px",
                        outline: "none"
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>হিরো উপশিরোনাম / হাইলাইট (Subtitle / Highlight)</label>
                    <input
                      type="text"
                      value={heroSubtitle}
                      onChange={(e) => setHeroSubtitle(e.target.value)}
                      placeholder="যেমন: রাখতে পারে সুস্থ এবং সুরক্ষিত।"
                      style={{
                        width: "100%",
                        padding: "12px",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        fontSize: "14px",
                        outline: "none"
                      }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div className="form-group" style={{ gridColumn: "span 2" }}>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>হিরো কোটেশন (Hahnemann Quote)</label>
                      <textarea
                        value={heroQuote}
                        onChange={(e) => setHeroQuote(e.target.value)}
                        placeholder="যেমন: Medicine is a science of experience..."
                        style={{
                          width: "100%",
                          padding: "12px",
                          border: "1px solid #ddd",
                          borderRadius: "8px",
                          fontSize: "14px",
                          minHeight: "100px",
                          outline: "none"
                        }}
                      />
                    </div>

                    <div className="form-group">
                      <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>কোটেশন লেখক (Quote Author)</label>
                      <input
                        type="text"
                        value={heroQuoteAuthor}
                        onChange={(e) => setHeroQuoteAuthor(e.target.value)}
                        placeholder="যেমন: Samuel Hahnemann"
                        style={{
                          width: "100%",
                          padding: "12px",
                          border: "1px solid #ddd",
                          borderRadius: "8px",
                          fontSize: "14px",
                          outline: "none"
                        }}
                      />
                    </div>

                    <div className="form-group">
                      <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>কল বাটন নাম্বার (Contact Button Phone)</label>
                      <input
                        type="text"
                        value={heroPhone}
                        onChange={(e) => setHeroPhone(e.target.value)}
                        placeholder="যেমন: +8801720970031"
                        style={{
                          width: "100%",
                          padding: "12px",
                          border: "1px solid #ddd",
                          borderRadius: "8px",
                          fontSize: "14px",
                          outline: "none"
                        }}
                      />
                    </div>
                  </div>
                  {/* Featured Articles Selection Section */}
                  <div style={{ borderBottom: "1px solid #eee", paddingBottom: "24px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "8px", color: "var(--primary-dark)" }}>
                      <i className="fas fa-sort-amount-down" style={{ marginRight: "8px" }} /> হোমপেজ সাম্প্রতিক পোস্ট নির্বাচন (Featured Recent Posts)
                    </h3>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>
                      হোমপেজে কোন ৩টি সাম্প্রতিক পোস্ট প্রদর্শিত হবে তা ড্র্যাগ-অ্যান্ড-ড্রপ করে নির্বাচন ও সাজাতে পারেন।
                    </p>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
                      {/* Selected Featured List */}
                      <div style={{ background: "#f8f9fa", border: "1px solid #e2e8f0", padding: "16px", borderRadius: "12px", minHeight: "200px" }}>
                        <h4 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--text-dark)" }}>
                          <span>নির্বাচিত সাম্প্রতিক পোস্ট ({featuredArticles.length})</span>
                          {featuredArticles.length > 3 && (
                            <span style={{ fontSize: "11px", color: "#e53e3e", background: "#fed7d7", padding: "2px 8px", borderRadius: "4px", fontWeight: "600" }}>
                              সুপারিশকৃত: ৩টি
                            </span>
                          )}
                        </h4>

                        {featuredArticles.length === 0 ? (
                          <div style={{ border: "2px dashed #cbd5e0", padding: "40px 20px", borderRadius: "8px", textAlign: "center", color: "#718096", fontSize: "13px", background: "white" }}>
                            কোনো পোস্ট নির্বাচন করা হয়নি। ডানপাশের তালিকা থেকে পোস্ট যোগ করুন।
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {featuredArticles.map((article, idx) => (
                              <div
                                key={article.id}
                                draggable="true"
                                onDragStart={(e) => handleDragStart(e, idx)}
                                onDragOver={(e) => handleDragOver(e, idx)}
                                onDragEnd={handleDragEnd}
                                style={{
                                  background: "white",
                                  border: "1px solid #cbd5e0",
                                  padding: "12px 16px",
                                  borderRadius: "8px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  cursor: "grab",
                                  transition: "all 0.2s",
                                  opacity: draggedIndex === idx ? 0.4 : 1,
                                  borderLeft: "4px solid var(--primary)"
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
                                  <span style={{ color: "#a0aec0", cursor: "grab" }}>
                                    <i className="fas fa-grip-vertical" />
                                  </span>
                                  {article.cover_image ? (
                                    <img
                                      src={article.cover_image}
                                      alt=""
                                      style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "6px", flexShrink: 0 }}
                                    />
                                  ) : (
                                    <div style={{ width: "40px", height: "40px", background: "#e8f5e9", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "6px", flexShrink: 0 }}>
                                      <i className="fas fa-leaf" style={{ fontSize: "16px" }} />
                                    </div>
                                  )}
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: "14px", fontWeight: "600", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", color: "var(--text-dark)" }}>
                                      {article.title}
                                    </div>
                                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                      {article.categories?.name || "সাধারণ"}
                                    </div>
                                  </div>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "12px" }}>
                                  {/* Move Up/Down buttons */}
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => moveFeaturedItem(idx, -1)}
                                    style={{ background: "none", border: "none", color: idx === 0 ? "#cbd5e0" : "#718096", cursor: idx === 0 ? "not-allowed" : "pointer", padding: "4px" }}
                                    title="উপরে সরান"
                                  >
                                    <i className="fas fa-chevron-up" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === featuredArticles.length - 1}
                                    onClick={() => moveFeaturedItem(idx, 1)}
                                    style={{ background: "none", border: "none", color: idx === featuredArticles.length - 1 ? "#cbd5e0" : "#718096", cursor: idx === featuredArticles.length - 1 ? "not-allowed" : "pointer", padding: "4px" }}
                                    title="নিচে সরান"
                                  >
                                    <i className="fas fa-chevron-down" />
                                  </button>
                                  {/* Remove button */}
                                  <button
                                    type="button"
                                    onClick={() => removeFeaturedArticle(article.id)}
                                    style={{ background: "none", border: "none", color: "#e53e3e", cursor: "pointer", padding: "4px", marginLeft: "4px" }}
                                    title="তালিকা থেকে বাদ দিন"
                                  >
                                    <i className="fas fa-trash-alt" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Available Articles List */}
                      <div style={{ background: "#f8f9fa", border: "1px solid #e2e8f0", padding: "16px", borderRadius: "12px", display: "flex", flexDirection: "column", height: "350px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                          <h4 style={{ fontSize: "14px", fontWeight: "600", margin: 0, color: "var(--text-dark)" }}>প্রকাশিত পোস্টের তালিকা</h4>
                          <input
                            type="text"
                            placeholder="খুঁজুন..."
                            value={articleSearch}
                            onChange={(e) => setArticleSearch(e.target.value)}
                            style={{
                              padding: "8px 12px",
                              border: "1px solid #cbd5e0",
                              borderRadius: "8px",
                              fontSize: "13px",
                              width: "160px",
                              outline: "none"
                            }}
                          />
                        </div>

                        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", paddingRight: "4px" }}>
                          {allArticles
                            .filter(a => !featuredArticles.some(f => f.id === a.id))
                            .filter(a => a.title.toLowerCase().includes(articleSearch.toLowerCase()))
                            .map(article => (
                              <div
                                key={article.id}
                                style={{
                                  background: "white",
                                  border: "1px solid #cbd5e0",
                                  padding: "10px 12px",
                                  borderRadius: "8px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  transition: "var(--transition)"
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
                                  {article.cover_image ? (
                                    <img
                                      src={article.cover_image}
                                      alt=""
                                      style={{ width: "32px", height: "32px", objectFit: "cover", borderRadius: "4px", flexShrink: 0 }}
                                    />
                                  ) : (
                                    <div style={{ width: "32px", height: "32px", background: "#e8f5e9", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "4px", flexShrink: 0 }}>
                                      <i className="fas fa-leaf" style={{ fontSize: "12px" }} />
                                    </div>
                                  )}
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: "13px", fontWeight: "600", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", color: "var(--text-dark)" }}>
                                      {article.title}
                                    </div>
                                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                      {article.categories?.name || "সাধারণ"}
                                    </div>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => addFeaturedArticle(article)}
                                  className="btn btn-primary btn-compact"
                                  style={{ padding: "6px 12px", fontSize: "12px", borderRadius: "6px", marginLeft: "10px" }}
                                >
                                  <i className="fas fa-plus" /> যোগ করুন
                                </button>
                              </div>
                            ))}

                          {allArticles.filter(a => !featuredArticles.some(f => f.id === a.id)).filter(a => a.title.toLowerCase().includes(articleSearch.toLowerCase())).length === 0 && (
                            <div style={{ padding: "40px 20px", textAlign: "center", color: "#a0aec0", fontSize: "13px" }}>
                              কোনো পোস্ট পাওয়া যায়নি
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid #eee", paddingTop: "20px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="btn btn-secondary"
                >
                  পুনরায় লোড করুন
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn btn-primary"
                  style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}
                >
                  {isPending ? (
                    <>
                      <i className="fas fa-spinner fa-spin" /> সংরক্ষণ করা হচ্ছে...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save" /> সেটিংস সংরক্ষণ করুন
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
