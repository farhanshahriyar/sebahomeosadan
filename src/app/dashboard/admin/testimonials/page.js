"use client";
import { useState, useEffect, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import CoverImageUpload from "@/components/dashboard/CoverImageUpload";
import { saveTestimonialAction, deleteTestimonialAction, updateTestimonialOrderAction } from "./actions";

export default function TestimonialsAdminPage() {
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [dbError, setDbError] = useState(false);
  const [testimonials, setTestimonials] = useState([]);
  
  // Messages
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formName, setFormName] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formText, setFormText] = useState("");
  const [formImg, setFormImg] = useState("");
  
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

      if (profile?.role !== "super_admin") {
        window.location.href = "/dashboard";
        return;
      }
      setAuthChecking(false);
    }
    checkAuth();
  }, [supabase]);

  // 2. Fetch Testimonials
  const fetchTestimonials = async () => {
    setLoading(true);
    setDbError(false);
    try {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) {
        if (error.code === "P0001" || error.message?.includes("relation") || error.message?.includes("does not exist")) {
          setDbError(true);
        } else {
          setErrorMsg("ডেটা লোড করতে সমস্যা হয়েছে: " + error.message);
        }
      } else {
        setTestimonials(data || []);
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
      fetchTestimonials();
    }
  }, [authChecking]);

  // Handle Add Click
  const handleAdd = () => {
    setEditingId(null);
    setFormName("");
    setFormTitle("");
    setFormText("");
    setFormImg("");
    setErrorMsg("");
    setSuccessMsg("");
    setIsModalOpen(true);
  };

  // Handle Edit Click
  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormName(item.name);
    setFormTitle(item.title);
    setFormText(item.text);
    setFormImg(item.img || "");
    setErrorMsg("");
    setSuccessMsg("");
    setIsModalOpen(true);
  };

  // Handle Delete
  const handleDelete = async (id) => {
    if (!confirm("আপনি কি নিশ্চিত যে এই টেস্টিমোনিয়ালটি মুছে ফেলতে চান?")) return;
    
    setSuccessMsg("");
    setErrorMsg("");
    
    startTransition(async () => {
      const res = await deleteTestimonialAction(id);
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg("টেস্টিমোনিয়ালটি সফলভাবে মুছে ফেলা হয়েছে!");
        fetchTestimonials();
      }
    });
  };

  // Reorder Handler
  const moveItem = async (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= testimonials.length) return;

    const updated = [...testimonials];
    const temp = updated[index];
    updated[index] = updated[nextIndex];
    updated[nextIndex] = temp;

    // Locally update UI first
    setTestimonials(updated);

    startTransition(async () => {
      const orderedIds = updated.map(item => item.id);
      const res = await updateTestimonialOrderAction(orderedIds);
      if (res?.error) {
        setErrorMsg("অর্ডার আপডেট করতে ব্যর্থ হয়েছে: " + res.error);
        fetchTestimonials(); // revert
      } else {
        setSuccessMsg("টেস্টিমোনিয়াল ক্রম সফলভাবে আপডেট করা হয়েছে!");
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
    formData.append("title", formTitle);
    formData.append("text", formText);
    formData.append("img", formImg);

    startTransition(async () => {
      const res = await saveTestimonialAction(formData);
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg(editingId ? "টেস্টিমোনিয়াল সফলভাবে আপডেট করা হয়েছে!" : "নতুন টেস্টিমোনিয়াল সফলভাবে যোগ করা হয়েছে!");
        setIsModalOpen(false);
        fetchTestimonials();
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
          <h1>টেস্টিমোনিয়াল ব্যবস্থাপনা (Manage Testimonials)</h1>
          <div className="breadcrumb">
            <a href="/dashboard">Dashboard</a> / <a href="/dashboard/admin">Admin</a> / Testimonials
          </div>
        </div>

        <div className="dashboard-panel" style={{ borderLeft: "4px solid #e74c3c" }}>
          <div className="panel-header" style={{ color: "#e74c3c" }}>
            <h2><i className="fas fa-exclamation-triangle" style={{ marginRight: "10px" }} />ডাটাবেস টেবিল অনুপস্থিত (Table Missing)</h2>
          </div>
          <div className="panel-body" style={{ padding: "24px", lineHeight: "1.6" }}>
            <p style={{ marginBottom: "16px", fontSize: "15px", color: "#333" }}>
              টেস্টিমোনিয়াল সংরক্ষণ ও প্রদর্শন করার জন্য ডাটাবেসে <strong>testimonials</strong> টেবিলটি এখনও তৈরি করা হয়নি।
            </p>
            <div style={{ background: "#fdf3f2", border: "1px solid #f5c6cb", padding: "16px", borderRadius: "8px", marginBottom: "20px" }}>
              <h4 style={{ color: "#721c24", marginBottom: "8px" }}>কী করতে হবে? (Steps to resolve):</h4>
              <ol style={{ paddingLeft: "20px", color: "#721c24", fontSize: "14px" }}>
                <li style={{ marginBottom: "6px" }}>প্রজেক্টের রুট ডিরেক্টরিতে থাকা <code>supabase-testimonials.sql</code> ফাইলটি ওপেন করুন।</li>
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
      <div className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1>টেস্টিমোনিয়াল ব্যবস্থাপনা (Testimonials Controls)</h1>
          <div className="breadcrumb">
            <a href="/dashboard">Dashboard</a> / <a href="/dashboard/admin">Admin</a> / Testimonials
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleAdd} style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}>
          <i className="fas fa-plus-circle" /> নতুন টেস্টিমোনিয়াল যোগ করুন
        </button>
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
          <h2>টেস্টিমোনিয়াল সমূহের তালিকা ({testimonials.length})</h2>
        </div>
        <div className="panel-body" style={{ padding: "24px" }}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#999" }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: "24px", color: "var(--primary)" }} />
              <p style={{ marginTop: "12px" }}>লোড হচ্ছে...</p>
            </div>
          ) : testimonials.length === 0 ? (
            <div style={{ padding: "60px 20px", border: "2px dashed #cbd5e0", borderRadius: "12px", textAlign: "center", color: "#718096" }}>
              <i className="fas fa-comments-slash" style={{ fontSize: "40px", marginBottom: "16px", color: "#a0aec0" }}></i>
              <p style={{ fontSize: "15px" }}>কোনো টেস্টিমোনিয়াল পাওয়া যায়নি। ওপরের বাটনে ক্লিক করে প্রথম টেস্টিমোনিয়ালটি যোগ করুন।</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {testimonials.map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    background: "white",
                    border: "1px solid #e2e8f0",
                    padding: "20px",
                    borderRadius: "12px",
                    display: "flex",
                    gap: "20px",
                    alignItems: "flex-start",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
                    borderLeft: "5px solid var(--primary)",
                    position: "relative"
                  }}
                >
                  {/* Photo */}
                  <div style={{ flexShrink: 0 }}>
                    {item.img ? (
                      <img
                        src={item.img}
                        alt={item.name}
                        style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", border: "3px solid #ffdfb8", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "80px",
                          height: "80px",
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, var(--primary), var(--primary-light))",
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "28px",
                          fontWeight: "bold",
                          border: "3px solid #ffdfb8",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                        }}
                      >
                        {item.name ? item.name.charAt(0).toUpperCase() : "?"}
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "var(--text-dark)" }}>{item.name}</h4>
                        <span style={{ fontSize: "13px", color: "var(--text-muted)", display: "block", marginTop: "2px" }}>{item.title}</span>
                      </div>
                    </div>
                    <p style={{ margin: "14px 0 0", fontSize: "14.5px", color: "#475569", lineHeight: "1.7", fontStyle: "italic", whiteSpace: "pre-wrap" }}>
                      &ldquo;{item.text}&rdquo;
                    </p>
                  </div>

                  {/* Actions column */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "130px", flexShrink: 0 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                      <button
                        onClick={() => moveItem(idx, -1)}
                        disabled={idx === 0 || isPending}
                        className="btn btn-secondary btn-compact"
                        style={{ padding: "8px", justifyContent: "center", minHeight: "36px" }}
                        title="উপরে সরান"
                      >
                        <i className="fas fa-chevron-up" />
                      </button>
                      <button
                        onClick={() => moveItem(idx, 1)}
                        disabled={idx === testimonials.length - 1 || isPending}
                        className="btn btn-secondary btn-compact"
                        style={{ padding: "8px", justifyContent: "center", minHeight: "36px" }}
                        title="নিচে সরান"
                      >
                        <i className="fas fa-chevron-down" />
                      </button>
                    </div>
                    
                    <button
                      onClick={() => handleEdit(item)}
                      className="btn btn-primary btn-compact"
                      style={{ background: "#3498db", border: "none", width: "100%", justifyContent: "center", minHeight: "36px" }}
                    >
                      <i className="fas fa-edit" /> সম্পাদনা
                    </button>
                    
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={isPending}
                      className="btn btn-danger btn-compact"
                      style={{ width: "100%", justifyContent: "center", minHeight: "36px" }}
                    >
                      <i className="fas fa-trash-alt" /> মুছুন
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
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
              borderBottom: "1px solid #eee", paddingBottom: "12px", marginBottom: "20px"
            }}>
              <h2 style={{ margin: 0, fontSize: "1.4rem", color: "var(--primary-dark)" }}>
                {editingId ? "টেস্টিমোনিয়াল সম্পাদনা করুন" : "নতুন টেস্টিমোনিয়াল যোগ করুন"}
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
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>নাম (Name) <span style={{ color: "#e74c3c" }}>*</span></label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="যেমন: Dr. John Doe"
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px", outline: "none" }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>পদবী / উপাধি (Title / Subtitle) <span style={{ color: "#e74c3c" }}>*</span></label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="যেমন: Founder of Homeopathy / Homeopath"
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px", outline: "none" }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>বক্তব্য (Testimonial Quote) <span style={{ color: "#e74c3c" }}>*</span></label>
                <textarea
                  required
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  placeholder="এখানে টেস্টিমোনিয়াল বক্তব্যটি লিখুন..."
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px", outline: "none", minHeight: "120px", resize: "vertical" }}
                />
              </div>

              <div style={{ marginTop: "4px" }}>
                <CoverImageUpload
                  label="প্রোফাইল ছবি (Profile Image)"
                  value={formImg}
                  onChange={setFormImg}
                />
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
