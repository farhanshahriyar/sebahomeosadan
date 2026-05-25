"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import CoverImageUpload from "./CoverImageUpload";
import { saveCategoryAction } from "@/app/dashboard/admin/categories/actions";

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s\u0980-\u09FF-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    || `article-${Date.now()}`;
}

export default function ArticleEditor({ article, onSave, onCancel }) {
  const [title, setTitle] = useState(article?.title || "");
  const [slug, setSlug] = useState(article?.slug || "");
  const [categoryId, setCategoryId] = useState(article?.category_id || "");
  const [categories, setCategories] = useState([]);
  const [excerpt, setExcerpt] = useState(article?.excerpt || "");
  const [content, setContent] = useState(article?.content || "");
  const [coverImage, setCoverImage] = useState(article?.cover_image || "");
  const [tags, setTags] = useState(article?.tags?.join(", ") || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [authorName, setAuthorName] = useState(article?.author_name || "");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [suggestedTopicName, setSuggestedTopicName] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState(null);

  // Fetch categories from Supabase (including pending suggestions created by this author)
  useEffect(() => {
    async function fetchCategories() {
      const supabase = createClient();
      const { data } = await supabase
        .from("categories")
        .select("id, name, parent_id, is_active")
        .order("sort_order", { ascending: true });
      if (data) {
        setCategories(data);
      }
    }
    fetchCategories();
  }, []);

  // Initialize subject and topic dropdown values when categories are loaded or when editing
  useEffect(() => {
    if (categories.length > 0) {
      const currentCatId = article?.category_id || categoryId;
      if (currentCatId) {
        const cat = categories.find((c) => c.id === currentCatId);
        if (cat) {
          if (cat.parent_id) {
            setSelectedSubjectId(cat.parent_id);
            setSelectedTopicId(cat.id);
          } else {
            setSelectedSubjectId(cat.id);
            setSelectedTopicId("");
          }
        }
      } else {
        // Set default subject if none selected
        const defaultSubject = categories.find((c) => !c.parent_id);
        if (defaultSubject) {
          setSelectedSubjectId(defaultSubject.id);
        }
      }
    }
  }, [categories, article?.category_id]);

  // Synchronize categoryId state used for saving with selected Subject/Topic values
  useEffect(() => {
    if (selectedTopicId) {
      setCategoryId(selectedTopicId);
    } else {
      setCategoryId(selectedSubjectId);
    }
  }, [selectedSubjectId, selectedTopicId]);

  const handleSuggestTopic = async (e) => {
    e.preventDefault();
    if (!suggestedTopicName.trim()) {
      setSuggestError("টপিকের নাম অবশ্যই দিতে হবে।");
      return;
    }
    if (!selectedSubjectId) {
      setSuggestError("দয়া করে প্রথমে একটি বিষয় (Subject) নির্বাচন করুন।");
      return;
    }

    setSuggesting(true);
    setSuggestError(null);

    const generateSuggestSlug = (text) => {
      return text
        .toLowerCase()
        .replace(/[^\w\s\u0980-\u09FF-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "") || `topic-${Date.now()}`;
    };

    const formData = new FormData();
    formData.append("name", suggestedTopicName.trim());
    formData.append("slug", generateSuggestSlug(suggestedTopicName));
    formData.append("parent_id", selectedSubjectId);
    formData.append("is_active", "false"); // Forced to false for suggestions

    const res = await saveCategoryAction(formData);

    if (res?.error) {
      setSuggestError(res.error);
      setSuggesting(false);
    } else {
      // Re-fetch categories to get the newly suggested topic
      const supabase = createClient();
      const { data } = await supabase
        .from("categories")
        .select("id, name, parent_id, is_active")
        .order("sort_order", { ascending: true });
      if (data) {
        setCategories(data);
      }
      
      // Auto-select the newly created suggested topic
      setSelectedTopicId(res.data.id);
      
      // Reset suggest form
      setSuggestedTopicName("");
      setShowSuggestModal(false);
      setSuggesting(false);
    }
  };

  // Auto-generate slug from title when creating new article
  useEffect(() => {
    if (!article?.id) {
      setSlug(generateSlug(title));
    }
  }, [title, article?.id]);

  // Fetch current user's profile for preview display
  useEffect(() => {
    async function fetchAuthorProfile() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();

        if (profile?.full_name) {
          setAuthorName(profile.full_name);
        } else if (user.email) {
          setAuthorName(user.email.split("@")[0]);
        } else {
          setAuthorName("লেখক");
        }
      }
    }
    fetchAuthorProfile();
  }, []);

  const formatBanglaDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return d.toLocaleDateString("bn-BD", options);
  };

  const handleSave = useCallback(
    async (status) => {
      if (!title.trim()) {
        setError("শিরোনাম আবশ্যক");
        return;
      }
      if (!content.trim()) {
        setError("কন্টেন্ট আবশ্যক");
        return;
      }

      setSaving(true);
      setError(null);

      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError("আপনি লগইন করেননি");
          setSaving(false);
          return;
        }

        // Fetch author name from profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();

        const articleData = {
          title: title.trim(),
          slug: slug.trim() || generateSlug(title),
          category_id: categoryId || null,
          excerpt: excerpt.trim() || title.trim().substring(0, 160),
          content: content.trim(),
          cover_image: coverImage.trim() || null,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          status,
          author_id: user.id,
          author_name:
            authorName || profile?.full_name || user.email?.split("@")[0] || "Unknown",
          ...(status === "published" && !article?.published_at
            ? { published_at: new Date().toISOString() }
            : {}),
        };

        let result;
        if (article?.id) {
          // Update existing
          result = await supabase
            .from("articles")
            .update(articleData)
            .eq("id", article.id)
            .select()
            .single();
        } else {
          // Insert new
          result = await supabase
            .from("articles")
            .insert(articleData)
            .select()
            .single();
        }

        if (result.error) {
          if (result.error.message?.includes("articles_category_id_fkey")) {
            throw new Error("নির্বাচিত বিভাগটি ডাটাবেসে পাওয়া যায়নি। দয়া করে পেজটি রিফ্রেশ করে আবার চেষ্টা করুন।");
          }
          throw result.error;
        }

        onSave?.(result.data);
      } catch (err) {
        setError(err.message || "সংরক্ষণে ত্রুটি হয়েছে");
      } finally {
        setSaving(false);
      }
    },
    [title, slug, categoryId, excerpt, content, coverImage, tags, article, onSave, authorName]
  );

  return (
    <div className="article-editor">
      <div className="editor-header">
        <h2>{isPreviewOpen ? "আর্টিকেলের প্রিভিউ" : (article?.id ? "আর্টিকেল সম্পাদনা" : "নতুন আর্টিকেল লিখুন")}</h2>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {isPreviewOpen ? (
            <button
              className="btn btn-secondary btn-compact"
              onClick={() => setIsPreviewOpen(false)}
              type="button"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <i className="fas fa-edit" /> এডিটর-এ ফিরে যান
            </button>
          ) : (
            <button
              className="btn btn-secondary btn-compact"
              onClick={() => setIsPreviewOpen(true)}
              type="button"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <i className="fas fa-eye" /> প্রিভিউ
            </button>
          )}
          <button
            className="btn-cancel"
            onClick={onCancel}
          >
            <i className="fas fa-times" /> বাতিল
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: "rgba(231,76,60,0.1)",
            color: "#e74c3c",
            padding: "12px 16px",
            borderRadius: "10px",
            fontSize: "14px",
            marginBottom: "20px",
          }}
        >
          <i className="fas fa-exclamation-circle" /> {error}
        </div>
      )}

      {isPreviewOpen ? (
        <div className="preview-container">
          {/* Info Banner */}
          <div className="preview-info-banner">
            <i className="fas fa-info-circle" />
            <span>এটি আর্টিকেলের একটি প্রিভিউ। প্রকাশ করার পর পাঠকরা পোস্টটি এভাবে দেখতে পাবেন।</span>
          </div>

          {/* Article Main Preview */}
          <div className="blog-content">
            <span className="category">
              {categories.find((c) => c.id === categoryId)?.name || "সাধারণ"}
            </span>
            <h1 className="post-title" style={{ marginTop: "12px", marginBottom: "16px", fontWeight: "700" }}>
              {title || "শিরোনামহীন আর্টিকেল"}
            </h1>
            
            <div className="post-meta" style={{ marginBottom: "24px" }}>
              {authorName && (
                <span>
                  <i className="fas fa-user" style={{ marginRight: "6px" }} />
                  {authorName}
                </span>
              )}
              <span>
                <i className="fas fa-calendar-alt" style={{ marginRight: "6px" }} />
                {formatBanglaDate(new Date())}
              </span>
            </div>

            {coverImage ? (
              <div style={{ marginBottom: "24px", borderRadius: "12px", overflow: "hidden", maxHeight: "400px" }}>
                <img
                  src={coverImage}
                  alt={title}
                  style={{
                    width: "100%",
                    height: "auto",
                    objectFit: "cover",
                    maxHeight: "400px",
                  }}
                />
              </div>
            ) : (
              <div className="preview-cover-placeholder">
                <i className="fas fa-image" />
                <span>কোন কভার ছবি আপলোড করা হয়নি</span>
              </div>
            )}

            {excerpt && (
              <blockquote 
                style={{ 
                  margin: "0 0 24px 0", 
                  padding: "12px 18px", 
                  borderLeft: "4px solid var(--primary)", 
                  background: "#f9f9f9", 
                  fontStyle: "italic", 
                  fontSize: "14px", 
                  color: "#555",
                  borderRadius: "0 8px 8px 0"
                }}
              >
                {excerpt}
              </blockquote>
            )}

            <div
              className="article-body"
              dangerouslySetInnerHTML={{ __html: content || "<p style='color:#999;font-style:italic;'>আর্টিকেলের মূল কন্টেন্ট খালি রয়েছে।</p>" }}
            />

            {/* Tags */}
            {tags.trim() && (
              <div style={{ marginTop: "30px", paddingTop: "16px", borderTop: "1px solid #eee" }}>
                <strong style={{ color: "#555", fontSize: "14px" }}>ট্যাগসমূহ: </strong>
                <div style={{ display: "inline-flex", gap: "8px", flexWrap: "wrap", marginLeft: "10px" }}>
                  {tags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean)
                    .map((tag, i) => (
                      <span key={i} className="tag-item">
                        {tag}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons in Preview Mode */}
          <div className="preview-actions-bar">
            <button
              className="btn btn-secondary btn-compact"
              onClick={() => setIsPreviewOpen(false)}
              type="button"
            >
              <i className="fas fa-edit" /> এডিটর-এ ফিরে যান
            </button>
            <button
              className="btn btn-secondary btn-compact"
              onClick={() => handleSave("draft")}
              disabled={saving}
            >
              <i className="fas fa-save" />{" "}
              {saving ? "সংরক্ষণ হচ্ছে..." : "ড্রাফট সংরক্ষণ"}
            </button>
            <button
              className="btn btn-info btn-compact"
              onClick={() => handleSave("review")}
              disabled={saving}
            >
              <i className="fas fa-paper-plane" /> রিভিউতে পাঠান
            </button>
            <button
              className="btn btn-primary btn-compact"
              onClick={() => handleSave("published")}
              disabled={saving}
            >
              <i className="fas fa-globe" /> প্রকাশ করুন
            </button>
          </div>
        </div>
      ) : (
        <div className="editor-form">
        {/* Title */}
        <div className="form-group">
          <label>শিরোনাম *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="আর্টিকেলের শিরোনাম লিখুন..."
            style={{ fontSize: "14px", fontWeight: 600 }}
          />
        </div>

        {/* Slug */}
        <div className="form-group">
          <label>স্লাগ (URL)</label>
          <div className="input-group">
            <span className="input-group-text">
              /
            </span>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="auto-generated-slug"
            />
          </div>
        </div>

        {/* Subject Selection */}
        <div className="form-group">
          <label>প্রধান বিষয় (Subject) *</label>
          <select
            value={selectedSubjectId}
            onChange={(e) => {
              setSelectedSubjectId(e.target.value);
              setSelectedTopicId(""); // Reset topic selection when subject changes
            }}
          >
            <option value="" disabled>বিষয় নির্বাচন করুন...</option>
            {categories.filter(c => !c.parent_id).map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Topic Selection */}
        <div className="form-group">
          <label>টপিক (Topic/Subcategory)</label>
          <div style={{ display: "flex", gap: "10px" }}>
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              style={{ flex: 1 }}
            >
              <option value="">টপিক নির্বাচন করুন (ঐচ্ছিক)...</option>
              {categories
                .filter(c => c.parent_id === selectedSubjectId)
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} {!cat.is_active && "(অনুমোদন পেন্ডিং)"}
                  </option>
                ))}
            </select>
            <button
              type="button"
              className="btn btn-secondary btn-compact"
              onClick={() => {
                if (!selectedSubjectId) {
                  alert("দয়া করে প্রথমে একটি বিষয় নির্বাচন করুন।");
                  return;
                }
                setSuggestError(null);
                setShowSuggestModal(true);
              }}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}
            >
              <i className="fas fa-plus" /> টপিক প্রস্তাব করুন
            </button>
          </div>
        </div>

        {/* Cover Image Upload */}
        <CoverImageUpload
          value={coverImage}
          onChange={setCoverImage}
        />

        {/* Excerpt */}
        <div className="form-group">
          <label>সংক্ষিপ্ত বিবরণ</label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="আর্টিকেলের সংক্ষিপ্ত বিবরণ (হোমপেজে দেখানো হবে)..."
            style={{ minHeight: "60px" }}
          />
        </div>

        {/* Content - Rich HTML Editor */}
        <div className="form-group">
          <label>কন্টেন্ট * (HTML সমর্থিত)</label>
          <div className="editor-toolbar">
            <button
              type="button"
              onClick={() =>
                setContent(
                  (c) => c + "<h4><b></b></h4>\n"
                )
              }
              title="Heading"
            >
              <b>H</b>
            </button>
            <button
              type="button"
              onClick={() => setContent((c) => c + "<b></b>")}
              title="Bold"
            >
              <b>B</b>
            </button>
            <button
              type="button"
              onClick={() => setContent((c) => c + "<i></i>")}
              title="Italic"
            >
              <i>I</i>
            </button>
            <button
              type="button"
              onClick={() => setContent((c) => c + "<br/>\n")}
              title="Line Break"
            >
              ↵
            </button>
            <button
              type="button"
              onClick={() =>
                setContent((c) => c + '<p>\n\n</p>\n')
              }
              title="Paragraph"
            >
              ¶
            </button>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="<p>আর্টিকেলের মূল কন্টেন্ট এখানে লিখুন...</p>"
            style={{
              minHeight: "280px",
              fontFamily: "monospace",
              fontSize: "13px",
              lineHeight: "1.6",
            }}
          />
        </div>

        {/* Tags */}
        <div className="form-group">
          <label>ট্যাগ (কমা দিয়ে আলাদা করুন)</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="এনাটমি, ফিজিওলজি, হোমিওপ্যাথি"
          />
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
            marginTop: "30px",
            flexWrap: "wrap",
            borderTop: "1px solid #eee",
            paddingTop: "24px"
          }}
        >
          <button
            className="btn btn-secondary btn-compact"
            onClick={() => setIsPreviewOpen(true)}
            type="button"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <i className="fas fa-eye" /> প্রিভিউ
          </button>
          <button
            className="btn btn-secondary btn-compact"
            onClick={() => handleSave("draft")}
            disabled={saving}
          >
            <i className="fas fa-save" />{" "}
            {saving ? "সংরক্ষণ হচ্ছে..." : "ড্রাফট সংরক্ষণ"}
          </button>
          <button
            className="btn btn-info btn-compact"
            onClick={() => handleSave("review")}
            disabled={saving}
          >
            <i className="fas fa-paper-plane" /> রিভিউতে পাঠান
          </button>
          <button
            className="btn btn-primary btn-compact"
            onClick={() => handleSave("published")}
            disabled={saving}
          >
            <i className="fas fa-globe" /> প্রকাশ করুন
          </button>
        </div>
      </div>
      )}

      {/* Suggest Topic Modal */}
      {showSuggestModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "400px" }}>
            <div className="modal-header">
              <h2 style={{ fontSize: "1.2rem", margin: 0, color: "var(--primary-dark)" }}>নতুন টপিক প্রস্তাব করুন</h2>
              <button className="close-btn" onClick={() => setShowSuggestModal(false)} style={{ background: "none", border: "none", fontSize: "1.6rem", cursor: "pointer" }}>&times;</button>
            </div>
            <form onSubmit={handleSuggestTopic} style={{ marginTop: "15px" }}>
              {suggestError && (
                <div style={{ color: "#e74c3c", background: "rgba(231,76,60,0.1)", padding: "8px 12px", borderRadius: "6px", fontSize: "13px", marginBottom: "12px" }}>
                  {suggestError}
                </div>
              )}
              <div className="form-group" style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", fontWeight: "600" }}>অভিভাবক বিষয় (Subject)</label>
                <input
                  type="text"
                  value={categories.find(c => c.id === selectedSubjectId)?.name || ""}
                  disabled
                  style={{ background: "#f5f5f5", cursor: "not-allowed", width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: "6px" }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", fontWeight: "600" }}>টপিকের নাম *</label>
                <input
                  type="text"
                  value={suggestedTopicName}
                  onChange={(e) => setSuggestedTopicName(e.target.value)}
                  placeholder="যেমন: মানসিক স্বাস্থ্য, শিশুস্বাস্থ্য"
                  required
                  autoFocus
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: "6px" }}
                />
              </div>
              <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px", borderTop: "1px solid #eee", paddingTop: "14px" }}>
                <button type="button" className="btn btn-secondary btn-compact" onClick={() => setShowSuggestModal(false)} disabled={suggesting}>
                  বাতিল
                </button>
                <button type="submit" className="btn btn-primary btn-compact" disabled={suggesting}>
                  {suggesting ? "সংরক্ষণ হচ্ছে..." : "প্রস্তাব করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
