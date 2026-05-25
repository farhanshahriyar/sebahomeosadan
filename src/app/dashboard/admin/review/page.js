"use client";
import { useState, useEffect, useCallback, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { approveArticleAction, rejectArticleAction } from "./actions";

export default function EditorialReviewPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [previewArticle, setPreviewArticle] = useState(null);
  const [isPending, startTransition] = useTransition();

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

  // 2. Fetch Review Articles
  const fetchArticles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("articles")
      .select("*, categories(name)")
      .eq("status", "review")
      .order("updated_at", { ascending: false });

    if (!error && data) {
      setArticles(data);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (!authChecking) {
      fetchArticles();
    }
  }, [authChecking, fetchArticles]);

  const handleApprove = (id) => {
    startTransition(async () => {
      const res = await approveArticleAction(id);
      if (res?.error) {
        alert(res.error);
      } else {
        setPreviewArticle(null);
        fetchArticles();
      }
    });
  };

  const handleReject = (id) => {
    startTransition(async () => {
      const res = await rejectArticleAction(id);
      if (res?.error) {
        alert(res.error);
      } else {
        setPreviewArticle(null);
        fetchArticles();
      }
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("bn-BD", {
      year: "numeric",
      month: "long",
      day: "numeric",
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

  return (
    <>
      <div className="dashboard-header">
        <div>
          <h1>সম্পাদকীয় রিভিউ (Editorial Review)</h1>
          <div className="breadcrumb">
            <a href="/dashboard">Dashboard</a> / <a href="/dashboard/admin">Admin</a> / Review
          </div>
        </div>
      </div>

      <div className="dashboard-panel">
        <div className="panel-header">
          <h2>রিভিউর অপেক্ষায় থাকা আর্টিকেলসমূহ ({articles.length})</h2>
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#999" }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: "24px" }} />
              <p style={{ marginTop: "12px" }}>লোড হচ্ছে...</p>
            </div>
          ) : articles.length === 0 ? (
            <div style={{ padding: "60px 40px", textAlign: "center" }}>
              <i className="fas fa-clipboard-check" style={{ fontSize: "48px", color: "#ddd", marginBottom: "16px", display: "block" }} />
              <h3 style={{ color: "#999", fontWeight: 500, marginBottom: "8px" }}>কোনো আর্টিকেল পেন্ডিং নেই</h3>
              <p style={{ color: "#bbb", fontSize: "14px" }}>সব আর্টিকেল রিভিও করা হয়েছে। নতুন সাবমিশনের জন্য অপেক্ষা করুন।</p>
            </div>
          ) : (
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>শিরোনাম (Title)</th>
                  <th>লেখক (Author)</th>
                  <th>ক্যাটাগরি (Category)</th>
                  <th>সাবমিট করা হয়েছে (Submitted)</th>
                  <th>অ্যাকশন (Actions)</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((article) => (
                  <tr key={article.id}>
                    <td><strong>{article.title}</strong></td>
                    <td>{article.author_name || "Unknown"}</td>
                    <td>{article.categories?.name || "—"}</td>
                    <td>{formatDate(article.updated_at)}</td>
                    <td>
                      <div className="action-buttons-group">
                        <button
                          className="btn btn-view"
                          title="প্রিভিউ দেখুন"
                          onClick={() => setPreviewArticle(article)}
                          disabled={isPending}
                        >
                          <i className="fas fa-eye"></i> প্রিভিউ
                        </button>
                        <button
                          className="btn btn-approve"
                          title="অনুমোদন ও প্রকাশ করুন"
                          onClick={() => handleApprove(article.id)}
                          disabled={isPending}
                        >
                          <i className="fas fa-check"></i> প্রকাশ করুন
                        </button>
                        <button
                          className="btn btn-reject"
                          title="ড্রাফট করুন"
                          onClick={() => handleReject(article.id)}
                          disabled={isPending}
                        >
                          <i className="fas fa-undo"></i> ড্রাফট করুন
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewArticle && (
        <div className="preview-overlay">
          <div className="preview-content">
            <div className="preview-header">
              <div>
                <span className="category-badge">{previewArticle.categories?.name || "সাধারণ"}</span>
                <h2>{previewArticle.title}</h2>
                <p style={{ margin: "4px 0 0 0", color: "#666", fontSize: "13px" }}>
                  লেখক: <strong>{previewArticle.author_name}</strong> | শেষ পরিবর্তন: {formatDate(previewArticle.updated_at)}
                </p>
              </div>
              <button className="close-btn" onClick={() => setPreviewArticle(null)} disabled={isPending}>
                &times;
              </button>
            </div>

            <div className="preview-body">
              {previewArticle.cover_image && (
                <img
                  src={previewArticle.cover_image}
                  alt={previewArticle.title}
                  style={{ width: "100%", maxHeight: "250px", objectFit: "cover", borderRadius: "8px", marginBottom: "20px" }}
                />
              )}
              {previewArticle.excerpt && (
                <blockquote style={{ margin: "0 0 20px 0", padding: "10px 15px", borderLeft: "4px solid var(--primary)", background: "#f9f9f9", fontStyle: "italic", fontSize: "14px", color: "#555" }}>
                  {previewArticle.excerpt}
                </blockquote>
              )}
              
              <div 
                className="article-content-render"
                dangerouslySetInnerHTML={{ __html: previewArticle.content }}
                style={{ fontSize: "15px", lineHeight: "1.7", color: "#333" }}
              />

              {previewArticle.tags && previewArticle.tags.length > 0 && (
                <div style={{ marginTop: "24px", paddingTop: "12px", borderTop: "1px solid #eee" }}>
                  <strong>ট্যাগসমূহ: </strong>
                  <div style={{ display: "inline-flex", gap: "6px", flexWrap: "wrap", marginLeft: "8px" }}>
                    {previewArticle.tags.map((tag, i) => (
                      <span key={i} style={{ background: "#eee", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", color: "#555" }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="preview-footer">
              <button
                className="btn btn-secondary btn-compact"
                onClick={() => setPreviewArticle(null)}
                disabled={isPending}
              >
                বন্ধ করুন
              </button>
              <button
                className="btn btn-secondary btn-compact"
                onClick={() => handleReject(previewArticle.id)}
                disabled={isPending}
              >
                <i className="fas fa-undo"></i> ড্রাফটে ফেরত পাঠান
              </button>
              <button
                className="btn btn-primary btn-compact"
                onClick={() => handleApprove(previewArticle.id)}
                disabled={isPending}
              >
                <i className="fas fa-check"></i> অনুমোদন ও প্রকাশ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .action-buttons-group {
          display: inline-flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }
        .action-buttons-group .btn {
          padding: 6px 12px !important;
          font-size: 12px !important;
          border-radius: 6px !important;
          font-weight: 500 !important;
          height: auto !important;
          line-height: 1.5 !important;
          box-shadow: none !important;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
        }
        .btn-view {
          background: rgba(13, 122, 62, 0.1) !important;
          color: var(--primary) !important;
          border: 1px solid rgba(13, 122, 62, 0.15) !important;
        }
        .btn-view:hover {
          background: var(--primary) !important;
          color: #fff !important;
          transform: translateY(-1px);
        }
        .btn-approve {
          background: var(--primary) !important;
          color: #fff !important;
          border: 1px solid var(--primary) !important;
        }
        .btn-approve:hover {
          background: var(--primary-dark, #0b5e30) !important;
          color: #fff !important;
          transform: translateY(-1px);
        }
        .btn-reject {
          background: #f0f2f5 !important;
          color: #333 !important;
          border: 1px solid #ddd !important;
        }
        .btn-reject:hover {
          background: #e4e6eb !important;
          transform: translateY(-1px);
        }
        .preview-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }
        .preview-content {
          background: white;
          border-radius: 12px;
          width: 100%;
          max-width: 800px;
          height: 100%;
          max-height: 85vh;
          box-shadow: 0 10px 30px rgba(0,0,0,0.25);
          display: flex;
          flex-direction: column;
          animation: slideUp 0.25s ease-out;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .preview-header {
          padding: 24px;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .category-badge {
          background: var(--primary-light, #e8f5e9);
          color: var(--primary-dark, #0d7a3e);
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          display: inline-block;
          margin-bottom: 8px;
        }
        .preview-header h2 {
          margin: 0;
          font-size: 1.5rem;
          color: var(--text-dark, #333);
          line-height: 1.3;
        }
        .close-btn {
          background: none;
          border: none;
          font-size: 2rem;
          cursor: pointer;
          color: #999;
          line-height: 0.8;
          padding: 0;
        }
        .close-btn:hover {
          color: #e74c3c;
        }
        .preview-body {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
        }
        .preview-footer {
          padding: 20px 24px;
          border-top: 1px solid #eee;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          background: #fafafa;
          border-bottom-left-radius: 12px;
          border-bottom-right-radius: 12px;
          flex-wrap: wrap;
        }
        .btn-secondary {
          background: #f5f5f5;
          color: #444 !important;
          border: 1px solid #ddd;
        }
        .btn-secondary:hover {
          background: #e8e8e8;
        }
      `}</style>
    </>
  );
}
