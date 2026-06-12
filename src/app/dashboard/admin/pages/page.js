"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import ArticleEditor from "@/components/dashboard/ArticleEditor";
import { revalidatePagePath } from "./actions";

export default function PagesAdminPage() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);

  const supabase = createClient();

  // 1. Authorize Admin/Super Admin
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

  // 2. Fetch system categories & their latest article
  const loadPagesData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: categoriesData, error: catError } = await supabase
        .from("categories")
        .select("*")
        .in("slug", ["about-us", "services", "privacy-policy"]);

      if (catError) throw catError;

      if (!categoriesData || categoriesData.length === 0) {
        setPages([]);
        return;
      }

      const categoryIds = categoriesData.map(c => c.id);
      const { data: articlesData, error: artError } = await supabase
        .from("articles")
        .select("*")
        .in("category_id", categoryIds)
        .order("updated_at", { ascending: false });

      if (artError) throw artError;

      const mappedPages = categoriesData.map(category => {
        const catArticles = (articlesData || []).filter(a => a.category_id === category.id);
        const latestArticle = catArticles[0] || null;

        let route = "/";
        let icon = "fas fa-file-alt";
        let details = "";
        
        if (category.slug === "about-us") {
          route = "/about";
          icon = "fas fa-info-circle";
          details = "আমাদের সেবা কেন্দ্র, টিম এবং লক্ষ্য সম্পর্কিত বিবরণ।";
        } else if (category.slug === "services") {
          route = "/services";
          icon = "fas fa-hand-holding-medical";
          details = "আমাদের সকল হোমিওপ্যাথিক চিকিৎসা সেবা ও পরামর্শের বিবরণ।";
        } else if (category.slug === "privacy-policy") {
          route = "/privacy";
          icon = "fas fa-user-shield";
          details = "ব্যক্তিগত গোপনীয়তা রক্ষা এবং সেবামূলক নীতি নির্দেশিকা।";
        }

        return {
          category,
          article: latestArticle,
          route,
          icon,
          details
        };
      });

      // Keep About Us -> Services -> Privacy Policy order
      const order = ["about-us", "services", "privacy-policy"];
      mappedPages.sort((a, b) => order.indexOf(a.category.slug) - order.indexOf(b.category.slug));

      setPages(mappedPages);
    } catch (err) {
      console.error("Error loading pages data:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (!authChecking) {
      loadPagesData();
    }
  }, [authChecking, loadPagesData]);

  const handleEditClick = (pageInfo) => {
    if (pageInfo.article) {
      setEditingArticle(pageInfo.article);
    } else {
      const skeleton = {
        title: pageInfo.category.name,
        slug: `${pageInfo.category.slug}-content`,
        category_id: pageInfo.category.id,
        content: `<h2>${pageInfo.category.name}</h2><p>এখানে আপনার পেজের কন্টেন্ট লিখুন...</p>`,
        status: "published",
        excerpt: pageInfo.category.description || `${pageInfo.category.name} পেজের বিস্তারিত তথ্য।`
      };
      setEditingArticle(skeleton);
    }
    setShowEditor(true);
  };

  const handleSave = async (savedArticle) => {
    setShowEditor(false);
    setEditingArticle(null);
    
    // Find the category slug of the page being updated
    const page = pages.find(p => p.category.id === savedArticle.category_id);
    if (page?.category?.slug) {
      await revalidatePagePath(page.category.slug);
    }
    
    loadPagesData();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "কখনো তৈরি করা হয়নি";
    const d = new Date(dateStr);
    return d.toLocaleDateString("bn-BD", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
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

  if (showEditor) {
    return (
      <ArticleEditor
        article={editingArticle}
        lockCategory={true}
        onSave={handleSave}
        onCancel={() => {
          setShowEditor(false);
          setEditingArticle(null);
        }}
      />
    );
  }

  return (
    <>
      <div className="dashboard-header">
        <div>
          <h1>পেজ ব্যবস্থাপনা (Manage Pages)</h1>
          <div className="breadcrumb">
            <a href="/dashboard">Dashboard</a> / <a href="/dashboard/admin">Admin</a> / Pages
          </div>
        </div>
      </div>

      <div className="dashboard-panel">
        <div className="panel-header">
          <h2>সিস্টেম পেজ সমূহ</h2>
        </div>
        <div className="panel-body" style={{ padding: "24px" }}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#999" }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: "24px", color: "var(--primary)" }} />
              <p style={{ marginTop: "12px" }}>তথ্য লোড হচ্ছে...</p>
            </div>
          ) : pages.length === 0 ? (
            <div style={{ padding: "60px 40px", textAlign: "center" }}>
              <i className="fas fa-exclamation-triangle" style={{ fontSize: "48px", color: "#f39c12", marginBottom: "16px" }} />
              <h3 style={{ color: "#999", fontWeight: 500 }}>সিস্টেম ক্যাটাগরিগুলো পাওয়া যায়নি</h3>
              <p style={{ color: "#bbb", fontSize: "14px", marginTop: "8px" }}>
                দয়া করে নিশ্চিত করুন যে `about-us`, `services`, এবং `privacy-policy` ক্যাটাগরি ডাটাবেসে সঠিকভাবে বীজ (seeded) করা হয়েছে।
              </p>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "24px"
            }}>
              {pages.map((p) => {
                const isPublished = p.article && p.article.status === "published";
                const isDraft = p.article && p.article.status === "draft";
                const isReview = p.article && p.article.status === "review";
                const exists = !!p.article;

                let statusBadgeColor = "#ffebee";
                let statusTextColor = "#c62828";
                let statusLabel = "তৈরি করা হয়নি (Not Created)";

                if (isPublished) {
                  statusBadgeColor = "#e8f5e9";
                  statusTextColor = "#2e7d32";
                  statusLabel = "প্রকাশিত (Published)";
                } else if (isDraft) {
                  statusBadgeColor = "#fff3e0";
                  statusTextColor = "#e65100";
                  statusLabel = "খসড়া (Draft)";
                } else if (isReview) {
                  statusBadgeColor = "#e3f2fd";
                  statusTextColor = "#1565c0";
                  statusLabel = "রিভিউ অনুরোধ (In Review)";
                }

                return (
                  <div
                    key={p.category.id}
                    style={{
                      background: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      padding: "24px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                      cursor: "default"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.06)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "none";
                      e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
                    }}
                  >
                    <div>
                      {/* Card Header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                        <div style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "10px",
                          backgroundColor: "#f0fdf4",
                          color: "var(--primary-dark)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "20px"
                        }}>
                          <i className={p.icon} />
                        </div>
                        <span style={{
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "600",
                          backgroundColor: statusBadgeColor,
                          color: statusTextColor
                        }}>
                          {statusLabel}
                        </span>
                      </div>

                      {/* Content Info */}
                      <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px", color: "#2d3748" }}>
                        {p.category.name}
                      </h3>
                      
                      <p style={{ fontSize: "13.5px", color: "#718096", marginBottom: "16px", lineHeight: "1.5" }}>
                        {p.details}
                      </p>

                      <hr style={{ border: 0, borderTop: "1px solid #edf2f7", margin: "16px 0" }} />

                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", color: "#4a5568" }}>
                        <div>
                          <strong>ইউআরএল (URL):</strong>{" "}
                          <a
                            href={p.route}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "var(--primary)", textDecoration: "none", fontWeight: "500", display: "inline-flex", alignItems: "center", gap: "4px" }}
                          >
                            {p.route} <i className="fas fa-external-link-alt" style={{ fontSize: "10px" }} />
                          </a>
                        </div>
                        <div>
                          <strong>ভিয়ুস (Views):</strong> {p.article?.views || 0} বার
                        </div>
                        <div>
                          <strong>শেষ আপডেট:</strong> <span style={{ color: "#718096" }}>{formatDate(p.article?.updated_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: "24px" }}>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleEditClick(p)}
                        style={{
                          width: "100%",
                          padding: "10px 16px",
                          fontSize: "14px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px"
                        }}
                      >
                        <i className="fas fa-edit" /> কন্টেন্ট পরিবর্তন করুন
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
