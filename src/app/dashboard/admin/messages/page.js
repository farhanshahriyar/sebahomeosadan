"use client";
import { useState, useEffect, useCallback, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { toggleMessageReadAction, deleteMessageAction, markAllMessagesReadAction } from "./actions";

export default function MessagesAdminPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isPending, startTransition] = useTransition();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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

  // 2. Fetch Messages
  const fetchMessages = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setMessages(data);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (!authChecking) {
      fetchMessages();
    }
  }, [authChecking, fetchMessages]);

  // Search & Sync logic
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
  const handleToggleRead = (id, currentRead) => {
    startTransition(async () => {
      const res = await toggleMessageReadAction(id, currentRead);
      if (res?.error) {
        alert(res.error);
      } else {
        // Sync selected message status if it is currently open
        if (selectedMessage && selectedMessage.id === id) {
          setSelectedMessage(prev => ({ ...prev, is_read: !currentRead }));
        }
        fetchMessages();
      }
    });
  };

  const handleDelete = async (id) => {
    const res = await deleteMessageAction(id);
    if (res?.error) {
      alert(res.error);
    } else {
      setDeleteConfirm(null);
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage(null);
      }
      fetchMessages();
    }
  };

  const handleMarkAllRead = () => {
    if (!confirm("আপনি কি নিশ্চিত যে সকল মেসেজ পঠিত হিসেবে চিহ্নিত করতে চান?")) return;
    startTransition(async () => {
      const res = await markAllMessagesReadAction();
      if (res?.error) {
        alert(res.error);
      } else {
        fetchMessages();
      }
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleString("bn-BD", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Filter messages
  const filteredMessages = messages.filter((msg) => {
    const matchesSearch =
      msg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (msg.subject && msg.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
      msg.message.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "unread" && !msg.is_read) ||
      (statusFilter === "read" && msg.is_read);

    return matchesSearch && matchesStatus;
  });

  const unreadCount = messages.filter((m) => !m.is_read).length;

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
          <h1>মেসেজ ব্যবস্থাপনা (Manage Messages)</h1>
          <div className="breadcrumb">
            <a href="/dashboard">Dashboard</a> / <a href="/dashboard/admin">Admin</a> / Messages
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            className="btn btn-secondary btn-compact"
            onClick={handleMarkAllRead}
            disabled={isPending}
          >
            <i className="fas fa-check-double"></i> সব পঠিত চিহ্নিত করুন
          </button>
        )}
      </div>

      <div className="stat-cards">
        <div className="stat-card primary">
          <div className="stat-icon">
            <i className="fas fa-envelope"></i>
          </div>
          <div className="stat-info">
            <h3>{messages.length}</h3>
            <p>Total Messages</p>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon">
            <i className="fas fa-envelope-open-text" style={{ color: "#3498db" }}></i>
          </div>
          <div className="stat-info">
            <h3>{unreadCount}</h3>
            <p>Unread Messages</p>
          </div>
        </div>

        <div className="stat-card accent">
          <div className="stat-icon">
            <i className="fas fa-envelope-open" style={{ color: "var(--accent)" }}></i>
          </div>
          <div className="stat-info">
            <h3>{messages.length - unreadCount}</h3>
            <p>Read Messages</p>
          </div>
        </div>
      </div>

      <div className="dashboard-panel">
        <div className="panel-header">
          <h2>যোগাযোগ মেসেজ তালিকা</h2>
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#999" }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: "24px" }} />
              <p style={{ marginTop: "12px" }}>লোড হচ্ছে...</p>
            </div>
          ) : messages.length === 0 ? (
            <div style={{ padding: "60px 40px", textAlign: "center" }}>
              <i className="fas fa-envelope-open-text" style={{ fontSize: "48px", color: "#ddd", marginBottom: "16px", display: "block" }} />
              <h3 style={{ color: "#999", fontWeight: 500, marginBottom: "8px" }}>কোনো মেসেজ পাওয়া যায়নি</h3>
              <p style={{ color: "#bbb", fontSize: "14px", margin: 0 }}>পাঠকরা যোগাযোগ করার পর সব মেসেজ এখানে দেখতে পাবেন।</p>
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
                    placeholder="নাম, ইমেইল, বিষয় বা মেসেজ দিয়ে খুঁজুন..."
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
                      <option value="all">সব মেসেজ</option>
                      <option value="unread">Unread (অপঠিত)</option>
                      <option value="read">Read (পঠিত)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Messages Table or Empty Match View */}
              {filteredMessages.length === 0 ? (
                <div style={{ padding: "60px 40px", textAlign: "center", color: "#999" }}>
                  <i className="fas fa-search" style={{ fontSize: "40px", color: "#ddd", marginBottom: "16px", display: "block" }} />
                  <h3 style={{ color: "#888", fontWeight: 500, marginBottom: "8px" }}>কোনো মিল পাওয়া যায়নি</h3>
                  <p style={{ color: "#bbb", fontSize: "14px", margin: 0 }}>আপনার ফিল্টার বা খোঁজা শব্দের সাথে কোনো মেসেজ মিলছে না।</p>
                </div>
              ) : (
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th style={{ width: "150px" }}>প্রেরক (Sender)</th>
                      <th style={{ width: "200px" }}>বিষয় (Subject)</th>
                      <th>মেসেজ (Message)</th>
                      <th style={{ width: "160px" }}>তারিখ (Date)</th>
                      <th style={{ width: "120px" }}>অবস্থা (Status)</th>
                      <th style={{ width: "160px" }}>অ্যাকশন (Actions)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMessages.map((msg) => (
                      <tr 
                        key={msg.id} 
                        style={{ 
                          backgroundColor: msg.is_read ? "transparent" : "#fdf8f4",
                          fontWeight: msg.is_read ? "normal" : "600"
                        }}
                      >
                        <td>
                          <div>{msg.name}</div>
                          <div style={{ fontSize: "11px", color: "#888", fontWeight: "normal" }}>{msg.email}</div>
                        </td>
                        <td>{msg.subject || "বিষয় নেই"}</td>
                        <td style={{ color: "#666", maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {msg.message}
                        </td>
                        <td style={{ fontSize: "12px", color: "#777" }}>
                          {formatDate(msg.created_at)}
                        </td>
                        <td>
                          <button
                            onClick={() => handleToggleRead(msg.id, msg.is_read)}
                            disabled={isPending}
                            className={`status-badge ${msg.is_read ? "status-published" : "status-draft"}`}
                            style={{ border: "none", cursor: "pointer", padding: "6px 12px", fontWeight: "500" }}
                            title="পঠিত/অপঠিত পরিবর্তন করতে ক্লিক করুন"
                          >
                            {msg.is_read ? "Read" : "Unread"}
                          </button>
                        </td>
                        <td>
                          <button
                            className="action-btn action-view"
                            title="বিস্তারিত দেখুন"
                            style={{ marginRight: "8px" }}
                            onClick={() => {
                              setSelectedMessage(msg);
                              if (!msg.is_read) {
                                handleToggleRead(msg.id, false); // auto mark read when opening
                              }
                            }}
                          >
                            <i className="fas fa-eye"></i>
                          </button>

                          {deleteConfirm === msg.id ? (
                            <div style={{ display: "inline-flex", gap: "6px" }}>
                              <button
                                className="action-btn"
                                style={{ background: "#e74c3c", color: "#fff", borderRadius: "6px", padding: "4px 10px", fontSize: "12px", border: "none", cursor: "pointer" }}
                                onClick={() => handleDelete(msg.id)}
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
                              onClick={() => setDeleteConfirm(msg.id)}
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

      {/* Message View Modal Overlay */}
      {selectedMessage && (
        <div className="modal-overlay" style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 11000
        }}>
          <div className="modal-content" style={{
            background: "white", padding: "30px", borderRadius: "12px",
            width: "100%", maxWidth: "550px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            color: "#333", position: "relative"
          }}>
            <div className="modal-header" style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              borderBottom: "1px solid #eee", paddingBottom: "10px", marginBottom: "15px"
            }}>
              <h2 style={{ margin: 0, fontSize: "1.3rem", color: "var(--primary-dark)" }}>বার্তা বিবরণ (Message Details)</h2>
              <button 
                className="close-btn" 
                style={{ background: "none", border: "none", fontSize: "1.6rem", cursor: "pointer", color: "#666" }}
                onClick={() => setSelectedMessage(null)}
              >
                &times;
              </button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px" }}>
              <div><strong>প্রেরক (From):</strong> {selectedMessage.name} ({selectedMessage.email})</div>
              <div><strong>বিষয় (Subject):</strong> {selectedMessage.subject || "কোনো বিষয় নেই"}</div>
              <div><strong>তারিখ (Date):</strong> {formatDate(selectedMessage.created_at)}</div>
              <div><strong>অবস্থা (Status):</strong> {selectedMessage.is_read ? "পঠিত (Read)" : "অপঠিত (Unread)"}</div>
              <div style={{
                background: "#f9f9f9", padding: "16px", borderRadius: "8px",
                border: "1px solid #eee", whiteSpace: "pre-wrap", marginTop: "8px",
                lineHeight: "1.6", fontSize: "14px"
              }}>
                {selectedMessage.message}
              </div>
            </div>

            <div className="modal-actions" style={{
              display: "flex", justifyContent: "space-between", gap: "10px",
              marginTop: "25px", borderTop: "1px solid #eee", paddingTop: "15px"
            }}>
              <button
                className="btn btn-secondary btn-compact"
                onClick={() => handleToggleRead(selectedMessage.id, selectedMessage.is_read)}
                style={{ fontSize: "13px" }}
              >
                {selectedMessage.is_read ? "অপঠিত হিসেবে চিহ্নিত করুন" : "পঠিত হিসেবে চিহ্নিত করুন"}
              </button>
              
              <div style={{ display: "flex", gap: "10px" }}>
                <button 
                  className="btn btn-secondary btn-compact"
                  onClick={() => {
                    if (confirm("বার্তাটি মুছে ফেলতে চান?")) {
                      handleDelete(selectedMessage.id);
                    }
                  }}
                  style={{ background: "#e74c3c", color: "white", border: "none", cursor: "pointer" }}
                >
                  <i className="fas fa-trash"></i> মুছুন
                </button>
                <a 
                  href={`mailto:${selectedMessage.email}?subject=RE: ${encodeURIComponent(selectedMessage.subject || "")}`}
                  className="btn btn-primary btn-compact"
                  style={{ textDecoration: "none" }}
                >
                  <i className="fas fa-reply"></i> উত্তর দিন
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
