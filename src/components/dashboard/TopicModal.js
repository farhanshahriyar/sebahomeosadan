"use client";
import { useState, useEffect } from "react";
import { saveTopicAction } from "@/app/dashboard/admin/topics/actions";
import { createClient } from "@/lib/supabase/client";

function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0980-\u09FF-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    || `topic-${Date.now()}`;
}

export default function TopicModal({ topic, onClose }) {
  const [name, setName] = useState(topic?.name || "");
  const [slug, setSlug] = useState(topic?.slug || "");
  const [description, setDescription] = useState(topic?.description || "");
  const [sortOrder, setSortOrder] = useState(topic?.sort_order || 0);
  const [isActive, setIsActive] = useState(topic ? topic.is_active : true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [parentSubjects, setParentSubjects] = useState([]);
  const [parentId, setParentId] = useState(topic?.parent_id || "");

  // Fetch parent subjects on mount
  useEffect(() => {
    async function fetchParentSubjects() {
      const supabase = createClient();
      const { data } = await supabase
        .from("categories")
        .select("id, name")
        .is("parent_id", null)
        .eq("is_active", true);
      if (data) {
        setParentSubjects(data);
      }
    }
    fetchParentSubjects();
  }, []);

  // Auto-generate slug from name if creating a new topic
  useEffect(() => {
    if (!topic?.id) {
      setSlug(generateSlug(name));
    }
  }, [name, topic?.id]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("টপিকের নাম অবশ্যই দিতে হবে।");
      return;
    }
    if (!parentId) {
      setError("অভিভাবক বিষয় অবশ্যই নির্বাচন করতে হবে।");
      return;
    }
    if (!slug.trim()) {
      setError("স্লাগ অবশ্যই দিতে হবে।");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    if (topic?.id) {
      formData.append("id", topic.id);
    }
    formData.append("name", name.trim());
    formData.append("slug", slug.trim());
    formData.append("description", description.trim());
    formData.append("sort_order", sortOrder.toString());
    formData.append("is_active", isActive.toString());
    formData.append("parent_id", parentId);

    const result = await saveTopicAction(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      onClose(true); // Close and trigger refresh
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{topic?.id ? "টপিক সম্পাদনা" : "নতুন টপিক তৈরি"}</h2>
          <button className="close-btn" onClick={() => onClose(false)}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && (
            <div className="error-message" style={{ color: "#e74c3c", background: "rgba(231,76,60,0.1)", padding: "10px", borderRadius: "6px", marginBottom: "15px", fontSize: "14px" }}>
              <i className="fas fa-exclamation-circle" /> {error}
            </div>
          )}

          <div className="form-group">
            <label>অভিভাবক বিষয় (Subject) *</label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                fontFamily: "inherit",
                fontSize: "14px",
                backgroundColor: "#fff"
              }}
            >
              <option value="" disabled>বিষয় নির্বাচন করুন...</option>
              {parentSubjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>টপিকের নাম *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="যেমন: মানসিক স্বাস্থ্য, শিশুস্বাস্থ্য"
            />
          </div>

          <div className="form-group">
            <label>স্লাগ (URL Slug) *</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              placeholder="যেমন: mental-health, child-care"
            />
          </div>

          <div className="form-group">
            <label>বর্ণনা (Description)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="টপিকের সংক্ষিপ্ত বিবরণ লিখুন..."
              rows={3}
              style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", resize: "vertical", fontFamily: "inherit" }}
            />
          </div>

          <div className="form-row" style={{ display: "flex", gap: "15px" }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>সাজানোর ক্রম (Sort Order)</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                min={0}
              />
            </div>
            <div className="form-group" style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <label style={{ marginBottom: "8px" }}>অবস্থা (Status)</label>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", height: "40px" }}>
                <input
                  type="checkbox"
                  id="is_active_checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  style={{ width: "18px", height: "18px", cursor: "pointer" }}
                />
                <label htmlFor="is_active_checkbox" style={{ margin: 0, cursor: "pointer", fontWeight: "normal" }}>সক্রিয় (Active)</label>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary btn-compact" onClick={() => onClose(false)} disabled={loading}>
              বাতিল
            </button>
            <button type="submit" className="btn btn-primary btn-compact" disabled={loading}>
              {loading ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }
        .modal-content {
          background: white;
          padding: 30px;
          border-radius: 12px;
          width: 100%;
          max-width: 480px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          animation: fadeIn 0.2s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 1px solid #eee;
          padding-bottom: 10px;
        }
        .modal-header h2 {
          margin: 0;
          font-size: 1.35rem;
          color: var(--primary-dark);
          font-weight: 600;
        }
        .close-btn {
          background: none;
          border: none;
          font-size: 1.6rem;
          cursor: pointer;
          color: #666;
          padding: 0;
          line-height: 1;
        }
        .close-btn:hover {
          color: #e74c3c;
        }
        .form-group {
          margin-bottom: 16px;
        }
        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          font-size: 14px;
          color: #333;
        }
        .form-group input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-family: inherit;
          font-size: 14px;
        }
        .form-group input:focus {
          border-color: var(--primary);
          outline: none;
          box-shadow: 0 0 0 3px rgba(13, 122, 62, 0.1);
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
          border-top: 1px solid #eee;
          padding-top: 18px;
        }
      `}</style>
    </div>
  );
}
