"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

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

  // Fetch admin-approved categories from Supabase
  useEffect(() => {
    async function fetchCategories() {
      const supabase = createClient();
      const { data } = await supabase
        .from("categories")
        .select("id, name")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (data) {
        setCategories(data);
        // Set default category if none selected
        if (!categoryId && data.length > 0) {
          setCategoryId(data[0].id);
        }
      }
    }
    fetchCategories();
  }, []);

  // Auto-generate slug from title when creating new article
  useEffect(() => {
    if (!article?.id) {
      setSlug(generateSlug(title));
    }
  }, [title, article?.id]);

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
            profile?.full_name || user.email?.split("@")[0] || "Unknown",
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
          throw result.error;
        }

        onSave?.(result.data);
      } catch (err) {
        setError(err.message || "সংরক্ষণে ত্রুটি হয়েছে");
      } finally {
        setSaving(false);
      }
    },
    [title, slug, categoryId, excerpt, content, coverImage, tags, article, onSave]
  );

  return (
    <div className="article-editor">
      <div className="editor-header">
        <h2>{article?.id ? "আর্টিকেল সম্পাদনা" : "নতুন আর্টিকেল লিখুন"}</h2>
        <button
          className="btn-cancel"
          onClick={onCancel}
        >
          <i className="fas fa-times" /> বাতিল
        </button>
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

        {/* Category & Cover Image */}
        <div className="form-row">
          <div className="form-group">
            <label>বিভাগ (অ্যাডমিন অনুমোদিত)</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="" disabled>বিভাগ নির্বাচন করুন...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>কভার ছবি URL</label>
            <input
              type="url"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>
        </div>

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
    </div>
  );
}
