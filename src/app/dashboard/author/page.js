"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import ArticleEditor from "@/components/dashboard/ArticleEditor";

export default function AuthorDashboard() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingArticle, setEditingArticle] = useState(null); // null = list view, {} = new, {id:...} = edit
  const [showEditor, setShowEditor] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [stats, setStats] = useState({
    published: 0,
    drafts: 0,
    review: 0,
    totalViews: 0,
  });

  const supabase = createClient();

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("articles")
      .select("*, categories(name)")
      .eq("author_id", user.id)
      .order("updated_at", { ascending: false });

    if (!error && data) {
      setArticles(data);
      setStats({
        published: data.filter((a) => a.status === "published").length,
        drafts: data.filter((a) => a.status === "draft").length,
        review: data.filter((a) => a.status === "review").length,
        totalViews: data.reduce((sum, a) => sum + (a.views || 0), 0),
      });
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleDelete = async (id) => {
    const { error } = await supabase.from("articles").delete().eq("id", id);
    if (!error) {
      setDeleteConfirm(null);
      fetchArticles();
    }
  };

  const handleSave = () => {
    setShowEditor(false);
    setEditingArticle(null);
    fetchArticles();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "আজ";
    if (diffDays === 1) return "গতকাল";
    if (diffDays < 7) return `${diffDays} দিন আগে`;
    return d.toLocaleDateString("bn-BD", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const statusLabel = {
    published: { text: "Published", class: "status-published" },
    draft: { text: "Draft", class: "status-draft" },
    review: { text: "In Review", class: "status-review" },
  };

  // Show editor view
  if (showEditor) {
    return (
      <ArticleEditor
        article={editingArticle}
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
          <h1>Author Dashboard</h1>
          <div className="breadcrumb">
            <a href="/dashboard">Dashboard</a> / Author Panel
          </div>
        </div>
        <button
          className="btn btn-primary btn-compact"
          onClick={() => {
            setEditingArticle(null);
            setShowEditor(true);
          }}
        >
          <i className="fas fa-pen"></i> Write New Article
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stat-cards">
        <div className="stat-card primary">
          <div className="stat-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-info">
            <h3>{stats.published}</h3>
            <p>Published Articles</p>
          </div>
        </div>

        <div className="stat-card accent">
          <div className="stat-icon">
            <i className="fas fa-file-signature"></i>
          </div>
          <div className="stat-info">
            <h3>{stats.drafts}</h3>
            <p>Drafts</p>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-info">
            <h3>{stats.review}</h3>
            <p>Pending Review</p>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: "4px solid #9b59b6" }}>
          <div className="stat-icon" style={{ background: "rgba(155,89,182,0.12)", color: "#9b59b6" }}>
            <i className="fas fa-eye"></i>
          </div>
          <div className="stat-info">
            <h3>{stats.totalViews.toLocaleString("bn-BD")}</h3>
            <p>Total Views</p>
          </div>
        </div>
      </div>

      {/* Articles Table */}
      <div className="dashboard-panel">
        <div className="panel-header">
          <h2>My Articles</h2>
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#999" }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: "24px" }} />
              <p style={{ marginTop: "12px" }}>লোড হচ্ছে...</p>
            </div>
          ) : articles.length === 0 ? (
            <div style={{ padding: "60px 40px", textAlign: "center" }}>
              <i
                className="fas fa-feather-alt"
                style={{ fontSize: "48px", color: "#ddd", marginBottom: "16px", display: "block" }}
              />
              <h3 style={{ color: "#999", fontWeight: 500, marginBottom: "8px" }}>
                এখনও কোনো আর্টিকেল নেই
              </h3>
              <p style={{ color: "#bbb", fontSize: "14px", marginBottom: "20px" }}>
                আপনার প্রথম আর্টিকেল লিখুন এবং পাঠকদের সাথে জ্ঞান শেয়ার করুন
              </p>
              <button
                className="btn btn-primary btn-compact"
                onClick={() => {
                  setEditingArticle(null);
                  setShowEditor(true);
                }}
              >
                <i className="fas fa-pen" /> আর্টিকেল লিখুন
              </button>
            </div>
          ) : (
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Views</th>
                  <th>Last Modified</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((article) => (
                  <tr key={article.id}>
                    <td>
                      <strong>{article.title}</strong>
                    </td>
                    <td>{article.categories?.name || "—"}</td>
                    <td>
                      <span
                        className={`status-badge ${
                          statusLabel[article.status]?.class || ""
                        }`}
                      >
                        {statusLabel[article.status]?.text || article.status}
                      </span>
                    </td>
                    <td>{(article.views || 0).toLocaleString()}</td>
                    <td>{formatDate(article.updated_at)}</td>
                    <td>
                      {article.status === "published" && (
                        <a
                          href={`/articles/${article.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="action-btn action-view"
                          title="দেখুন"
                        >
                          <i className="fas fa-eye"></i>
                        </a>
                      )}
                      <button
                        className="action-btn action-edit"
                        title="সম্পাদনা"
                        onClick={() => {
                          setEditingArticle(article);
                          setShowEditor(true);
                        }}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      {deleteConfirm === article.id ? (
                        <>
                          <button
                            className="action-btn"
                            style={{
                              background: "#e74c3c",
                              color: "#fff",
                              borderRadius: "6px",
                              padding: "4px 10px",
                              fontSize: "12px",
                            }}
                            onClick={() => handleDelete(article.id)}
                          >
                            নিশ্চিত
                          </button>
                          <button
                            className="action-btn"
                            style={{
                              background: "#eee",
                              borderRadius: "6px",
                              padding: "4px 10px",
                              fontSize: "12px",
                            }}
                            onClick={() => setDeleteConfirm(null)}
                          >
                            বাতিল
                          </button>
                        </>
                      ) : (
                        <button
                          className="action-btn action-delete"
                          title="মুছুন"
                          onClick={() => setDeleteConfirm(article.id)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
    </>
  );
}
