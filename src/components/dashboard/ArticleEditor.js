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

function reconstructLine(items) {
  if (items.length === 0) return "";
  let lineStr = items[0].str || "";
  let lastX = items[0].transform[4];
  let lastWidth = items[0].width || 0;
  
  for (let i = 1; i < items.length; i++) {
    const item = items[i];
    const currStr = item.str || "";
    const currX = item.transform[4];
    
    const hasExplicitSpace = 
      lineStr.endsWith(" ") || 
      currStr.startsWith(" ") || 
      currStr === " " || 
      lineStr === " ";
    
    if (hasExplicitSpace) {
      if (lineStr.endsWith(" ") && currStr.startsWith(" ")) {
        lineStr += currStr.trimStart();
      } else {
        lineStr += currStr;
      }
    } else {
      const gap = currX - (lastX + lastWidth);
      if (gap > 2.5) {
        lineStr += " " + currStr;
      } else {
        lineStr += currStr;
      }
    }
    
    lastX = currX;
    lastWidth = item.width || 0;
  }
  return lineStr;
}

function cleanBanglaPdfText(text) {
  if (!text) return text;

  const replacements = [
    [/\bজীবননের\b/g, "জীবনের"],
    [/\bঅসম্বনেদ্য\b/g, "অবিচ্ছেদ্য"],
    [/\bশারীররক\b/g, "শারীরিক"],
    [/\bসবনশষনের\b/g, "বিশেষজ্ঞের"],
    [/\bসবনশষজ্ঞের\b/g, "বিশেষজ্ঞের"],
    [/\bপ্রনোজন\b/g, "প্রয়োজন"],
    [/\bপ্র নোজন\b/g, "প্রয়োজন"],
    [/\bযকাননা\b/g, "কোনো"],
    [/\bযযখানন\b/g, "যেখানে"],
    [/\bবুঝনত\b/g, "বুঝতে"],
    [/\bবু ঝনত\b/g, "বুঝতে"],
    [/\bপানর\b/g, "পারে"],
    [/\bপানরন\b/g, "পারেন"],
    [/\bস্বাভাববক\b/g, "স্বাভাবিক"],
    [/\bস্ব া ভাববক\b/g, "স্বাভাবিক"],
    [/\bচাপনর\b/g, "চাপের"],
    [/\bসনঙ্গ\b/g, "সঙ্গে"],
    [/\bমাননিয়\b/g, "মানিয়ে"],
    [/\bচলনত\b/g, "চলতে"],
    [/\bকরনত\b/g, "করতে"],
    [/\bকরনল\b/g, "করলে"],
    [/\bথাকনত\b/g, "থাকতে"],
    [/\bথাকনল\b/g, "থাকলে"],
    [/\bথাকব\b/g, "থাকবে"],
    [/\bআপনাকই\b/g, "আপনাকেই"],
    [/\bঅননক\b/g, "অনেক"],
    [/\bমননর\b/g, "মনের"],
    [/\bমনন\b/g, "মনে"],
    [/\bহনত\b/g, "হতে"],
    [/\bহনল\b/g, "হলে"],
    [/\bহনয়\b/g, "হয়ে"],
    [/\bযকবল\b/g, "কেবল"],
    [/\bযরাগ\b/g, "রোগ"],
    [/\bযরাগের\b/g, "রোগের"],
    [/\bযরাগসমূহ\b/g, "রোগসমূহ"],
    [/\bসননে\b/g, "সম্বন্ধে"],
    [/\bিনেতন\b/g, "সচেতন"],
    [/\bঅবনসতর\b/g, "অবণতির"],
    [/\bকারণন\b/g, "কারণে"],
    [/\bজনন্য\b/g, "জন্য"],
    [/\bযপছনন\b/g, "পেছনে"],
    [/\bযজননটিক\b/g, "জেনেটিক"],
    [/\bইতসহি\b/g, "ইতিহাস"],
    [/\bপসরনবশ\b/g, "পরিবেশ"],
    [/\bপসরসস্থত\b/g, "পরিস্থিতি"],
    [/\bপসরসস্থতি\b/g, "পরিস্থিতি"],
    [/\bশশবকালীন\b/g, "শৈশবকালীন"],
    [/\bআোঘাত\b/g, "আঘাত"],
    [/\bsপ্র োজন\b/g, "প্রিয়জন"],
    [/\bসপ্র োজন\b/g, "প্রিয়জন"],
    [/\bহারাননা\b/g, "হারানো"],
    [/\bসশশুদের\b/g, "শিশুদের"],
    [/\bতানদের\b/g, "তাদের"],
    [/\bওেরনর\b/g, "আচরণের"],
    [/\bsদনক\b/g, "দিকে"],
    [/\bসদনক\b/g, "দিকে"],
    [/\bযদওো\b/g, "দেওয়া"],
    [/\bপরসবর্তন\b/g, "পরিবর্তন"],
    [/\bযজদ\b/g, "জেদি"],
    [/\bযানওো\b/g, "যাওয়া"],
    [/\bকাল্পসনক\b/g, "কাল্পনিক"],
    [/\bসনবে\b/g, "বিষয়"],
    [/\bসনমে\b/g, "নিয়ে"],
    [/\bপড়ানশানা\b/g, "পড়াশোনা"],
    [/\bমননানযাগের\b/g, "মনোযোগের"],
    [/\bকানজ\b/g, "কাজে"],
    [/\bসস্পৃহা\b/g, "স্পৃহা"],
    [/\bঅસમস্যা\b/g, "সমস্যা"],
    [/\bসু সনসদষ্ট\b/g, "সুনির্দিষ্ট"],
    [/\bপ্রসত সদনই\b/g, "প্রতিদিনই"],
    [/\bপ্রসত\b/g, "প্রতি"],
    [/\bসডসজটাল\b/g, "ডিজিটাল"],
    [/\bযমাবাইল\b/g, "মোবাইল"],
    [/\bযgমনমর\b/g, "গেমসের"],
    [/\bযগমনমর\b/g, "গেমসের"],
    [/\bঝুঁ নক\b/g, "ঝুঁকে"],
    [/\bযকনড়\b/g, "কেড়ে"],
    [/\bসননল\b/g, "নিলে"],
    [/\bঅসস্থরতা\b/g, "অস্থিরতা"],
    [/\bsনরফ - যকায়ার\b/g, "self-care"],
    [/\bসনরফ - যকায়ার\b/g, "self-care"],
    [/\bsনরফ\b/g, "self"],
    [/\bসনরফ\b/g, "self"],
    [/\bযকায়ার\b/g, "care"],
    [/\bমানসিকভাবব\b/g, "মানসিকভাবে"],
    [/\bপযাপ্ত\b/g, "পর্যাপ্ত"],
    [/\bsু সম\b/g, "সুষম"],
    [/\bসু সম\b/g, "সুষম"],
    [/\bব্যোম\b/g, "ব্যায়াম"],
    [/\bযথনক\b/g, "থেকে"],
    [/\bএনডরফিন\b/g, "এন্ডোরফিন"],
    [/\bহরনমান\b/g, "হরমোন"],
    [/\bআমঞ্জস্যতা\b/g, "সামঞ্জস্যতা"],
    [/\bঅসস্থূ\b/g, "অসুস্থ"],
    [/\bsডনপ্রশন\b/g, "ডিপ্রেশন"],
    [/\bসডনপ্রশন\b/g, "ডিপ্রেশন"],
    [/\bsবদ্বেগতা\b/g, "উদ্বেগ"],
    [/\bসবদ্বেগতা\b/g, "উদ্বেগ"],
    [/\bsবদ্বেগ\b/g, "উদ্বিগ্ন"],
    [/\bসবদ্বেগ\b/g, "উদ্বিগ্ন"],
    [/\bপাওো\b/g, "পাওয়া"],
    [/\bহওো\b/g, "হওয়া"],
    [/\bখাওো\b/g, "খাওয়া"],
    [/\bখাদ্যাভ্যানি\b/g, "খাদ্যাভ্যাসে"],
    [/\bসননজনক\b/g, "নিজেকে"],
    [/\bঅসনদ্রা\b/g, "অনিদ্রা"],
    [/\bঅসতসর্ক\b/g, "অতিরিক্ত"],
    [/\bলক্ষণ নলা\b/g, "লক্ষণগুলো"],
    [/\bলক্ষণ িব\b/g, "লক্ষণ বা"],
    
    [/ যকবল /g, " কেবল "],
    [/ যকাননা /g, " কোনো "],
    [/ যরাগ /g, " রোগ "],
    [/ যরাগের /g, " রোগের "],
    [/ যরাগসমূহ /g, " রোগসমূহ "],
    [/ যযখানন /g, " যেখানে "],
    [/ বুঝনত /g, " বুঝতে "],
    [/ পানর /g, " পারে "],
    [/ পানরন /g, " পারেন "],
    [/ করব /g, " করবে "],
    [/ করব ন /g, " করবেন "],
    [/ করবন /g, " করবেন "],
    [/ স্বাভাববক /g, " স্বাভাবিক "],
    [/ চাপনর /g, " চাপের "],
    [/ সনঙ্গ /g, " সঙ্গে "],
    [/ মাননিয় /g, " মানিয়ে "],
    [/ চলনত /g, " চলতে "],
    [/ করনত /g, " করতে "],
    [/ করনল /g, " করলে "],
    [/ থাকনত /g, " থাকতে "],
    [/ থাকনল /g, " থাকলে "],
    [/ থাকব /g, " থাকবে "],
    [/ আপনাকই /g, " আপনাকেই "],
    [/ অননক /g, " অনেক "],
    [/ মননর /g, " মনের "],
    [/ মনন /g, " মনে "],
    [/ হনত /g, " হতে "],
    [/ হনল /g, " হলে "],
    [/ হনয় /g, " হয়ে "],
    [/ সননে /g, " সম্বন্ধে "],
    [/ িনেতন /g, " সচেতন "],
    [/ কারণন /g, " কারণে "],
    [/ যপছনন /g, " পেছনে "],
    [/ যজননটিক /g, " জেনেটিক "],
    [/ ইতসহি /g, " ইতিহাস "],
    [/ পসরনবশ /g, " পরিবেশ "],
    [/ পসরসস্থত /g, " परिस्थिति "],
    [/ সপ্র োজন /g, " প্রিয়জন "],
    [/ হারাননা /g, " হারানো "],
    [/ সশশুদের /g, " শিশুদের "],
    [/ তানদের /g, " তাদের "],
    [/ সদনক /g, " দিকে "],
    [/ যদওো /g, " দেওয়া "],
    [/ পরসবর্তন /g, " পরিবর্তন "],
    [/ যজদ /g, " জেদি "],
    [/ যানওো /g, " যাওয়া "],
    [/ কাল্পসনক /g, " কাল্পনিক "],
    [/ সনবে /g, " বিষয় "],
    [/ সনমে /g, " নিয়ে "],
    [/ পড়ানশানা /g, " পড়াশোনা "],
    [/ মননানযাগের /g, " মনোযোগের "],
    [/ কানজ /g, " কাজে "],
    [/ সু সনসদষ্ট /g, " সুনির্দিষ্ট "],
    [/ প্রসত সদনই /g, " প্রতিদিনই "],
    [/ প্রসত /g, " প্রতি "],
    [/ সডসজটাল /g, " ডিজিটাল "],
    [/ যমাবাইল /g, " মোবাইল "],
    [/ যgমনমর /g, " গেমসের "],
    [/ যগমনমর /g, " গেমসের "],
    [/ ঝুঁ নক /g, " ঝুঁক "],
    [/ যকনড় /g, " কেড়ে "],
    [/ সননল /g, " নিলে "],
    [/ অসস্থরতা /g, " অস্থিরতা "],
    [/ পযাপ্ত /g, " পর্যাপ্ত "],
    [/ সু সম /g, " সুষম "],
    [/ ব্যোম /g, " ব্যায়াম "],
    [/ যথনক /g, " থেকে "],
    [/ হরনমান /g, " হরমোন "],
    [/ সবদ্বেগতা /g, " উদ্বেগ "],
    [/ সবদ্বেগ /g, " উদ্বিগ্ন "],
    [/ পাওো /g, " পাওয়া "],
    [/ হওো /g, " হওয়া "],
    [/ খাওো /g, " খাওয়া "],
    [/ সননজনক /g, " নিজেকে "],
    [/ অসনদ্রা /g, " অনিদ্রা "],
    [/ অসতসর্ক /g, " অতিরিক্ত "],
    [/ লক্ষণ নলা /g, " লক্ষণগুলো "],
    [/ লক্ষণ িব /g, " লক্ষণ বা "],
  ];

  let cleaned = text;
  for (const [pattern, replacement] of replacements) {
    cleaned = cleaned.replace(pattern, replacement);
  }
  
  // Specific contextual replacements
  cleaned = cleaned.replace(/ না থাকা নে\b/g, " না থাকা নয়");
  cleaned = cleaned.replace(/ ততটা নে\b/g, " ততটা নয়");
  cleaned = cleaned.replace(/ যরাগ না থাকা নে\b/g, " রোগ না থাকা নয়");
  cleaned = cleaned.replace(/ ঠিক ততটা নে\b/g, " ঠিক ততটা নয়");
  cleaned = cleaned.replace(/ থাকা নে\b/g, " থাকা নয়");
  cleaned = cleaned.replace(/িব িমে/g, "সব সময়");
  cleaned = cleaned.replace(/অসস্থূ/g, "অসুস্থ");
  cleaned = cleaned.replace(/হনে/g, "হয়");

  return cleaned;
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
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [history, setHistory] = useState([article?.content || ""]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isMdInOpen, setIsMdInOpen] = useState(false);
  const [isMdOutOpen, setIsMdOutOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [mdText, setMdText] = useState("");
  const [isSourceMode, setIsSourceMode] = useState(false);
  const [sourceHtml, setSourceHtml] = useState("");
  const [importing, setImporting] = useState(false);
  const [userRole, setUserRole] = useState("author");

  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const savedSelectionRangeRef = useRef(null);
  const historyIndexRef = useRef(0);
  const historyRef = useRef([article?.content || ""]);
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
      const currentCatId = article?.category_id;
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
      if (res?.data?.id) {
        setSelectedTopicId(res.data.id);
      }
      
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
        const { data: profiles } = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("id", user.id);

        const profile = profiles?.[0];

        if (profile?.role) {
          setUserRole(profile.role);
        }

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

  // Close export dropdown on outside click
  useEffect(() => {
    if (!showExportDropdown) return;
    const handleClose = () => setShowExportDropdown(false);
    window.addEventListener("click", handleClose);
    return () => window.removeEventListener("click", handleClose);
  }, [showExportDropdown]);

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
      historyRef.current = updated;
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

  const handleUndo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      const nextIndex = historyIndexRef.current - 1;
      historyIndexRef.current = nextIndex;
      setHistoryIndex(nextIndex);
      const restoredContent = historyRef.current[nextIndex];
      setContent(restoredContent);
      if (editorRef.current) {
        editorRef.current.innerHTML = restoredContent;
      }
      setTimeout(() => {
        if (editorRef.current) editorRef.current.focus();
      }, 0);
    }
  }, []);

  const handleRedo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      const nextIndex = historyIndexRef.current + 1;
      historyIndexRef.current = nextIndex;
      setHistoryIndex(nextIndex);
      const restoredContent = historyRef.current[nextIndex];
      setContent(restoredContent);
      if (editorRef.current) {
        editorRef.current.innerHTML = restoredContent;
      }
      setTimeout(() => {
        if (editorRef.current) editorRef.current.focus();
      }, 0);
    }
  }, []);

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
    // Save current selection range before losing focus to the modal
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
      savedSelectionRangeRef.current = sel.getRangeAt(0).cloneRange();
    } else {
      savedSelectionRangeRef.current = null;
    }
    setLinkUrl("");
    setIsLinkModalOpen(true);
  };

  const handleConfirmLink = () => {
    const url = linkUrl.trim();
    if (!url) {
      setIsLinkModalOpen(false);
      return;
    }

    // Restore selection in the editor
    if (editorRef.current) editorRef.current.focus();
    const sel = window.getSelection();
    if (savedSelectionRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedSelectionRangeRef.current);
    }

    const formattedUrl = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
    document.execCommand("createLink", false, formattedUrl);

    // Set target="_blank" on the created link
    if (sel.rangeCount) {
      const range = sel.getRangeAt(0);
      let linkEl = range.startContainer;
      while (linkEl && linkEl.tagName !== "A") linkEl = linkEl.parentNode;
      if (linkEl?.tagName === "A") linkEl.setAttribute("target", "_blank");
    }

    syncContentFromEditor();
    const html = editorRef.current?.innerHTML || "";
    pushToHistory(html === "<br>" || html === "<div><br></div>" ? "" : html);
    setIsLinkModalOpen(false);
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
    const chars = cleanText.length;
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

  const handleImportFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    setImporting(true);
    setError(null);

    try {
      // DOCX import via mammoth
      if (fileName.endsWith(".docx")) {
        const mammothModule = await import("mammoth");
        // Handle both default and named export patterns
        const mammoth = mammothModule.default || mammothModule;
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        const finalContent = result.value || "";
        if (result.messages?.length) {
          console.warn("Mammoth warnings:", result.messages);
        }
        setContent(finalContent);
        pushToHistory(finalContent);
        if (editorRef.current) editorRef.current.innerHTML = finalContent;
      }
      // Unsupported .doc format (old Word binary format)
      else if (fileName.endsWith(".doc")) {
        setError("পুরানো .doc ফরম্যাট সাপোর্ট করে না। দয়া করে ফাইলটি .docx ফরম্যাটে সংরক্ষণ করে আবার চেষ্টা করুন।");
      }
      // PDF import via pdfjs-dist
      else if (fileName.endsWith(".pdf")) {
        const extractTextFromPDF = async (pdfObj) => {
          const totalPages = pdfObj.numPages;
          const allParagraphs = [];

          for (let i = 1; i <= totalPages; i++) {
            const page = await pdfObj.getPage(i);
            const textContent = await page.getTextContent();
            
            // Group text items into lines based on Y position
            const lines = [];
            let currentLineItems = [];
            let lastY = null;

            for (const item of textContent.items) {
              if (item.str === undefined || item.str === null) continue;
              const y = Math.round(item.transform[5]);
              if (lastY !== null && Math.abs(y - lastY) > 3) {
                // New line detected
                if (currentLineItems.length > 0) {
                  lines.push(reconstructLine(currentLineItems));
                }
                currentLineItems = [item];
              } else {
                currentLineItems.push(item);
              }
              lastY = y;
            }
            if (currentLineItems.length > 0) {
              lines.push(reconstructLine(currentLineItems));
            }

            // Group consecutive lines into paragraphs (blank-line separated)
            let currentParagraph = [];
            for (const line of lines) {
              if (line.trim() === "") {
                if (currentParagraph.length > 0) {
                  allParagraphs.push(`<p>${cleanBanglaPdfText(currentParagraph.join(" "))}</p>`);
                  currentParagraph = [];
                }
              } else {
                currentParagraph.push(line.trim());
              }
            }
            if (currentParagraph.length > 0) {
              allParagraphs.push(`<p>${cleanBanglaPdfText(currentParagraph.join(" "))}</p>`);
            }
          }

          return allParagraphs.join("\n");
        };

        try {
          const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

          // Point to the pre-copied worker in /public
          if (typeof window !== "undefined") {
            pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
          }

          const arrayBuffer = await file.arrayBuffer();
          const loadingTask = pdfjsLib.getDocument({
            data: new Uint8Array(arrayBuffer),
            useWorkerFetch: false,
            isEvalSupported: false,
            useSystemFonts: true,
          });

          const pdf = await loadingTask.promise;
          const finalContent = await extractTextFromPDF(pdf);

          if (!finalContent.trim()) {
            setError("PDF ফাইল থেকে কোনো টেক্সট বের করা যায়নি। ছবি-ভিত্তিক PDF সাপোর্ট করে না।");
          } else {
            setContent(finalContent);
            pushToHistory(finalContent);
            if (editorRef.current) editorRef.current.innerHTML = finalContent;
          }
        } catch (pdfErr) {
          console.error("PDF import error:", pdfErr);

          // Fallback: try with worker disabled
          try {
            const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
            pdfjsLib.GlobalWorkerOptions.workerSrc = "";

            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({
              data: new Uint8Array(arrayBuffer),
              disableWorker: true,
              useWorkerFetch: false,
              isEvalSupported: false,
              useSystemFonts: true,
            });

            const pdf = await loadingTask.promise;
            const finalContent = await extractTextFromPDF(pdf);

            if (!finalContent.trim()) {
              setError("PDF ফাইল থেকে কোনো টেক্সট বের করা যায়নি। ছবি-ভিত্তিক PDF সাপোর্ট করে না।");
            } else {
              setContent(finalContent);
              pushToHistory(finalContent);
              if (editorRef.current) editorRef.current.innerHTML = finalContent;
            }
          } catch (fallbackErr) {
            console.error("PDF fallback error:", fallbackErr);
            throw new Error("PDF ইনপোর্টে সমস্যা হয়েছে। দয়া করে ফাইলটি .docx বা .txt ফরম্যাটে রূপান্তর করে আবার চেষ্টা করুন।");
          }
        }
      }
      // Markdown import
      else if (fileName.endsWith(".md")) {
        const text = await file.text();
        const finalContent = mdToHtml(text);
        setContent(finalContent);
        pushToHistory(finalContent);
        if (editorRef.current) editorRef.current.innerHTML = finalContent;
      }
      // Plain text (.txt)
      else if (fileName.endsWith(".txt")) {
        const text = await file.text();
        // Convert plain text lines into paragraphs
        const paragraphs = text.split(/\n\s*\n/).filter(Boolean);
        const finalContent = paragraphs.map(p => `<p>${p.replace(/\n/g, "<br/>")}</p>`).join("\n");
        setContent(finalContent);
        pushToHistory(finalContent);
        if (editorRef.current) editorRef.current.innerHTML = finalContent;
      }
      // HTML import
      else if (fileName.endsWith(".html") || fileName.endsWith(".htm")) {
        const text = await file.text();
        setContent(text);
        pushToHistory(text);
        if (editorRef.current) editorRef.current.innerHTML = text;
      }
      // Unsupported format
      else {
        setError("এই ফাইল ফরম্যাট সাপোর্ট করে না। .docx, .pdf, .txt, .md, বা .html ফাইল ব্যবহার করুন।");
      }
    } catch (err) {
      console.error("Import error:", err);
      setError(`ফাইল ইনপোর্টে ত্রুটি: ${err.message || "অজানা সমস্যা"}`);
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  const triggerFileDownload = (blobContent, mimeType, filename) => {
    const blob = new Blob([blobContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportHTML = () => {
    if (!content.trim()) {
      alert("কন্টেন্ট খালি থাকলে এক্সপোর্ট করা যাবে না।");
      return;
    }
    const fullHtml = `<!DOCTYPE html>\n<html lang="bn">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>${title || "Article"}</title>\n<style>body{font-family:sans-serif;max-width:800px;margin:2rem auto;padding:0 1rem;line-height:1.8;color:#1a1a2e}h1,h2,h3{color:#0d7a3e}blockquote{border-left:4px solid #0d7a3e;padding:8px 16px;margin:16px 0;background:#f9f9f9}img{max-width:100%;height:auto}</style>\n</head>\n<body>\n<h1>${title || ""}</h1>\n${content}\n</body>\n</html>`;
    const filename = slug ? `${slug}.html` : `article-${Date.now()}.html`;
    triggerFileDownload(fullHtml, "text/html;charset=utf-8;", filename);
    setShowExportDropdown(false);
  };

  const handleExportMd = () => {
    if (!content.trim()) {
      alert("কন্টেন্ট খালি থাকলে এক্সপোর্ট করা যাবে না।");
      return;
    }
    const md = `# ${title || "Article"}\n\n${htmlToMd(content)}`;
    const filename = slug ? `${slug}.md` : `article-${Date.now()}.md`;
    triggerFileDownload(md, "text/markdown;charset=utf-8;", filename);
    setShowExportDropdown(false);
  };

  const handleExportTxt = () => {
    if (!content.trim()) {
      alert("কন্টেন্ট খালি থাকলে এক্সপোর্ট করা যাবে না।");
      return;
    }
    const plainText = content.replace(/<\/?[^>]+(>|$)/g, " ").replace(/\s+/g, " ").trim();
    const txt = `${title || "Article"}\n${"-".repeat(40)}\n\n${plainText}`;
    const filename = slug ? `${slug}.txt` : `article-${Date.now()}.txt`;
    triggerFileDownload(txt, "text/plain;charset=utf-8;", filename);
    setShowExportDropdown(false);
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
      // Always sync content from the editor DOM before saving
      let finalContent = content;
      if (isSourceMode) {
        finalContent = sourceHtml;
      } else if (editorRef.current) {
        const html = editorRef.current.innerHTML;
        finalContent = html === "<br>" || html === "<div><br></div>" ? "" : html;
      }

      if (!title.trim()) {
        setError("শিরোনাম আবশ্যক");
        document.querySelector(".article-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      if (!finalContent.trim()) {
        setError("কন্টেন্ট আবশ্যক");
        document.querySelector(".article-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      setSaving(true);
      setError(null);

      try {
        const supabase = createClient();
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          console.error("[ArticleEditor] Auth error:", authError);
        }

        if (!user) {
          setError("আপনি লগইন করেননি। দয়া করে পেজটি রিফ্রেশ করে আবার লগইন করুন।");
          setSaving(false);
          document.querySelector(".article-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }

        // Fetch author name from profile
        const { data: profiles } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id);
        const profile = profiles?.[0];

        let articleSlug = slug.trim() || generateSlug(title);

        const articleData = {
          title: title.trim(),
          slug: articleSlug,
          category_id: categoryId || null,
          excerpt: excerpt.trim() || title.trim().substring(0, 160),
          content: finalContent.trim(),
          cover_image: coverImage.trim() || null,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          status,
          author_id: article?.author_id || user.id,
          author_name:
            article?.author_name || authorName || profile?.full_name || user.email?.split("@")[0] || "Unknown",
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
            .select();
        } else {
          // Insert new
          result = await supabase
            .from("articles")
            .insert(articleData)
            .select();

          // Handle duplicate slug conflict: retry with a unique suffix
          if (result.error && (result.error.code === "23505" || result.error.message?.includes("duplicate") || result.error.message?.includes("unique"))) {
            console.warn("[ArticleEditor] Slug conflict detected, retrying with unique suffix...");
            articleData.slug = `${articleSlug}-${Date.now().toString(36)}`;
            result = await supabase
              .from("articles")
              .insert(articleData)
              .select();
          }
        }

        if (result.error) {
          console.error("[ArticleEditor] Supabase error:", result.error);
          if (result.error.message?.includes("articles_category_id_fkey")) {
            throw new Error("নির্বাচিত বিভাগটি ডাটাবেসে পাওয়া যায়নি। দয়া করে পেজটি রিফ্রেশ করে আবার চেষ্টা করুন।");
          }
          if (result.error.code === "23505") {
            throw new Error("এই স্লাগ/URL ইতিমধ্যে বিদ্যমান আছে। দয়া করে স্লাগটি পরিবর্তন করে আবার চেষ্টা করুন।");
          }
          if (result.error.code === "42501" || result.error.message?.includes("policy")) {
            throw new Error("আপনার এই কাজটি করার অনুমতি নেই। দয়া করে পেজটি রিফ্রেশ করে আবার চেষ্টা করুন।");
          }
          throw new Error(result.error.message || "সংরক্ষণে ত্রুটি হয়েছে");
        }

        const savedArticle = result.data?.[0];
        if (!savedArticle) {
          console.error("[ArticleEditor] Save returned empty data. RLS may be blocking. Result:", JSON.stringify(result));
          throw new Error("সংরক্ষণ করতে ব্যর্থ হয়েছে। সম্ভবত আপনার এই লেখাটি পরিবর্তন করার অনুমতি নেই বা সেশন এক্সপায়ার হয়েছে। পেজটি রিফ্রেশ করে আবার চেষ্টা করুন।");
        }

        onSave?.(savedArticle);
      } catch (err) {
        console.error("[ArticleEditor] Save failed:", err);
        setError(err.message || "সংরক্ষণে ত্রুটি হয়েছে");
        document.querySelector(".article-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
      } finally {
        setSaving(false);
      }
    },
    [title, slug, categoryId, excerpt, content, coverImage, tags, article, onSave, authorName, isSourceMode, sourceHtml]
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

            {coverImage && (
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
                disabled={importing}
                style={importing ? { opacity: 0.7, cursor: "wait" } : {}}
              >
                {importing ? (
                  <><i className="fas fa-spinner fa-spin" style={{ marginRight: "5px" }} /> ইনপোর্ট হচ্ছে...</>
                ) : (
                  <>Import</>
                )}
              </button>
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  className="footer-btn footer-btn-green"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowExportDropdown((prev) => !prev);
                  }}
                >
                  Export <i className="fas fa-chevron-up" style={{ fontSize: "9px", marginLeft: "4px" }} />
                </button>
                {showExportDropdown && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "100%",
                      right: 0,
                      marginBottom: "4px",
                      background: "#fff",
                      border: "1px solid #e4e6eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                      minWidth: "160px",
                      zIndex: 100,
                      overflow: "hidden",
                    }}
                  >
                    <button
                      type="button"
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "10px 16px",
                        border: "none",
                        background: "transparent",
                        textAlign: "left",
                        cursor: "pointer",
                        fontSize: "13px",
                        color: "#333",
                      }}
                      onMouseOver={(e) => e.target.style.background = "#f0faf5"}
                      onMouseOut={(e) => e.target.style.background = "transparent"}
                      onClick={handleExportHTML}
                    >
                      <i className="fas fa-code" style={{ marginRight: "8px", color: "#0d7a3e" }} />
                      HTML ফাইল (.html)
                    </button>
                    <button
                      type="button"
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "10px 16px",
                        border: "none",
                        background: "transparent",
                        textAlign: "left",
                        cursor: "pointer",
                        fontSize: "13px",
                        color: "#333",
                        borderTop: "1px solid #f0f0f0",
                      }}
                      onMouseOver={(e) => e.target.style.background = "#f0faf5"}
                      onMouseOut={(e) => e.target.style.background = "transparent"}
                      onClick={handleExportMd}
                    >
                      <i className="fas fa-hashtag" style={{ marginRight: "8px", color: "#0d7a3e" }} />
                      Markdown (.md)
                    </button>
                    <button
                      type="button"
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "10px 16px",
                        border: "none",
                        background: "transparent",
                        textAlign: "left",
                        cursor: "pointer",
                        fontSize: "13px",
                        color: "#333",
                        borderTop: "1px solid #f0f0f0",
                      }}
                      onMouseOver={(e) => e.target.style.background = "#f0faf5"}
                      onMouseOut={(e) => e.target.style.background = "transparent"}
                      onClick={handleExportTxt}
                    >
                      <i className="fas fa-file-alt" style={{ marginRight: "8px", color: "#0d7a3e" }} />
                      Plain Text (.txt)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept=".doc,.docx,.pdf,.txt,.md,.html,.htm"
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
          {(userRole === "admin" || userRole === "super_admin") ? (
            <button
              className="btn btn-primary btn-compact"
              onClick={() => handleSave("published")}
              disabled={saving}
            >
              <i className="fas fa-globe" /> প্রকাশ করুন
            </button>
          ) : (
            <button
              className="btn btn-primary btn-compact"
              onClick={() => {
                // Authors can't save as "published", so demote "published" to "draft"
                const targetStatus = article?.status === "published" ? "draft" : (article?.status || "draft");
                handleSave(targetStatus);
              }}
              disabled={saving}
            >
              <i className="fas fa-save" /> সংরক্ষণ করুন
            </button>
          )}
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

      {/* Link Modal */}
      {isLinkModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "450px" }}>
            <div className="modal-header">
              <h2 style={{ fontSize: "1.2rem", margin: 0, color: "var(--primary-dark)" }}>লিংক যোগ করুন</h2>
              <button className="close-btn" onClick={() => setIsLinkModalOpen(false)} style={{ background: "none", border: "none", fontSize: "1.6rem", cursor: "pointer" }}>&times;</button>
            </div>
            <div style={{ marginTop: "15px" }}>
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600", color: "#333" }}>লিংক ইউআরএল (URL)</label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleConfirmLink();
                    }
                  }}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px" }}
                />
              </div>
              <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button type="button" className="btn btn-secondary btn-compact" onClick={() => setIsLinkModalOpen(false)}>
                  বাতিল
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-compact"
                  onClick={handleConfirmLink}
                >
                  যোগ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
