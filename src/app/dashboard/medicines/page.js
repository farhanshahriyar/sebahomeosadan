"use client";
import { useState, useEffect, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { saveMedicineAction, deleteMedicineAction } from "./actions";

export default function MedicinesAdminPage() {
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [dbError, setDbError] = useState(false);
  const [medicines, setMedicines] = useState([]);

  // Messages
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Search
  const [searchTerm, setSearchTerm] = useState("");

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formAllen, setFormAllen] = useState("");
  const [formRoerick, setFormRoerick] = useState("");
  const [formKent, setFormKent] = useState("");
  const [formNash, setFormNash] = useState("");
  const [formNote, setFormNote] = useState("");

  // Active tab in the modal
  const [activeFormTab, setActiveFormTab] = useState("allen");

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

      if (!profile?.role || !["author", "admin", "super_admin"].includes(profile.role)) {
        window.location.href = "/dashboard";
        return;
      }
      setAuthChecking(false);
    }
    checkAuth();
  }, [supabase]);

  // 2. Fetch Medicines
  const fetchMedicines = async () => {
    setLoading(true);
    setDbError(false);
    try {
      const { data, error } = await supabase
        .from("medicines")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        if (error.code === "P0001" || error.message?.includes("relation") || error.message?.includes("does not exist") || error.code === "42P01") {
          setDbError(true);
        } else {
          setErrorMsg("ডেটা লোড করতে সমস্যা হয়েছে: " + error.message);
        }
      } else {
        setMedicines(data || []);
      }
    } catch (err) {
      console.error(err);
      setDbError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authChecking) {
      fetchMedicines();
    }
  }, [authChecking]);

  // Listen to topbar search
  useEffect(() => {
    const handleGlobalSearch = (e) => {
      setSearchTerm(e.detail || "");
    };
    window.addEventListener("dashboard-search", handleGlobalSearch);
    return () => window.removeEventListener("dashboard-search", handleGlobalSearch);
  }, []);

  // Auto-generate slug from name
  const autoGenerateSlug = (name) => {
    const bracketMatch = name.match(/\[([^\]]+)\]/);
    const base = bracketMatch ? bracketMatch[1] : name;
    return base
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  // Handle Add Click
  const handleAdd = () => {
    setEditingId(null);
    setFormName("");
    setFormSlug("");
    setFormAllen("");
    setFormRoerick("");
    setFormKent("");
    setFormNash("");
    setFormNote("");
    setActiveFormTab("allen");
    setErrorMsg("");
    setSuccessMsg("");
    setIsModalOpen(true);
  };

  // Handle Edit Click
  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormName(item.name);
    setFormSlug(item.slug);
    setFormAllen(item.content_allen || "");
    setFormRoerick(item.content_roerick || "");
    setFormKent(item.content_kent || "");
    setFormNash(item.content_nash || "");
    setFormNote(item.content_note || "");
    setActiveFormTab("allen");
    setErrorMsg("");
    setSuccessMsg("");
    setIsModalOpen(true);
  };

  // Handle Delete
  const handleDelete = async (id) => {
    if (!confirm("আপনি কি নিশ্চিত যে এই ওষুধটি মুছে ফেলতে চান?")) return;

    setSuccessMsg("");
    setErrorMsg("");

    startTransition(async () => {
      const res = await deleteMedicineAction(id);
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg("ওষুধটি সফলভাবে মুছে ফেলা হয়েছে!");
        fetchMedicines();
      }
    });
  };

  // Submit Modal Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const formData = new FormData();
    if (editingId) {
      formData.append("id", editingId);
    }
    formData.append("name", formName);
    formData.append("slug", formSlug);
    formData.append("content_allen", formAllen);
    formData.append("content_roerick", formRoerick);
    formData.append("content_kent", formKent);
    formData.append("content_nash", formNash);
    formData.append("content_note", formNote);

    startTransition(async () => {
      const res = await saveMedicineAction(formData);
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg(editingId ? "ওষুধ সফলভাবে আপডেট করা হয়েছে!" : "নতুন ওষুধ সফলভাবে যোগ করা হয়েছে!");
        setIsModalOpen(false);
        fetchMedicines();
      }
    });
  };

  // Count how many note fields are populated
  const countNotes = (med) => {
    let c = 0;
    if (med.content_allen) c++;
    if (med.content_roerick) c++;
    if (med.content_kent) c++;
    if (med.content_nash) c++;
    if (med.content_note) c++;
    return c;
  };

  // Filter medicines
  const filteredMedicines = medicines.filter((med) =>
    med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    med.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formTabs = [
    { key: "allen", label: "এলেন (Allen)" },
    { key: "roerick", label: "রোরিক (Roerick)" },
    { key: "kent", label: "কেন্ট (Kent)" },
    { key: "nash", label: "ন্যাশ (Nash)" },
    { key: "note", label: "নোট (Note)" },
  ];

  const getTabValue = (key) => {
    const map = { allen: formAllen, roerick: formRoerick, kent: formKent, nash: formNash, note: formNote };
    return map[key] || "";
  };

  const setTabValue = (key, val) => {
    const setters = { allen: setFormAllen, roerick: setFormRoerick, kent: setFormKent, nash: setFormNash, note: setFormNote };
    setters[key]?.(val);
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
          <h1>ওষুধ ব্যবস্থাপনা (Manage Medicines)</h1>
          <div className="breadcrumb">
            <a href="/dashboard">Dashboard</a> / Medicines
          </div>
        </div>

        <div className="dashboard-panel" style={{ borderLeft: "4px solid #e74c3c" }}>
          <div className="panel-header" style={{ color: "#e74c3c" }}>
            <h2><i className="fas fa-exclamation-triangle" style={{ marginRight: "10px" }} />ডাটাবেস টেবিল অনুপস্থিত (Table Missing)</h2>
          </div>
          <div className="panel-body" style={{ padding: "24px", lineHeight: "1.6" }}>
            <p style={{ marginBottom: "16px", fontSize: "15px", color: "#333" }}>
              ওষুধ সংরক্ষণ ও প্রদর্শন করার জন্য ডাটাবেসে <strong>medicines</strong> টেবিলটি এখনও তৈরি করা হয়নি।
            </p>
            <div style={{ background: "#fdf3f2", border: "1px solid #f5c6cb", padding: "16px", borderRadius: "8px", marginBottom: "20px" }}>
              <h4 style={{ color: "#721c24", marginBottom: "8px" }}>কী করতে হবে? (Steps to resolve):</h4>
              <ol style={{ paddingLeft: "20px", color: "#721c24", fontSize: "14px" }}>
                <li style={{ marginBottom: "6px" }}>প্রজেক্টের রুট ডিরেক্টরিতে থাকা <code>supabase-medicines.sql</code> ফাইলটি ওপেন করুন।</li>
                <li style={{ marginBottom: "6px" }}>ফাইলের কোডগুলো কপি করুন।</li>
                <li style={{ marginBottom: "6px" }}>আপনার <strong>Supabase Dashboard</strong>-এ গিয়ে <strong>SQL Editor</strong>-এ পেস্ট করে <strong>Run</strong> বাটনে ক্লিক করুন।</li>
                <li>রান হওয়ার পর এই পেজটি রিলোড (Reload) দিন।</li>
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
      <div className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1>ওষুধ ব্যবস্থাপনা (Medicines Management)</h1>
          <div className="breadcrumb">
            <a href="/dashboard">Dashboard</a> / Medicines
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleAdd} style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}>
          <i className="fas fa-plus-circle" /> নতুন ওষুধ যোগ করুন
        </button>
      </div>

      {/* Stats */}
      <div className="stat-cards">
        <div className="stat-card primary">
          <div className="stat-icon">
            <i className="fas fa-pills"></i>
          </div>
          <div className="stat-info">
            <h3>{medicines.length}</h3>
            <p>মোট ওষুধ (Total Medicines)</p>
          </div>
        </div>
        <div className="stat-card accent">
          <div className="stat-icon">
            <i className="fas fa-book-medical"></i>
          </div>
          <div className="stat-info">
            <h3>{medicines.filter(m => countNotes(m) > 0).length}</h3>
            <p>বিবরণসহ (With Notes)</p>
          </div>
        </div>
        <div className="stat-card info">
          <div className="stat-icon">
            <i className="fas fa-file-medical-alt"></i>
          </div>
          <div className="stat-info">
            <h3>{medicines.filter(m => countNotes(m) === 0).length}</h3>
            <p>বিবরণ ছাড়া (Without Notes)</p>
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
          <h2>ওষুধের তালিকা ({filteredMedicines.length})</h2>
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          {/* Search Bar */}
          <div style={{ padding: "16px 20px", background: "#f8f9fa", borderBottom: "1px solid #eee" }}>
            <div style={{ position: "relative", maxWidth: "400px" }}>
              <i className="fas fa-search" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#888", fontSize: "14px" }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ওষুধের নাম দিয়ে খুঁজুন..."
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 38px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none"
                }}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#999" }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: "24px", color: "var(--primary)" }} />
              <p style={{ marginTop: "12px" }}>লোড হচ্ছে...</p>
            </div>
          ) : filteredMedicines.length === 0 ? (
            <div style={{ padding: "60px 20px", border: "2px dashed #cbd5e0", borderRadius: "12px", textAlign: "center", color: "#718096", margin: "20px" }}>
              <i className="fas fa-pills" style={{ fontSize: "40px", marginBottom: "16px", color: "#a0aec0" }}></i>
              <p style={{ fontSize: "15px" }}>
                {searchTerm ? "আপনার অনুসন্ধানের সাথে কোনো ওষুধ মিলছে না।" : "কোনো ওষুধ পাওয়া যায়নি। ওপরের বাটনে ক্লিক করে প্রথম ওষুধটি যোগ করুন।"}
              </p>
            </div>
          ) : (
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th style={{ width: "50px" }}>#</th>
                  <th>ওষুধের নাম</th>
                  <th style={{ width: "180px" }}>স্ল্যাগ (Slug)</th>
                  <th style={{ width: "120px", textAlign: "center" }}>নোটস</th>
                  <th style={{ width: "150px" }}>অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {filteredMedicines.map((med, idx) => {
                  const notes = countNotes(med);
                  return (
                    <tr key={med.id}>
                      <td style={{ color: "#999", fontWeight: 600 }}>{idx + 1}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{
                            width: "36px", height: "36px", borderRadius: "8px", flexShrink: 0,
                            background: notes > 0 ? "linear-gradient(135deg, var(--primary), var(--primary-light))" : "#e2e8f0",
                            color: notes > 0 ? "white" : "#a0aec0",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "14px"
                          }}>
                            <i className="fas fa-pills" />
                          </div>
                          <div>
                            <strong style={{ fontSize: "14px" }}>{med.name}</strong>
                          </div>
                        </div>
                      </td>
                      <td>
                        <code style={{ fontSize: "12px", background: "#f0f0f0", padding: "3px 8px", borderRadius: "4px", color: "#666" }}>{med.slug}</code>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: "4px",
                          padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600,
                          background: notes > 0 ? "#d4edda" : "#f8f9fa",
                          color: notes > 0 ? "#155724" : "#999"
                        }}>
                          <i className={`fas ${notes > 0 ? "fa-check-circle" : "fa-minus-circle"}`} />
                          {notes}/5
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <a
                            href={`/medicines/${med.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="action-btn action-view"
                            title="ওয়েবসাইটে দেখুন"
                          >
                            <i className="fas fa-eye"></i>
                          </a>
                          <button
                            onClick={() => handleEdit(med)}
                            className="action-btn action-edit"
                            title="সম্পাদনা"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            onClick={() => handleDelete(med.id)}
                            disabled={isPending}
                            className="action-btn action-delete"
                            title="মুছুন"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 11000, padding: "20px"
        }}>
          <div className="modal-content" style={{
            background: "white", padding: "30px", borderRadius: "12px",
            width: "100%", maxWidth: "720px", maxHeight: "90vh", overflowY: "auto",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            color: "#333", position: "relative"
          }}>
            <div className="modal-header" style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              borderBottom: "1px solid #eee", paddingBottom: "12px", marginBottom: "20px"
            }}>
              <h2 style={{ margin: 0, fontSize: "1.4rem", color: "var(--primary-dark)" }}>
                {editingId ? "ওষুধ সম্পাদনা করুন" : "নতুন ওষুধ যোগ করুন"}
              </h2>
              <button
                className="close-btn"
                style={{ background: "none", border: "none", fontSize: "1.8rem", cursor: "pointer", color: "#666" }}
                onClick={() => setIsModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Name Field */}
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>ওষুধের নাম (Name) <span style={{ color: "#e74c3c" }}>*</span></label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (!editingId) {
                      setFormSlug(autoGenerateSlug(e.target.value));
                    }
                  }}
                  placeholder="যেমন: একোনাইটাম নেপেলাস [Aconitum Napellus]"
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px", outline: "none" }}
                />
              </div>

              {/* Slug Field */}
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>URL স্ল্যাগ (Slug)</label>
                <input
                  type="text"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="যেমন: aconitum-napellus"
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px", outline: "none", fontFamily: "monospace" }}
                />
                <small style={{ color: "#999", fontSize: "12px" }}>এটি URL-এ ব্যবহৃত হবে: /medicines/{formSlug || "..."}</small>
              </div>

              {/* Tabbed Content Fields */}
              <div style={{ marginTop: "4px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "10px" }}>রেপার্টরি নোটস (Repertory Notes)</label>
                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "12px" }}>
                  {formTabs.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveFormTab(tab.key)}
                      style={{
                        padding: "8px 14px",
                        border: activeFormTab === tab.key ? "2px solid var(--primary)" : "1px solid #ddd",
                        borderRadius: "8px",
                        background: activeFormTab === tab.key ? "var(--primary)" : "white",
                        color: activeFormTab === tab.key ? "white" : "#555",
                        fontSize: "12.5px",
                        fontWeight: "600",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        position: "relative"
                      }}
                    >
                      {tab.label}
                      {getTabValue(tab.key) && (
                        <span style={{
                          position: "absolute", top: "-4px", right: "-4px",
                          width: "10px", height: "10px", borderRadius: "50%",
                          background: "#2ecc71", border: "2px solid white"
                        }} />
                      )}
                    </button>
                  ))}
                </div>

                {formTabs.map((tab) => (
                  <div key={tab.key} style={{ display: activeFormTab === tab.key ? "block" : "none" }}>
                    <textarea
                      value={getTabValue(tab.key)}
                      onChange={(e) => setTabValue(tab.key, e.target.value)}
                      placeholder={`${tab.label} বিবরণ এখানে লিখুন...`}
                      style={{
                        width: "100%", padding: "12px", border: "1px solid #ddd",
                        borderRadius: "8px", fontSize: "14px", outline: "none",
                        minHeight: "180px", resize: "vertical", lineHeight: "1.6"
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="modal-actions" style={{
                display: "flex", justifyContent: "flex-end", gap: "10px",
                marginTop: "20px", borderTop: "1px solid #eee", paddingTop: "15px"
              }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-compact"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isPending}
                >
                  বাতিল করুন (Cancel)
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-compact"
                  disabled={isPending}
                  style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}
                >
                  {isPending ? (
                    <>
                      <i className="fas fa-spinner fa-spin" /> সংরক্ষণ হচ্ছে...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save" /> সংরক্ষণ করুন
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
