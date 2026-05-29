"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import ArticleEditor from "@/components/dashboard/ArticleEditor";
import { revalidatePost } from "./actions";

export default function PostsPage() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("author");
  const [editingArticle, setEditingArticle] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");

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

    // Fetch user role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role || "author";
    setUserRole(role);

    // Fetch all categories for parent-child filter mapping
    const { data: categoryData } = await supabase
      .from("categories")
      .select("id, name, parent_id");
    if (categoryData) {
      setCategories(categoryData);
      setSubjects(categoryData.filter((c) => !c.parent_id));
    }

    // Query articles based on role
    const isAdmin = role === "admin" || role === "super_admin";
    let query = supabase.from("articles").select("*, categories(name)");
    
    if (!isAdmin) {
      query = query.eq("author_id", user.id);
    }

    const { data: articlesData, error } = await query.order("updated_at", { ascending: false });

    if (!error && articlesData) {
      setArticles(articlesData);
      setStats({
        published: articlesData.filter((a) => a.status === "published").length,
        drafts: articlesData.filter((a) => a.status === "draft").length,
        review: articlesData.filter((a) => a.status === "review").length,
        totalViews: articlesData.reduce((sum, a) => sum + (a.views || 0), 0),
      });
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // Sync search query parameter on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("search");
      if (q) {
        setSearchTerm(q);
        window.dispatchEvent(new CustomEvent("dashboard-search-sync", { detail: q }));
      }
    }
  }, []);

  // Listen to global topbar search events
  useEffect(() => {
    const handleGlobalSearch = (e) => {
      setSearchTerm(e.detail || "");
    };
    window.addEventListener("dashboard-search", handleGlobalSearch);
    return () => window.removeEventListener("dashboard-search", handleGlobalSearch);
  }, []);

  const handleLocalSearchChange = (val) => {
    setSearchTerm(val);
    window.dispatchEvent(new CustomEvent("dashboard-search-sync", { detail: val }));
  };

  const handleDelete = async (id) => {
    // Fetch the slug of the deleted article to revalidate it
    const { data: article } = await supabase
      .from("articles")
      .select("slug")
      .eq("id", id)
      .single();

    const { error } = await supabase.from("articles").delete().eq("id", id);
    if (!error) {
      setDeleteConfirm(null);
      fetchArticles();
      if (article?.slug) {
        await revalidatePost(article.slug);
      }
    }
  };

  const handleSave = async (savedArticle) => {
    setShowEditor(false);
    setEditingArticle(null);
    fetchArticles();
    if (savedArticle?.slug) {
      await revalidatePost(savedArticle.slug);
    }
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

  const isAdminView = userRole === "admin" || userRole === "super_admin";

  // Filter logic
  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (article.author_name && article.author_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (article.excerpt && article.excerpt.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" || article.status === statusFilter;

    // Matches if category is exactly the subject, or if it is a sub-category/topic of the subject
    const matchesSubject =
      subjectFilter === "all" ||
      article.category_id === subjectFilter ||
      (article.category_id && categories.find((c) => c.id === article.category_id)?.parent_id === subjectFilter);

    return matchesSearch && matchesStatus && matchesSubject;
  });

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
          <h1>{isAdminView ? "আর্টিকেল ব্যবস্থাপনা (All Posts)" : "আমার আর্টিকেলসমূহ (My Posts)"}</h1>
          <div className="breadcrumb">
            <a href="/dashboard">Dashboard</a> / Posts
          </div>
        </div>
        <button
          className="btn btn-primary btn-compact"
          onClick={() => {
            setEditingArticle(null);
            setShowEditor(true);
          }}
        >
          <i className="fas fa-pen"></i> আর্টিকেল লিখুন
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

      {/* Articles Table Panel */}
      <div className="dashboard-panel">
        <div className="panel-header">
          <h2>{isAdminView ? "সব পোস্ট তালিকা" : "আমার পোস্ট তালিকা"}</h2>
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
                কোনো আর্টিকেল পাওয়া যায়নি
              </h3>
              <p style={{ color: "#bbb", fontSize: "14px", marginBottom: "20px" }}>
                আপনার প্রথম আর্টিকেল লিখুন এবং পাঠকদের সাথে হোমিওপ্যাথি জ্ঞান শেয়ার করুন।
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
            <>
              {/* Search & Filter Bar */}
              <div className="filter-bar" style={{ display: "flex", gap: "16px", padding: "16px 20px", background: "#f8f9fa", borderBottom: "1px solid #eee", alignItems: "center", flexWrap: "wrap" }}>
                {/* Search */}
                <div style={{ flex: 1, minWidth: "240px", position: "relative" }}>
                  <i className="fas fa-search" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#888", fontSize: "14px" }} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleLocalSearchChange(e.target.value)}
                    placeholder="শিরোনাম, লেখক বা বিবরণ দিয়ে খুঁজুন..."
                    style={{
                      width: "100%",
                      padding: "10px 12px 10px 38px",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      fontSize: "14px",
                      outline: "none",
                      transition: "all 0.2s ease"
                    }}
                  />
                </div>

                {/* Filters */}
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                  {/* Status filter */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#555", whiteSpace: "nowrap" }}>অবস্থা (Status):</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      style={{
                        padding: "10px 14px",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        fontSize: "13px",
                        outline: "none",
                        backgroundColor: "#fff",
                        cursor: "pointer",
                        fontWeight: "500"
                      }}
                    >
                      <option value="all">সব অবস্থা</option>
                      <option value="draft">Draft (ড্রাফট)</option>
                      <option value="review">In Review (রিভিউ)</option>
                      <option value="published">Published (প্রকাশিত)</option>
                    </select>
                  </div>

                  {/* Subject filter */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#555", whiteSpace: "nowrap" }}>প্রধান বিষয় (Subject):</label>
                    <select
                      value={subjectFilter}
                      onChange={(e) => setSubjectFilter(e.target.value)}
                      style={{
                        padding: "10px 14px",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        fontSize: "13px",
                        outline: "none",
                        backgroundColor: "#fff",
                        cursor: "pointer",
                        fontWeight: "500"
                      }}
                    >
                      <option value="all">সব বিষয়</option>
                      {subjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {filteredArticles.length === 0 ? (
                <div style={{ padding: "60px 40px", textAlign: "center", color: "#999" }}>
                  <i className="fas fa-search" style={{ fontSize: "40px", color: "#ddd", marginBottom: "16px", display: "block" }} />
                  <h3 style={{ color: "#888", fontWeight: 500, marginBottom: "8px" }}>কোনো মিল পাওয়া যায়নি</h3>
                  <p style={{ color: "#bbb", fontSize: "14px", margin: 0 }}>আপনার ফিল্টার বা খোঁজা শব্দের সাথে কোনো আর্টিকেল মিলছে না।</p>
                </div>
              ) : (
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      {isAdminView && <th>Author</th>}
                      <th>Category</th>
                      <th>Status</th>
                      <th>Views</th>
                      <th>Last Modified</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredArticles.map((article) => (
                      <tr key={article.id}>
                        <td>
                          <strong>{article.title}</strong>
                        </td>
                        {isAdminView && <td>{article.author_name || "—"}</td>}
                        <td>{article.categories?.name || "—"}</td>
                        <td>
                          <span className={`status-badge ${statusLabel[article.status]?.class || ""}`}>
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
            </>
          )}
        </div>
      </div>
    </>
  );
}
