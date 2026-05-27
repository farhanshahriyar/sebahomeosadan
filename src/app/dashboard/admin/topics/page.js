"use client";
import { useState, useEffect, useCallback, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import TopicModal from "@/components/dashboard/TopicModal";
import { approveTopicAction, deleteTopicAction } from "./actions";

export default function TopicsAdminPage() {
  const [categories, setCategories] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isPending, startTransition] = useTransition();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");

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

  // 2. Fetch Topics and Profiles
  const fetchTopicsAndProfiles = useCallback(async () => {
    setLoading(true);
    
    // Fetch categories
    const { data: catData, error: catError } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    // Fetch profiles (for identifying who suggested the topic)
    const { data: profData, error: profError } = await supabase
      .from("profiles")
      .select("id, full_name");

    if (!catError && catData) {
      setCategories(catData);
    }
    if (!profError && profData) {
      setProfiles(profData);
    }
    
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (!authChecking) {
      fetchTopicsAndProfiles();
    }
  }, [authChecking, fetchTopicsAndProfiles]);

  // Derive subjects (parent_id is null) and topics (parent_id is not null)
  const subjects = categories.filter((c) => !c.parent_id);
  const topics = categories.filter((c) => c.parent_id);

  // Stats
  const totalTopicsCount = topics.length;
  const pendingTopicsCount = topics.filter((t) => !t.is_active).length;
  const activeTopicsCount = topics.filter((t) => t.is_active).length;

  // Filter topics
  const filteredTopics = topics.filter((topic) => {
    const parentName = subjects.find((s) => s.id === topic.parent_id)?.name || "";
    const creatorProfile = profiles.find((p) => p.id === topic.created_by);
    const creatorName = creatorProfile?.full_name || "অজানা লেখক";

    const matchesSearch =
      topic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (topic.slug && topic.slug.toLowerCase().includes(searchTerm.toLowerCase())) ||
      parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      creatorName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && topic.is_active) ||
      (statusFilter === "pending" && !topic.is_active);

    const matchesSubject =
      subjectFilter === "all" ||
      topic.parent_id === subjectFilter;

    return matchesSearch && matchesStatus && matchesSubject;
  });

  // Actions
  const handleApprove = (id) => {
    startTransition(async () => {
      const res = await approveTopicAction(id);
      if (res?.error) {
        alert(res.error);
      } else {
        fetchTopicsAndProfiles();
      }
    });
  };

  const handleDelete = async (id) => {
    const res = await deleteTopicAction(id);
    if (res?.error) {
      alert(res.error);
    } else {
      setDeleteConfirm(null);
      fetchTopicsAndProfiles();
    }
  };

  const handleModalClose = (shouldRefresh) => {
    setModalOpen(false);
    setEditingTopic(null);
    if (shouldRefresh) {
      fetchTopicsAndProfiles();
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
          <h1>টপিক ব্যবস্থাপনা (Manage Topics)</h1>
          <div className="breadcrumb">
            <a href="/dashboard">Dashboard</a> / <a href="/dashboard/admin">Admin</a> / Topics
          </div>
        </div>
        <button
          className="btn btn-primary btn-compact"
          onClick={() => {
            setEditingTopic(null);
            setModalOpen(true);
          }}
        >
          <i className="fas fa-plus"></i> নতুন টপিক তৈরি
        </button>
      </div>

      {/* Stats row */}
      <div className="stat-cards" style={{ marginBottom: "24px" }}>
        <div className="stat-card primary">
          <div className="stat-icon">
            <i className="fas fa-tags"></i>
          </div>
          <div className="stat-info">
            <h3>{totalTopicsCount}</h3>
            <p>মোট টপিক</p>
          </div>
        </div>
        
        <div className="stat-card info">
          <div className="stat-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-info">
            <h3>{activeTopicsCount}</h3>
            <p>সক্রিয় টপিক</p>
          </div>
        </div>

        <div className={`stat-card ${pendingTopicsCount > 0 ? 'danger' : 'accent'}`}>
          <div className="stat-icon">
            <i className="fas fa-hourglass-half"></i>
          </div>
          <div className="stat-info">
            <h3>{pendingTopicsCount}</h3>
            <p>অনুমোদন পেন্ডিং</p>
          </div>
        </div>
      </div>

      <div className="dashboard-panel">
        <div className="panel-header">
          <h2>টপিক তালিকা</h2>
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#999" }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: "24px" }} />
              <p style={{ marginTop: "12px" }}>লোড হচ্ছে...</p>
            </div>
          ) : topics.length === 0 ? (
            <div style={{ padding: "60px 40px", textAlign: "center" }}>
              <i className="fas fa-tags" style={{ fontSize: "48px", color: "#ddd", marginBottom: "16px", display: "block" }} />
              <h3 style={{ color: "#999", fontWeight: 500, marginBottom: "8px" }}>কোনো টপিক তৈরি করা হয়নি</h3>
              <p style={{ color: "#bbb", fontSize: "14px", marginBottom: "20px" }}>আর্টিকেল সাজানোর জন্য নতুন টপিক যুক্ত করুন।</p>
              <button
                className="btn btn-primary btn-compact"
                onClick={() => {
                  setEditingTopic(null);
                  setModalOpen(true);
                }}
              >
                টপিক যুক্ত করুন
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
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="টপিকের নাম, স্লাগ বা লেখকের নাম দিয়ে খুঁজুন..."
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
                      <option value="pending">Pending Approval (পেন্ডিং)</option>
                    </select>
                  </div>

                  {/* Subject Filter */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#555", whiteSpace: "nowrap" }}>বিষয় (Subject):</label>
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

              {/* Topics Table */}
              {filteredTopics.length === 0 ? (
                <div style={{ padding: "60px 40px", textAlign: "center", color: "#999" }}>
                  <i className="fas fa-search" style={{ fontSize: "40px", color: "#ddd", marginBottom: "16px", display: "block" }} />
                  <h3 style={{ color: "#888", fontWeight: 500, marginBottom: "8px" }}>কোনো মিল পাওয়া যায়নি</h3>
                  <p style={{ color: "#bbb", fontSize: "14px", margin: 0 }}>আপনার ফিল্টার বা খোঁজা শব্দের সাথে কোনো টপিক মিলছে না।</p>
                </div>
              ) : (
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>ক্রম (Sort)</th>
                      <th>নাম (Name)</th>
                      <th>অভিভাবক বিষয় (Parent Subject)</th>
                      <th>স্লাগ (Slug)</th>
                      <th>প্রস্তাবকারী (Suggested By)</th>
                      <th>অবস্থা (Status)</th>
                      <th>অ্যাকশন (Actions)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTopics.map((topic) => {
                      const parent = subjects.find((s) => s.id === topic.parent_id);
                      const creator = profiles.find((p) => p.id === topic.created_by);
                      
                      return (
                        <tr key={topic.id}>
                          <td>
                            <span style={{ background: "#e8f5e9", color: "var(--primary-dark)", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "600" }}>
                              {topic.sort_order}
                            </span>
                          </td>
                          <td><strong>{topic.name}</strong></td>
                          <td>
                            <span style={{ fontSize: "12px", background: "#cce5ff", color: "#004085", padding: "4px 8px", borderRadius: "4px", fontWeight: "500" }}>
                              {parent?.name || "অজানা"}
                            </span>
                          </td>
                          <td style={{ fontFamily: "monospace", fontSize: "13px" }}>{topic.slug}</td>
                          <td>{creator?.full_name || "Admin"}</td>
                          <td>
                            <span className={`status-badge ${topic.is_active ? "status-published" : "status-draft"}`}>
                              {topic.is_active ? "Active" : "Pending Approval"}
                            </span>
                          </td>
                          <td>
                            {!topic.is_active && (
                              <button
                                className="action-btn action-view"
                                title="অনুমোদন করুন"
                                style={{ marginRight: "8px" }}
                                onClick={() => handleApprove(topic.id)}
                                disabled={isPending}
                              >
                                <i className="fas fa-check"></i>
                              </button>
                            )}
                            <button
                              className="action-btn action-edit"
                              title="সম্পাদনা"
                              style={{ marginRight: "8px" }}
                              onClick={() => {
                                setEditingTopic(topic);
                                setModalOpen(true);
                              }}
                            >
                              <i className="fas fa-edit"></i>
                            </button>

                            {deleteConfirm === topic.id ? (
                              <div style={{ display: "inline-flex", gap: "6px" }}>
                                <button
                                  className="action-btn"
                                  style={{ background: "#e74c3c", color: "#fff", borderRadius: "6px", padding: "4px 10px", fontSize: "12px", border: "none", cursor: "pointer" }}
                                  onClick={() => handleDelete(topic.id)}
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
                                onClick={() => setDeleteConfirm(topic.id)}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>

      {modalOpen && (
        <TopicModal
          topic={editingTopic}
          onClose={handleModalClose}
        />
      )}
    </>
  );
}
