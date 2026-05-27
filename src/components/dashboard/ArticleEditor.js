"use client";
import { useState, useEffect, useCallback, useRef } from "react";
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
  const [showBlockDropdown, setShowBlockDropdown] = useState(false);
  const [activeBlockStyle, setActiveBlockStyle] = useState("Paragraph");
  const [history, setHistory] = useState([article?.content || ""]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isMdInOpen, setIsMdInOpen] = useState(false);
  const [isMdOutOpen, setIsMdOutOpen] = useState(false);
  const [mdText, setMdText] = useState("");
  const [isSourceMode, setIsSourceMode] = useState(false);
  const [sourceHtml, setSourceHtml] = useState("");

  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const historyIndexRef = useRef(0);
  const editorRef = useRef(null);
  const isInternalUpdate = useRef(false);

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

  // Close block dropdown on outside click
  useEffect(() => {
    if (!showBlockDropdown) return;
    const handleClose = () => setShowBlockDropdown(false);
    window.addEventListener("click", handleClose);
    return () => window.removeEventListener("click", handleClose);
  }, [showBlockDropdown]);

  const handleDropdownToggle = (e) => {
    e.stopPropagation();
    setShowBlockDropdown((prev) => !prev);
  };

  const pushToHistory = useCallback((newVal) => {
    setHistory((prev) => {
      const currentIndex = historyIndexRef.current;
      if (prev[currentIndex] === newVal) return prev;
      const nextHistory = prev.slice(0, currentIndex + 1);
      const updated = [...nextHistory, newVal];
      const newIndex = updated.length - 1;
      historyIndexRef.current = newIndex;
      setHistoryIndex(newIndex);
      return updated;
    });
  }, []);

  // Sync content into the contentEditable div when content state changes externally
  useEffect(() => {
    if (editorRef.current && isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    if (editorRef.current && !isSourceMode) {
      // Only update innerHTML if it actually differs to avoid cursor jumping
      if (editorRef.current.innerHTML !== content) {
        editorRef.current.innerHTML = content;
      }
    }
  }, [content, isSourceMode]);

  const syncContentFromEditor = useCallback(() => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    // Clean up browser artifacts
    const cleaned = html === "<br>" || html === "<div><br></div>" ? "" : html;
    if (cleaned !== content) {
      isInternalUpdate.current = true;
      setContent(cleaned);
    }
    return cleaned;
  }, [content]);

  const handleEditorInput = useCallback(() => {
    const html = syncContentFromEditor();
    
    // Debounce saving to history
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      if (html !== undefined) pushToHistory(html);
    }, 800);
  }, [syncContentFromEditor, pushToHistory]);

  const handleEditorKeyDown = (e) => {
    // Space or Enter trigger immediate history checkpoint
    if (e.key === " " || e.key === "Enter") {
      const html = syncContentFromEditor();
      if (html !== undefined) pushToHistory(html);
    }

    // Override Ctrl+Z/Y to use our history
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
      e.preventDefault();
      if (e.shiftKey) {
        handleRedo();
      } else {
        handleUndo();
      }
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
      e.preventDefault();
      handleRedo();
    }
  };

  const handleUndo = () => {
    if (historyIndexRef.current > 0) {
      const nextIndex = historyIndexRef.current - 1;
      historyIndexRef.current = nextIndex;
      setHistoryIndex(nextIndex);
      const restoredContent = history[nextIndex];
      setContent(restoredContent);
      if (editorRef.current) {
        editorRef.current.innerHTML = restoredContent;
      }
      setTimeout(() => {
        if (editorRef.current) editorRef.current.focus();
      }, 0);
    }
  };

  const handleRedo = () => {
    if (historyIndexRef.current < history.length - 1) {
      const nextIndex = historyIndexRef.current + 1;
      historyIndexRef.current = nextIndex;
      setHistoryIndex(nextIndex);
      const restoredContent = history[nextIndex];
      setContent(restoredContent);
      if (editorRef.current) {
        editorRef.current.innerHTML = restoredContent;
      }
      setTimeout(() => {
        if (editorRef.current) editorRef.current.focus();
      }, 0);
    }
  };

  // Detect current block format for the dropdown label
  const detectActiveBlock = useCallback(() => {
    try {
      const block = document.queryCommandValue("formatBlock");
      const map = {
        p: "Paragraph", h1: "Heading 1", h2: "Heading 2", h3: "Heading 3",
        blockquote: "Quote",
      };
      setActiveBlockStyle(map[block?.toLowerCase()] || "Paragraph");
    } catch {
      setActiveBlockStyle("Paragraph");
    }
  }, []);

  // WYSIWYG formatting via execCommand
  const execFormat = (command, value) => {
    if (editorRef.current) editorRef.current.focus();
    document.execCommand(command, false, value || null);
    syncContentFromEditor();
    const html = editorRef.current?.innerHTML || "";
    pushToHistory(html === "<br>" || html === "<div><br></div>" ? "" : html);
    detectActiveBlock();
  };

  const applyBlockStyle = (style) => {
    if (editorRef.current) editorRef.current.focus();
    switch (style) {
      case "p":
        document.execCommand("formatBlock", false, "p");
        break;
      case "h1":
        document.execCommand("formatBlock", false, "h1");
        break;
      case "h2":
        document.execCommand("formatBlock", false, "h2");
        break;
      case "h3":
        document.execCommand("formatBlock", false, "h3");
        break;
      case "quote":
        document.execCommand("formatBlock", false, "blockquote");
        break;
      case "ul":
        document.execCommand("insertUnorderedList", false, null);
        break;
      case "ol":
        document.execCommand("insertOrderedList", false, null);
        break;
      default:
        return;
    }
    syncContentFromEditor();
    const html = editorRef.current?.innerHTML || "";
    pushToHistory(html === "<br>" || html === "<div><br></div>" ? "" : html);
    detectActiveBlock();
  };

  const handleInsertLink = () => {
    if (editorRef.current) editorRef.current.focus();
    const url = prompt("লিংক ইউআরএল (URL) লিখুন:");
    if (url === null) return;
    const formattedUrl = url.trim() ? (url.startsWith("http://") || url.startsWith("https://") ? url.trim() : `https://${url.trim()}`) : "";
    if (!formattedUrl) return;
    document.execCommand("createLink", false, formattedUrl);
    // Set target="_blank" on the created link
    const sel = window.getSelection();
    if (sel.rangeCount) {
      const range = sel.getRangeAt(0);
      let linkEl = range.startContainer;
      while (linkEl && linkEl.tagName !== "A") linkEl = linkEl.parentNode;
      if (linkEl?.tagName === "A") linkEl.setAttribute("target", "_blank");
    }
    syncContentFromEditor();
    const html = editorRef.current?.innerHTML || "";
    pushToHistory(html === "<br>" || html === "<div><br></div>" ? "" : html);
  };

  const handleClearFormatting = () => {
    if (editorRef.current) editorRef.current.focus();
    document.execCommand("removeFormat", false, null);
    // Also reset block to paragraph
    document.execCommand("formatBlock", false, "p");
    syncContentFromEditor();
    const html = editorRef.current?.innerHTML || "";
    pushToHistory(html === "<br>" || html === "<div><br></div>" ? "" : html);
  };

  const getWordAndCharCount = () => {
    const cleanText = content.replace(/<\/?[^>]+(>|$)/g, " ").replace(/\s+/g, " ").trim();
    const words = cleanText ? cleanText.split(/\s+/).length : 0;
    const chars = content.length;
    return { words, chars };
  };

  const mdToHtml = (md) => {
    let html = md;
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    html = html.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');
    
    const lines = html.split("\n");
    let inUl = false;
    let inOl = false;
    const processedLines = [];
    
    for (let line of lines) {
      const trimmed = line.trim();
      const ulMatch = trimmed.match(/^[\*\-\+] (.*$)/i);
      const olMatch = trimmed.match(/^\d+\. (.*$)/i);
      
      if (ulMatch) {
        if (inOl) {
          processedLines.push("</ol>");
          inOl = false;
        }
        if (!inUl) {
          processedLines.push("<ul>");
          inUl = true;
        }
        processedLines.push(`  <li>${ulMatch[1]}</li>`);
      } else if (olMatch) {
        if (inUl) {
          processedLines.push("</ul>");
          inUl = false;
        }
        if (!inOl) {
          processedLines.push("<ol>");
          inOl = true;
        }
        processedLines.push(`  <li>${olMatch[1]}</li>`);
      } else {
        if (inUl) {
          processedLines.push("</ul>");
          inUl = false;
        }
        if (inOl) {
          processedLines.push("</ol>");
          inOl = false;
        }
        
        if (trimmed !== "") {
          if (!trimmed.startsWith("<h") && !trimmed.startsWith("<blockquote") && !trimmed.startsWith("<ul") && !trimmed.startsWith("<ol") && !trimmed.startsWith("<li")) {
            processedLines.push(`<p>${trimmed}</p>`);
          } else {
            processedLines.push(trimmed);
          }
        } else {
          processedLines.push("");
        }
      }
    }
    
    if (inUl) processedLines.push("</ul>");
    if (inOl) processedLines.push("</ol>");
    
    html = processedLines.join("\n");
    html = html.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    html = html.replace(/__(.+?)__/g, '<b>$1</b>');
    html = html.replace(/\*(.+?)\*/g, '<i>$1</i>');
    html = html.replace(/\b_(.+?)_\b/g, '<i>$1</i>');
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    return html;
  };

  const htmlToMd = (html) => {
    let md = html;
    md = md.replace(/<h1>(.*?)<\/h1>/gim, '# $1\n');
    md = md.replace(/<h2>(.*?)<\/h2>/gim, '## $1\n');
    md = md.replace(/<h3>(.*?)<\/h3>/gim, '### $1\n');
    md = md.replace(/<h4>(.*?)<\/h4>/gim, '#### $1\n');
    md = md.replace(/<blockquote>(.*?)<\/blockquote>/gim, '> $1\n');
    md = md.replace(/<b>(.*?)<\/b>/g, '**$1**');
    md = md.replace(/<strong>(.*?)<\/strong>/g, '**$1**');
    md = md.replace(/<i>(.*?)<\/i>/g, '*$1*');
    md = md.replace(/<em>(.*?)<\/em>/g, '*$1*');
    md = md.replace(/<code>(.*?)<\/code>/g, '`$1`');
    
    md = md.replace(/<ul>\s*([\s\S]*?)\s*<\/ul>/g, (match, body) => {
      return body.replace(/<li>(.*?)<\/li>/g, '- $1\n');
    });
    md = md.replace(/<ol>\s*([\s\S]*?)\s*<\/ol>/g, (match, body) => {
      let idx = 1;
      return body.replace(/<li>(.*?)<\/li>/g, (m, itemContent) => `${idx++}. ${itemContent}\n`);
    });
    md = md.replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/g, '[$2]($1)');
    md = md.replace(/<br\s*\/?>/g, '\n');
    md = md.replace(/<p>(.*?)<\/p>/g, '$1\n\n');
    md = md.replace(/<\/?[^>]+(>|$)/g, "");
    md = md.replace(/\n{3,}/g, '\n\n');
    return md.trim();
  };

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      let finalContent = text;
      if (file.name.endsWith(".md")) {
        finalContent = mdToHtml(text);
      }
      setContent(finalContent);
      pushToHistory(finalContent);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleExportHTML = () => {
    if (!content.trim()) {
      alert("কন্টেন্ট খালি থাকলে এক্সপোর্ট করা যাবে না।");
      return;
    }

    const blob = new Blob([content], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const filename = slug ? `${slug}.html` : `article-${Date.now()}.html`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Detect block style when selection changes in the editor
  const handleEditorSelectionChange = useCallback(() => {
    detectActiveBlock();
  }, [detectActiveBlock]);

  // Listen for selectionchange events
  useEffect(() => {
    const handler = () => {
      if (editorRef.current && editorRef.current.contains(document.activeElement === editorRef.current ? document.getSelection()?.anchorNode : null)) {
        handleEditorSelectionChange();
      }
    };
    document.addEventListener("selectionchange", handler);
    return () => document.removeEventListener("selectionchange", handler);
  }, [handleEditorSelectionChange]);

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
            margin: "0 28px 20px 28px",
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

        {/* Content - Rich WYSIWYG Editor */}
        <div className="form-group">
          <label>কন্টেন্ট *</label>
          <div className="editor-toolbar-advanced">
            {/* Block formatting dropdown */}
            <div className="toolbar-dropdown-container">
              <button
                type="button"
                className="toolbar-dropdown-trigger"
                onClick={handleDropdownToggle}
                onMouseDown={(e) => e.preventDefault()}
              >
                <span>{activeBlockStyle}</span>
                <i className="fas fa-chevron-down" style={{ fontSize: "10px", marginLeft: "6px" }} />
              </button>
              
              {showBlockDropdown && (
                <div className="toolbar-dropdown-menu">
                  <button
                    type="button"
                    className="toolbar-dropdown-item"
                    onClick={() => {
                      applyBlockStyle("p");
                      setActiveBlockStyle("Paragraph");
                      setShowBlockDropdown(false);
                    }}
                  >
                    <span>Paragraph</span>
                  </button>
                  <button
                    type="button"
                    className="toolbar-dropdown-item"
                    onClick={() => {
                      applyBlockStyle("h1");
                      setActiveBlockStyle("Heading 1");
                      setShowBlockDropdown(false);
                    }}
                  >
                    <span style={{ fontWeight: "bold", fontSize: "14px" }}>H1 Heading 1</span>
                  </button>
                  <button
                    type="button"
                    className="toolbar-dropdown-item"
                    onClick={() => {
                      applyBlockStyle("h2");
                      setActiveBlockStyle("Heading 2");
                      setShowBlockDropdown(false);
                    }}
                  >
                    <span style={{ fontWeight: "bold", fontSize: "13px" }}>H2 Heading 2</span>
                  </button>
                  <button
                    type="button"
                    className="toolbar-dropdown-item"
                    onClick={() => {
                      applyBlockStyle("h3");
                      setActiveBlockStyle("Heading 3");
                      setShowBlockDropdown(false);
                    }}
                  >
                    <span style={{ fontWeight: "bold", fontSize: "12px" }}>H3 Heading 3</span>
                  </button>
                  <button
                    type="button"
                    className="toolbar-dropdown-item"
                    onClick={() => {
                      applyBlockStyle("quote");
                      setActiveBlockStyle("Quote");
                      setShowBlockDropdown(false);
                    }}
                  >
                    <i className="fas fa-quote-left" style={{ fontSize: "11px", marginRight: "6px" }} /> Quote
                  </button>
                  <button
                    type="button"
                    className="toolbar-dropdown-item"
                    onClick={() => {
                      applyBlockStyle("ul");
                      setActiveBlockStyle("Bulleted List");
                      setShowBlockDropdown(false);
                    }}
                  >
                    <i className="fas fa-list-ul" style={{ fontSize: "11px", marginRight: "6px" }} /> Bulleted List
                  </button>
                  <button
                    type="button"
                    className="toolbar-dropdown-item"
                    onClick={() => {
                      applyBlockStyle("ol");
                      setActiveBlockStyle("Numbered List");
                      setShowBlockDropdown(false);
                    }}
                  >
                    <i className="fas fa-list-ol" style={{ fontSize: "11px", marginRight: "6px" }} /> Numbered List
                  </button>
                </div>
              )}
            </div>

            <div className="toolbar-divider" />

            {/* Inline Styles */}
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => execFormat("bold")}
              onMouseDown={(e) => e.preventDefault()}
              title="Bold (Ctrl+B)"
              style={{ fontWeight: "bold" }}
            >
              B
            </button>
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => execFormat("italic")}
              onMouseDown={(e) => e.preventDefault()}
              title="Italic (Ctrl+I)"
              style={{ fontStyle: "italic" }}
            >
              I
            </button>
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => execFormat("underline")}
              onMouseDown={(e) => e.preventDefault()}
              title="Underline"
              style={{ textDecoration: "underline" }}
            >
              U
            </button>
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => execFormat("strikeThrough")}
              onMouseDown={(e) => e.preventDefault()}
              title="Strikethrough"
              style={{ textDecoration: "line-through" }}
            >
              S
            </button>
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => {
                // Wrap selection in <code>
                const sel = window.getSelection();
                if (sel.rangeCount && !sel.isCollapsed) {
                  const range = sel.getRangeAt(0);
                  const code = document.createElement("code");
                  range.surroundContents(code);
                  syncContentFromEditor();
                  const html = editorRef.current?.innerHTML || "";
                  pushToHistory(html);
                }
              }}
              onMouseDown={(e) => e.preventDefault()}
              title="Code"
            >
              &lt;&gt;
            </button>
            <button
              type="button"
              className="toolbar-btn"
              onClick={handleClearFormatting}
              onMouseDown={(e) => e.preventDefault()}
              title="Clear Selection Formatting"
            >
              T
            </button>

            <div className="toolbar-divider" />

            {/* Alignments */}
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => execFormat("justifyLeft")}
              onMouseDown={(e) => e.preventDefault()}
              title="Align Left"
            >
              <i className="fas fa-align-left" />
            </button>
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => execFormat("justifyCenter")}
              onMouseDown={(e) => e.preventDefault()}
              title="Align Center"
            >
              <i className="fas fa-align-center" />
            </button>
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => execFormat("justifyRight")}
              onMouseDown={(e) => e.preventDefault()}
              title="Align Right"
            >
              <i className="fas fa-align-right" />
            </button>

            <div className="toolbar-divider" />

            {/* Link */}
            <button
              type="button"
              className="toolbar-btn"
              onClick={handleInsertLink}
              onMouseDown={(e) => e.preventDefault()}
              title="Insert Link"
            >
              <i className="fas fa-link" />
            </button>

            {/* Undo/Redo & Source/Clear on Right */}
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                type="button"
                className="toolbar-btn"
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                onMouseDown={(e) => e.preventDefault()}
                title="Undo (Ctrl+Z)"
                style={{ opacity: historyIndex <= 0 ? 0.4 : 1, cursor: historyIndex <= 0 ? "not-allowed" : "pointer" }}
              >
                <i className="fas fa-undo" />
              </button>
              <button
                type="button"
                className="toolbar-btn"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                onMouseDown={(e) => e.preventDefault()}
                title="Redo (Ctrl+Y)"
                style={{ opacity: historyIndex >= history.length - 1 ? 0.4 : 1, cursor: historyIndex >= history.length - 1 ? "not-allowed" : "pointer" }}
              >
                <i className="fas fa-redo" />
              </button>
              <button
                type="button"
                className="toolbar-btn"
                onClick={() => setIsPreviewOpen(true)}
                title="প্রিভিউ (Preview)"
                style={{ color: "var(--primary)", borderColor: "rgba(13, 122, 62, 0.3)" }}
              >
                <i className="fas fa-eye" />
              </button>
              <button
                type="button"
                className={`toolbar-btn${isSourceMode ? " toolbar-btn-active" : ""}`}
                onClick={() => {
                  if (isSourceMode) {
                    // Switching from source to WYSIWYG
                    setContent(sourceHtml);
                    pushToHistory(sourceHtml);
                    setIsSourceMode(false);
                  } else {
                    // Switching to source view
                    syncContentFromEditor();
                    setSourceHtml(content);
                    setIsSourceMode(true);
                  }
                }}
                onMouseDown={(e) => e.preventDefault()}
                title={isSourceMode ? "ভিজ্যুয়াল মোডে ফিরুন" : "HTML সোর্স দেখুন"}
                style={isSourceMode ? { background: "var(--primary)", color: "#fff", borderColor: "var(--primary)" } : {}}
              >
                <i className="fas fa-code" />
              </button>
              <button
                type="button"
                className="toolbar-btn-text"
                onClick={handleClearFormatting}
                onMouseDown={(e) => e.preventDefault()}
                title="Clear Formatting"
              >
                Clear formatting
              </button>
            </div>
          </div>

          <div className="wysiwyg-editor-container">
            {isSourceMode ? (
              <textarea
                className="source-code-editor"
                value={sourceHtml}
                onChange={(e) => setSourceHtml(e.target.value)}
                spellCheck={false}
                style={{
                  width: "100%",
                  minHeight: "320px",
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
                  fontSize: "13px",
                  lineHeight: "1.7",
                  padding: "20px",
                  border: "1px solid #e4e6eb",
                  borderTop: "none",
                  borderBottom: "none",
                  borderRadius: "0",
                  resize: "vertical",
                  background: "#1e1e2e",
                  color: "#cdd6f4",
                  outline: "none",
                  tabSize: 2,
                }}
              />
            ) : (
              <div
                ref={editorRef}
                className="wysiwyg-editable"
                contentEditable
                suppressContentEditableWarning
                onInput={handleEditorInput}
                onKeyDown={handleEditorKeyDown}
                onBlur={() => syncContentFromEditor()}
                data-placeholder="আর্টিকেলের মূল কন্টেন্ট এখানে লিখুন..."
                style={{
                  minHeight: "320px",
                  padding: "20px",
                  border: "1px solid #e4e6eb",
                  borderTop: "none",
                  borderBottom: "none",
                  borderRadius: "0",
                  outline: "none",
                  fontSize: "15px",
                  lineHeight: "1.8",
                  color: "#1a1a2e",
                  background: "#ffffff",
                  overflowY: "auto",
                }}
              />
            )}
          </div>

          <div className="editor-footer">
            <div className="editor-counter">
              {getWordAndCharCount().chars} characters | {getWordAndCharCount().words} words
            </div>
            
            <div className="footer-actions">
              <button
                type="button"
                className="footer-btn"
                onClick={() => {
                  setMdText("");
                  setIsMdInOpen(true);
                }}
              >
                MD In
              </button>
              <button
                type="button"
                className="footer-btn footer-btn-green"
                onClick={() => {
                  syncContentFromEditor();
                  const md = htmlToMd(content);
                  setMdText(md);
                  setIsMdOutOpen(true);
                }}
              >
                MD Out
              </button>
              <button
                type="button"
                className="footer-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                Import
              </button>
              <button
                type="button"
                className="footer-btn footer-btn-green"
                onClick={handleExportHTML}
              >
                Export
              </button>
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept=".txt,.md,.html"
            onChange={handleImportFile}
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

      {/* MD In Modal */}
      {isMdInOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "600px" }}>
            <div className="modal-header">
              <h2 style={{ fontSize: "1.2rem", margin: 0, color: "var(--primary-dark)" }}>Markdown ইনপোর্ট করুন</h2>
              <button className="close-btn" onClick={() => setIsMdInOpen(false)} style={{ background: "none", border: "none", fontSize: "1.6rem", cursor: "pointer" }}>&times;</button>
            </div>
            <div style={{ marginTop: "15px" }}>
              <p style={{ fontSize: "13px", color: "#666", marginBottom: "10px" }}>
                এখানে আপনার Markdown টেক্সট পেস্ট করুন। এটি স্বয়ংক্রিয়ভাবে HTML-এ রূপান্তরিত হয়ে এডিটর-এ যোগ হবে।
              </p>
              <textarea
                value={mdText}
                onChange={(e) => setMdText(e.target.value)}
                placeholder="# শিরোনাম&#10;&#10;**বোল্ড টেক্সট** এবং *ইটালিক টেক্সট*..."
                style={{ width: "100%", minHeight: "200px", fontFamily: "monospace", fontSize: "13px", padding: "12px", border: "1px solid #ddd", borderRadius: "6px" }}
              />
              <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button type="button" className="btn btn-secondary btn-compact" onClick={() => setIsMdInOpen(false)}>
                  বাতিল
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-compact"
                  onClick={() => {
                    if (content.trim() && !confirm("বিদ্যমান কন্টেন্ট মুছে ফেলা হবে। আপনি কি নিশ্চিত?")) return;
                    const parsedHtml = mdToHtml(mdText);
                    setContent(parsedHtml);
                    pushToHistory(parsedHtml);
                    setMdText("");
                    setIsMdInOpen(false);
                  }}
                >
                  ইনপোর্ট করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MD Out Modal */}
      {isMdOutOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "600px" }}>
            <div className="modal-header">
              <h2 style={{ fontSize: "1.2rem", margin: 0, color: "var(--primary-dark)" }}>Markdown এক্সপোর্ট করুন</h2>
              <button className="close-btn" onClick={() => setIsMdOutOpen(false)} style={{ background: "none", border: "none", fontSize: "1.6rem", cursor: "pointer" }}>&times;</button>
            </div>
            <div style={{ marginTop: "15px" }}>
              <p style={{ fontSize: "13px", color: "#666", marginBottom: "10px" }}>
                আপনার আর্টিকেলের HTML কন্টেন্ট থেকে জেনারেট করা Markdown নিচে দেওয়া হলো:
              </p>
              <textarea
                readOnly
                value={mdText}
                style={{ width: "100%", minHeight: "200px", fontFamily: "monospace", fontSize: "13px", padding: "12px", border: "1px solid #ddd", borderRadius: "6px", background: "#f9f9f9" }}
                onClick={(e) => e.target.select()}
              />
              <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-compact"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(mdText);
                      alert("Markdown ক্লিপবোর্ডে কপি করা হয়েছে!");
                    } catch (err) {
                      alert("কপি করা সম্ভব হয়নি।");
                    }
                  }}
                >
                  কপি করুন
                </button>
                <button type="button" className="btn btn-primary btn-compact" onClick={() => setIsMdOutOpen(false)}>
                  বন্ধ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
