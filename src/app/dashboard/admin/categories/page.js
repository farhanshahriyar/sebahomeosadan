"use client";
import { useState, useEffect, useCallback, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import CategoryModal from "@/components/dashboard/CategoryModal";
import { toggleCategoryAction, deleteCategoryAction } from "./actions";

export default function CategoriesAdminPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isPending, startTransition] = useTransition();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filteredCategories = categories.filter((cat) => {
    const matchesSearch =
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cat.slug && cat.slug.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cat.description && cat.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && cat.is_active) ||
      (statusFilter === "inactive" && !cat.is_active);

    const matchesType =
      typeFilter === "all" ||
      (typeFilter === "subject" && !cat.parent_id) ||
      (typeFilter === "topic" && cat.parent_id);

    return matchesSearch && matchesStatus && matchesType;
  });

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

  // 2. Fetch Categories
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (!error && data) {
      setCategories(data);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (!authChecking) {
      fetchCategories();
    }
  }, [authChecking, fetchCategories]);

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

  // Actions
  const handleToggleActive = (id, currentActive) => {
    startTransition(async () => {
      const res = await toggleCategoryAction(id, currentActive);
      if (res?.error) {
        alert(res.error);
      } else {
        fetchCategories();
      }
    });
  };

  const handleDelete = async (id) => {
    const res = await deleteCategoryAction(id);
    if (res?.error) {
      alert(res.error);
    } else {
      setDeleteConfirm(null);
      fetchCategories();
    }
  };

  const handleModalClose = (shouldRefresh) => {
    setModalOpen(false);
    setEditingCategory(null);
    if (shouldRefresh) {
      fetchCategories();
    }
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
          <h1>ক্যাটাগরি ব্যবস্থাপনা (Manage Categories)</h1>
          <div className="breadcrumb">
            <a href="/dashboard">Dashboard</a> / <a href="/dashboard/admin">Admin</a> / Categories
          </div>
        </div>
        <button
          className="btn btn-primary btn-compact"
          onClick={() => {
            setEditingCategory(null);
            setModalOpen(true);
          }}
        >
          <i className="fas fa-plus"></i> নতুন ক্যাটাগরি
        </button>
      </div>

      <div className="dashboard-panel">
        <div className="panel-header">
          <h2>ক্যাটাগরি তালিকা</h2>
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#999" }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: "24px" }} />
              <p style={{ marginTop: "12px" }}>লোড হচ্ছে...</p>
            </div>
          ) : categories.length === 0 ? (
            <div style={{ padding: "60px 40px", textAlign: "center" }}>
              <i className="fas fa-tags" style={{ fontSize: "48px", color: "#ddd", marginBottom: "16px", display: "block" }} />
              <h3 style={{ color: "#999", fontWeight: 500, marginBottom: "8px" }}>কোনো ক্যাটাগরি তৈরি করা হয়নি</h3>
              <p style={{ color: "#bbb", fontSize: "14px", marginBottom: "20px" }}>আর্টিকেল সাজানোর জন্য নতুন ক্যাটাগরি যুক্ত করুন।</p>
              <button
                className="btn btn-primary btn-compact"
                onClick={() => {
                  setEditingCategory(null);
                  setModalOpen(true);
                }}
              >
                ক্যাটাগরি যুক্ত করুন
              </button>
            </div>
          ) : (
            <>
              {/* Search and Filters Bar */}
              <div className="filter-bar" style={{ display: "flex", gap: "16px", padding: "16px 20px", background: "#f8f9fa", borderBottom: "1px solid #eee", alignItems: "center", flexWrap: "wrap" }}>
                {/* Search */}
                <div style={{ flex: 1, minWidth: "240px", position: "relative" }}>
                  <i className="fas fa-search" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#888", fontSize: "14px" }} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleLocalSearchChange(e.target.value)}
                    placeholder="নাম, স্লাগ বা বিবরণ দিয়ে খুঁজুন..."
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
                      <option value="active">Active (সক্রিয়)</option>
                      <option value="inactive">Inactive (নিষ্ক্রিয়/পেন্ডিং)</option>
                    </select>
                  </div>

                  {/* Type filter */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#555", whiteSpace: "nowrap" }}>প্রকার (Type):</label>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
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
                      <option value="all">সব টাইপ</option>
                      <option value="subject">প্রধান বিষয় (Subject)</option>
                      <option value="topic">টপিক (Topic)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Categories Table or Empty Match View */}
              {filteredCategories.length === 0 ? (
                <div style={{ padding: "60px 40px", textAlign: "center", color: "#999" }}>
                  <i className="fas fa-search" style={{ fontSize: "40px", color: "#ddd", marginBottom: "16px", display: "block" }} />
                  <h3 style={{ color: "#888", fontWeight: 500, marginBottom: "8px" }}>কোনো মিল পাওয়া যায়নি</h3>
                  <p style={{ color: "#bbb", fontSize: "14px", margin: 0 }}>আপনার ফিল্টার বা খোঁজা শব্দের সাথে কোনো ক্যাটাগরি মিলছে না।</p>
                </div>
              ) : (
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>ক্রম (Sort)</th>
                      <th>নাম (Name)</th>
                      <th>প্রকার (Type/Parent)</th>
                      <th>স্লাগ (Slug)</th>
                      <th>বর্ণনা (Description)</th>
                      <th>অবস্থা (Status)</th>
                      <th>অ্যাকশন (Actions)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.map((cat) => (
                      <tr key={cat.id}>
                        <td>
                          <span style={{ background: "#e8f5e9", color: "var(--primary-dark)", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "600" }}>
                            {cat.sort_order}
                          </span>
                        </td>
                        <td><strong>{cat.name}</strong></td>
                        <td>
                          {cat.parent_id ? (
                            <span style={{ fontSize: "12px", background: "#fff3cd", color: "#856404", padding: "4px 8px", borderRadius: "4px", fontWeight: "500" }}>
                              টপিক (অভিভাবক: {categories.find(p => p.id === cat.parent_id)?.name || "অজানা"})
                            </span>
                          ) : (
                            <span style={{ fontSize: "12px", background: "#cce5ff", color: "#004085", padding: "4px 8px", borderRadius: "4px", fontWeight: "500" }}>
                              প্রধান বিষয় (Subject)
                            </span>
                          )}
                        </td>
                        <td style={{ fontFamily: "monospace", fontSize: "13px" }}>{cat.slug}</td>
                        <td style={{ color: "#666", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {cat.description || "—"}
                        </td>
                        <td>
                          <button
                            onClick={() => handleToggleActive(cat.id, cat.is_active)}
                            disabled={isPending}
                            className={`status-badge ${cat.is_active ? "status-published" : "status-draft"}`}
                            style={{ border: "none", cursor: "pointer", padding: "6px 12px", fontWeight: "500" }}
                            title="অবস্থা পরিবর্তন করতে ক্লিক করুন"
                          >
                            {cat.is_active ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td>
                          <button
                            className="action-btn action-edit"
                            title="সম্পাদনা"
                            style={{ marginRight: "8px" }}
                            onClick={() => {
                              setEditingCategory(cat);
                              setModalOpen(true);
                            }}
                          >
                            <i className="fas fa-edit"></i>
                          </button>

                          {deleteConfirm === cat.id ? (
                            <div style={{ display: "inline-flex", gap: "6px" }}>
                              <button
                                className="action-btn"
                                style={{ background: "#e74c3c", color: "#fff", borderRadius: "6px", padding: "4px 10px", fontSize: "12px", border: "none", cursor: "pointer" }}
                                onClick={() => handleDelete(cat.id)}
                              >
                                নিশ্চিত
                              </button>
                              <button
                                className="action-btn"
                                style={{ background: "#eee", borderRadius: "6px", padding: "4px 10px", fontSize: "12px", border: "none", cursor: "pointer" }}
                                onClick={() => setDeleteConfirm(null)}
                              >
                                বাতিল
                              </button>
                            </div>
                          ) : (
                            <button
                              className="action-btn action-delete"
                              title="মুছুন"
                              onClick={() => setDeleteConfirm(cat.id)}
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

      {modalOpen && (
        <CategoryModal
          category={editingCategory}
          onClose={handleModalClose}
        />
      )}
    </>
  );
}
