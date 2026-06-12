"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

const DEFAULT_CONFIG = {
  site_name: "Popular Homeo Center",
  site_tagline: "হোমিওপ্যাথি চিকিৎসা সেবা",
  site_description: "আপনার সঠিক সিদ্ধান্তই আপনাকে রাখতে পারে সুস্থ এবং সুরক্ষিত।",
  contact_email: "",
  contact_phone: "+8801720970031",
  contact_address: "",
  meta_title: "Popular Homeo Center | Homeopathy",
  meta_description: "Popular Homeo Center - হোমিওপ্যাথি চিকিৎসা সেবা।",
  meta_keywords: "homeopathy, homeo, হোমিও, চিকিৎসা",
  primary_color: "#0d7a3e",
  accent_color: "#f48840",
  logo_url: "",
  favicon_url: "",
  facebook_url: "",
  youtube_url: "",
  twitter_url: "",
  instagram_url: "",
  posts_per_page: 10,
  enable_comments: false,
  enable_search: true,
  show_author_name: true,
  show_reading_time: true,
  default_article_status: "draft",
  maintenance_mode: false,
  maintenance_message: "সাইটটি রক্ষণাবেক্ষণের জন্য বন্ধ রয়েছে। শীঘ্রই ফিরে আসব।",
};

/* ---- reusable tiny components ---- */
function ToggleSwitch({ checked, onChange, id }) {
  return (
    <label className="cfg-toggle" htmlFor={id}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="cfg-toggle-slider" />
    </label>
  );
}

function FieldGroup({ label, icon, hint, children }) {
  return (
    <div className="cfg-field">
      <label className="cfg-label">
        {icon && <i className={icon} />}
        {label}
      </label>
      {children}
      {hint && <span className="cfg-hint">{hint}</span>}
    </div>
  );
}

/* ---- Tab definitions ---- */
const TAB_SECTIONS = [
  { key: "identity", icon: "fas fa-id-badge", label: "Site Identity" },
  { key: "seo", icon: "fas fa-search", label: "SEO & Meta" },
  { key: "appearance", icon: "fas fa-palette", label: "Appearance" },
  { key: "social", icon: "fas fa-share-alt", label: "Social Links" },
  { key: "content", icon: "fas fa-newspaper", label: "Content" },
  { key: "maintenance", icon: "fas fa-tools", label: "Maintenance" },
];

export default function ConfigurationPage() {
  const supabase = createClient();
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [originalConfig, setOriginalConfig] = useState(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("identity");
  const [toast, setToast] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [tableExists, setTableExists] = useState(true);

  // Show toast notification
  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Fetch config
  useEffect(() => {
    async function loadConfig() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("site_config")
          .select("*")
          .eq("id", 1)
          .single();

        if (error) {
          if (error.code === "PGRST116" || error.message?.includes("does not exist") || error.code === "42P01") {
            setTableExists(false);
          }
          console.error("Error loading config:", error);
        } else if (data) {
          const cleaned = { ...DEFAULT_CONFIG };
          Object.keys(DEFAULT_CONFIG).forEach((key) => {
            if (data[key] !== undefined && data[key] !== null) {
              cleaned[key] = data[key];
            }
          });
          setConfig(cleaned);
          setOriginalConfig(cleaned);
        }
      } catch (err) {
        console.error("Error loading configuration:", err);
      }
      setLoading(false);
    }
    loadConfig();
  }, [supabase]);

  // Track changes
  useEffect(() => {
    const changed = JSON.stringify(config) !== JSON.stringify(originalConfig);
    setHasChanges(changed);
  }, [config, originalConfig]);

  // Update field
  const updateField = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  // Save config
  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("site_config")
        .update({ ...config, updated_at: new Date().toISOString() })
        .eq("id", 1);

      if (error) throw error;

      setOriginalConfig({ ...config });
      setHasChanges(false);
      showToast("কনফিগারেশন সফলভাবে সংরক্ষিত হয়েছে!", "success");
    } catch (err) {
      console.error("Error saving config:", err);
      showToast("সংরক্ষণ ব্যর্থ হয়েছে। আবার চেষ্টা করুন।", "error");
    }
    setSaving(false);
  };

  // Reset
  const handleReset = () => {
    setConfig({ ...originalConfig });
    showToast("পরিবর্তনগুলো রিসেট করা হয়েছে।", "info");
  };

  // Count changes per tab
  const getTabChangeCount = (tabKey) => {
    const tabFields = {
      identity: ["site_name", "site_tagline", "site_description", "contact_email", "contact_phone", "contact_address"],
      seo: ["meta_title", "meta_description", "meta_keywords"],
      appearance: ["primary_color", "accent_color", "logo_url", "favicon_url"],
      social: ["facebook_url", "youtube_url", "twitter_url", "instagram_url"],
      content: ["posts_per_page", "enable_comments", "enable_search", "show_author_name", "show_reading_time", "default_article_status"],
      maintenance: ["maintenance_mode", "maintenance_message"],
    };
    const fields = tabFields[tabKey] || [];
    return fields.filter((f) => JSON.stringify(config[f]) !== JSON.stringify(originalConfig[f])).length;
  };

  /* ========== No Table State ========== */
  if (!loading && !tableExists) {
    return (
      <>
        <div className="dashboard-header">
          <div>
            <h1>Configuration</h1>
            <div className="breadcrumb">
              <a href="/dashboard">Dashboard</a> / Configuration
            </div>
          </div>
        </div>

        <div className="cfg-empty-state">
          <div className="cfg-empty-icon">
            <i className="fas fa-database" />
          </div>
          <h2>Database Table Required</h2>
          <p>
            The <code>site_config</code> table doesn&apos;t exist yet in your Supabase database.
          </p>
          <p style={{ fontSize: "13px", color: "#888", marginTop: "8px" }}>
            Run the <code>supabase-site-config.sql</code> file in your Supabase SQL Editor to create the table, then refresh this page.
          </p>
        </div>
      </>
    );
  }

  /* ========== Loading State ========== */
  if (loading) {
    return (
      <>
        <div className="dashboard-header">
          <div>
            <h1>Configuration</h1>
            <div className="breadcrumb">
              <a href="/dashboard">Dashboard</a> / Configuration
            </div>
          </div>
        </div>
        <div className="cfg-loading">
          <div className="cfg-loading-spinner">
            <div className="cfg-spinner-ring" />
            <i className="fas fa-cog cfg-spinner-icon" />
          </div>
          <p>কনফিগারেশন লোড হচ্ছে...</p>
        </div>
      </>
    );
  }

  /* ========== Main Render ========== */
  return (
    <>
      {/* Toast */}
      {toast && (
        <div className={`cfg-toast cfg-toast-${toast.type}`}>
          <i
            className={`fas ${
              toast.type === "success" ? "fa-check-circle" : toast.type === "error" ? "fa-times-circle" : "fa-info-circle"
            }`}
          />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Configuration</h1>
          <div className="breadcrumb">
            <a href="/dashboard">Dashboard</a> / Configuration
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {hasChanges && (
            <span className="cfg-unsaved-badge">
              <i className="fas fa-circle" /> Unsaved Changes
            </span>
          )}
          <button
            className="btn btn-secondary btn-compact"
            onClick={handleReset}
            disabled={!hasChanges}
            style={{ opacity: hasChanges ? 1 : 0.4 }}
          >
            <i className="fas fa-undo" /> Reset
          </button>
          <button
            className="btn btn-primary btn-compact"
            onClick={handleSave}
            disabled={saving || !hasChanges}
          >
            {saving ? (
              <>
                <i className="fas fa-spinner fa-spin" /> Saving...
              </>
            ) : (
              <>
                <i className="fas fa-save" /> Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Config Layout */}
      <div className="cfg-layout">
        {/* Sidebar Tabs */}
        <div className="cfg-sidebar">
          <div className="cfg-sidebar-header">
            <i className="fas fa-sliders-h" />
            <span>Settings</span>
          </div>
          {TAB_SECTIONS.map((tab) => {
            const changeCount = getTabChangeCount(tab.key);
            return (
              <button
                key={tab.key}
                className={`cfg-tab-btn ${activeTab === tab.key ? "active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <i className={tab.icon} />
                <span>{tab.label}</span>
                {changeCount > 0 && (
                  <span className="cfg-tab-badge">{changeCount}</span>
                )}
              </button>
            );
          })}
          <div className="cfg-sidebar-footer">
            <i className="fas fa-info-circle" />
            <span>Changes are saved to the database and apply site-wide.</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="cfg-content">
          {/* ---- Site Identity ---- */}
          {activeTab === "identity" && (
            <div className="cfg-section cfg-animate-in">
              <div className="cfg-section-header">
                <div className="cfg-section-icon identity">
                  <i className="fas fa-id-badge" />
                </div>
                <div>
                  <h2>Site Identity</h2>
                  <p>Configure your website name, description and contact information.</p>
                </div>
              </div>

              <div className="cfg-card">
                <div className="cfg-card-title">
                  <i className="fas fa-globe" /> Basic Information
                </div>
                <div className="cfg-grid-2">
                  <FieldGroup label="Site Name" icon="fas fa-heading">
                    <input
                      type="text"
                      className="cfg-input"
                      value={config.site_name}
                      onChange={(e) => updateField("site_name", e.target.value)}
                      placeholder="Your site name"
                    />
                  </FieldGroup>
                  <FieldGroup label="Tagline" icon="fas fa-quote-right">
                    <input
                      type="text"
                      className="cfg-input"
                      value={config.site_tagline}
                      onChange={(e) => updateField("site_tagline", e.target.value)}
                      placeholder="Short tagline"
                    />
                  </FieldGroup>
                </div>
                <FieldGroup label="Site Description" icon="fas fa-align-left" hint="A brief description of your website for visitors.">
                  <textarea
                    className="cfg-textarea"
                    rows={3}
                    value={config.site_description}
                    onChange={(e) => updateField("site_description", e.target.value)}
                    placeholder="Describe your website..."
                  />
                </FieldGroup>
              </div>

              <div className="cfg-card">
                <div className="cfg-card-title">
                  <i className="fas fa-phone-alt" /> Contact Details
                </div>
                <div className="cfg-grid-3">
                  <FieldGroup label="Email" icon="fas fa-envelope">
                    <input
                      type="email"
                      className="cfg-input"
                      value={config.contact_email}
                      onChange={(e) => updateField("contact_email", e.target.value)}
                      placeholder="email@example.com"
                    />
                  </FieldGroup>
                  <FieldGroup label="Phone" icon="fas fa-phone">
                    <input
                      type="text"
                      className="cfg-input"
                      value={config.contact_phone}
                      onChange={(e) => updateField("contact_phone", e.target.value)}
                      placeholder="+880..."
                    />
                  </FieldGroup>
                  <FieldGroup label="Address" icon="fas fa-map-marker-alt">
                    <input
                      type="text"
                      className="cfg-input"
                      value={config.contact_address}
                      onChange={(e) => updateField("contact_address", e.target.value)}
                      placeholder="Office address"
                    />
                  </FieldGroup>
                </div>
              </div>
            </div>
          )}

          {/* ---- SEO & Meta ---- */}
          {activeTab === "seo" && (
            <div className="cfg-section cfg-animate-in">
              <div className="cfg-section-header">
                <div className="cfg-section-icon seo">
                  <i className="fas fa-search" />
                </div>
                <div>
                  <h2>SEO & Metadata</h2>
                  <p>Optimize how your site appears in search engine results.</p>
                </div>
              </div>

              <div className="cfg-card">
                <div className="cfg-card-title">
                  <i className="fas fa-search-plus" /> Search Engine Settings
                </div>
                <FieldGroup label="Meta Title" icon="fas fa-heading" hint="Displayed as the browser tab title and in search results.">
                  <input
                    type="text"
                    className="cfg-input"
                    value={config.meta_title}
                    onChange={(e) => updateField("meta_title", e.target.value)}
                    placeholder="Page title for SEO"
                  />
                  <div className="cfg-char-count">{config.meta_title.length}/60</div>
                </FieldGroup>
                <FieldGroup label="Meta Description" icon="fas fa-align-left" hint="A 150-160 character description shown in search results.">
                  <textarea
                    className="cfg-textarea"
                    rows={3}
                    value={config.meta_description}
                    onChange={(e) => updateField("meta_description", e.target.value)}
                    placeholder="Brief description for search engines..."
                  />
                  <div className="cfg-char-count">{config.meta_description.length}/160</div>
                </FieldGroup>
                <FieldGroup label="Keywords" icon="fas fa-tags" hint="Comma-separated keywords relevant to your site.">
                  <input
                    type="text"
                    className="cfg-input"
                    value={config.meta_keywords}
                    onChange={(e) => updateField("meta_keywords", e.target.value)}
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </FieldGroup>
              </div>

              {/* SEO Preview Card */}
              <div className="cfg-card">
                <div className="cfg-card-title">
                  <i className="fas fa-eye" /> Google Search Preview
                </div>
                <div className="cfg-seo-preview">
                  <div className="cfg-seo-url">
                    <i className="fas fa-globe" style={{ color: "#4285f4", marginRight: "8px" }} />
                    <span>popularhomeocenter.com</span>
                  </div>
                  <h3 className="cfg-seo-title">{config.meta_title || "Untitled"}</h3>
                  <p className="cfg-seo-desc">{config.meta_description || "No description provided."}</p>
                </div>
              </div>
            </div>
          )}

          {/* ---- Appearance ---- */}
          {activeTab === "appearance" && (
            <div className="cfg-section cfg-animate-in">
              <div className="cfg-section-header">
                <div className="cfg-section-icon appearance">
                  <i className="fas fa-palette" />
                </div>
                <div>
                  <h2>Appearance</h2>
                  <p>Customize colors, logo and branding for your site.</p>
                </div>
              </div>

              <div className="cfg-card">
                <div className="cfg-card-title">
                  <i className="fas fa-tint" /> Theme Colors
                </div>
                <div className="cfg-grid-2">
                  <FieldGroup label="Primary Color" icon="fas fa-circle" hint="Main brand color used across the site.">
                    <div className="cfg-color-picker">
                      <input
                        type="color"
                        value={config.primary_color}
                        onChange={(e) => updateField("primary_color", e.target.value)}
                        className="cfg-color-input"
                      />
                      <input
                        type="text"
                        className="cfg-input cfg-color-text"
                        value={config.primary_color}
                        onChange={(e) => updateField("primary_color", e.target.value)}
                        placeholder="#000000"
                      />
                      <div className="cfg-color-swatch" style={{ background: config.primary_color }} />
                    </div>
                  </FieldGroup>
                  <FieldGroup label="Accent Color" icon="fas fa-circle" hint="Secondary accent for highlights and buttons.">
                    <div className="cfg-color-picker">
                      <input
                        type="color"
                        value={config.accent_color}
                        onChange={(e) => updateField("accent_color", e.target.value)}
                        className="cfg-color-input"
                      />
                      <input
                        type="text"
                        className="cfg-input cfg-color-text"
                        value={config.accent_color}
                        onChange={(e) => updateField("accent_color", e.target.value)}
                        placeholder="#000000"
                      />
                      <div className="cfg-color-swatch" style={{ background: config.accent_color }} />
                    </div>
                  </FieldGroup>
                </div>

                {/* Live color preview */}
                <div className="cfg-color-preview-bar">
                  <span className="cfg-color-preview-label">Live Preview</span>
                  <div className="cfg-color-preview-row">
                    <div className="cfg-preview-chip" style={{ background: config.primary_color }}>
                      Primary
                    </div>
                    <div className="cfg-preview-chip" style={{ background: config.accent_color }}>
                      Accent
                    </div>
                    <div
                      className="cfg-preview-chip"
                      style={{
                        background: `linear-gradient(135deg, ${config.primary_color}, ${config.accent_color})`,
                      }}
                    >
                      Gradient
                    </div>
                  </div>
                </div>
              </div>

              <div className="cfg-card">
                <div className="cfg-card-title">
                  <i className="fas fa-image" /> Branding Assets
                </div>
                <div className="cfg-grid-2">
                  <FieldGroup label="Logo URL" icon="fas fa-image" hint="Full URL to your logo image.">
                    <input
                      type="url"
                      className="cfg-input"
                      value={config.logo_url}
                      onChange={(e) => updateField("logo_url", e.target.value)}
                      placeholder="https://example.com/logo.png"
                    />
                  </FieldGroup>
                  <FieldGroup label="Favicon URL" icon="fas fa-star" hint="Small icon shown in browser tabs.">
                    <input
                      type="url"
                      className="cfg-input"
                      value={config.favicon_url}
                      onChange={(e) => updateField("favicon_url", e.target.value)}
                      placeholder="https://example.com/favicon.ico"
                    />
                  </FieldGroup>
                </div>
              </div>
            </div>
          )}

          {/* ---- Social Links ---- */}
          {activeTab === "social" && (
            <div className="cfg-section cfg-animate-in">
              <div className="cfg-section-header">
                <div className="cfg-section-icon social">
                  <i className="fas fa-share-alt" />
                </div>
                <div>
                  <h2>Social Links</h2>
                  <p>Connect your social media profiles to your website.</p>
                </div>
              </div>

              <div className="cfg-card">
                <div className="cfg-card-title">
                  <i className="fas fa-link" /> Profile Links
                </div>
                <div className="cfg-social-grid">
                  {[
                    { key: "facebook_url", icon: "fab fa-facebook-f", label: "Facebook", color: "#1877f2", placeholder: "https://facebook.com/yourpage" },
                    { key: "youtube_url", icon: "fab fa-youtube", label: "YouTube", color: "#ff0000", placeholder: "https://youtube.com/@yourchannel" },
                    { key: "twitter_url", icon: "fab fa-twitter", label: "Twitter / X", color: "#1da1f2", placeholder: "https://twitter.com/yourhandle" },
                    { key: "instagram_url", icon: "fab fa-instagram", label: "Instagram", color: "#e4405f", placeholder: "https://instagram.com/yourprofile" },
                  ].map((social) => (
                    <div key={social.key} className="cfg-social-item">
                      <div className="cfg-social-icon-box" style={{ background: social.color }}>
                        <i className={social.icon} />
                      </div>
                      <div className="cfg-social-input-wrap">
                        <label className="cfg-label">{social.label}</label>
                        <input
                          type="url"
                          className="cfg-input"
                          value={config[social.key]}
                          onChange={(e) => updateField(social.key, e.target.value)}
                          placeholder={social.placeholder}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ---- Content Settings ---- */}
          {activeTab === "content" && (
            <div className="cfg-section cfg-animate-in">
              <div className="cfg-section-header">
                <div className="cfg-section-icon content">
                  <i className="fas fa-newspaper" />
                </div>
                <div>
                  <h2>Content Settings</h2>
                  <p>Configure how content is displayed and managed on your site.</p>
                </div>
              </div>

              <div className="cfg-card">
                <div className="cfg-card-title">
                  <i className="fas fa-list" /> Display Options
                </div>
                <FieldGroup label="Posts Per Page" icon="fas fa-th-list" hint="Number of articles to show per page on listing pages.">
                  <div className="cfg-number-input">
                    <button
                      className="cfg-number-btn"
                      onClick={() => updateField("posts_per_page", Math.max(1, config.posts_per_page - 1))}
                    >
                      <i className="fas fa-minus" />
                    </button>
                    <input
                      type="number"
                      className="cfg-input cfg-number-field"
                      value={config.posts_per_page}
                      onChange={(e) => updateField("posts_per_page", Math.max(1, parseInt(e.target.value) || 1))}
                      min={1}
                      max={100}
                    />
                    <button
                      className="cfg-number-btn"
                      onClick={() => updateField("posts_per_page", Math.min(100, config.posts_per_page + 1))}
                    >
                      <i className="fas fa-plus" />
                    </button>
                  </div>
                </FieldGroup>

                <FieldGroup label="Default Article Status" icon="fas fa-tag">
                  <select
                    className="cfg-select"
                    value={config.default_article_status}
                    onChange={(e) => updateField("default_article_status", e.target.value)}
                  >
                    <option value="draft">Draft</option>
                    <option value="review">In Review</option>
                    <option value="published">Published</option>
                  </select>
                </FieldGroup>
              </div>

              <div className="cfg-card">
                <div className="cfg-card-title">
                  <i className="fas fa-toggle-on" /> Feature Toggles
                </div>
                <div className="cfg-toggle-list">
                  <div className="cfg-toggle-row">
                    <div className="cfg-toggle-info">
                      <i className="fas fa-comments" style={{ color: "#3498db" }} />
                      <div>
                        <strong>Enable Comments</strong>
                        <span>Allow readers to leave comments on articles.</span>
                      </div>
                    </div>
                    <ToggleSwitch
                      id="enable_comments"
                      checked={config.enable_comments}
                      onChange={(val) => updateField("enable_comments", val)}
                    />
                  </div>

                  <div className="cfg-toggle-row">
                    <div className="cfg-toggle-info">
                      <i className="fas fa-search" style={{ color: "#2ecc71" }} />
                      <div>
                        <strong>Enable Search</strong>
                        <span>Allow visitors to search through content.</span>
                      </div>
                    </div>
                    <ToggleSwitch
                      id="enable_search"
                      checked={config.enable_search}
                      onChange={(val) => updateField("enable_search", val)}
                    />
                  </div>

                  <div className="cfg-toggle-row">
                    <div className="cfg-toggle-info">
                      <i className="fas fa-user" style={{ color: "#9b59b6" }} />
                      <div>
                        <strong>Show Author Name</strong>
                        <span>Display author name on published articles.</span>
                      </div>
                    </div>
                    <ToggleSwitch
                      id="show_author_name"
                      checked={config.show_author_name}
                      onChange={(val) => updateField("show_author_name", val)}
                    />
                  </div>

                  <div className="cfg-toggle-row">
                    <div className="cfg-toggle-info">
                      <i className="fas fa-clock" style={{ color: "#e67e22" }} />
                      <div>
                        <strong>Show Reading Time</strong>
                        <span>Display estimated reading time for each article.</span>
                      </div>
                    </div>
                    <ToggleSwitch
                      id="show_reading_time"
                      checked={config.show_reading_time}
                      onChange={(val) => updateField("show_reading_time", val)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---- Maintenance Mode ---- */}
          {activeTab === "maintenance" && (
            <div className="cfg-section cfg-animate-in">
              <div className="cfg-section-header">
                <div className={`cfg-section-icon maintenance ${config.maintenance_mode ? "danger" : ""}`}>
                  <i className="fas fa-tools" />
                </div>
                <div>
                  <h2>Maintenance Mode</h2>
                  <p>Take your site offline temporarily for updates or repairs.</p>
                </div>
              </div>

              <div className={`cfg-card ${config.maintenance_mode ? "cfg-card-danger" : ""}`}>
                <div className="cfg-maintenance-toggle-area">
                  <div className="cfg-maintenance-status">
                    <div className={`cfg-maintenance-indicator ${config.maintenance_mode ? "active" : ""}`}>
                      <i className={`fas ${config.maintenance_mode ? "fa-exclamation-triangle" : "fa-check-circle"}`} />
                    </div>
                    <div>
                      <h3>{config.maintenance_mode ? "Maintenance Mode is ON" : "Site is Live"}</h3>
                      <p>
                        {config.maintenance_mode
                          ? "Your site is currently displaying a maintenance page to visitors."
                          : "Your site is accessible to all visitors."}
                      </p>
                    </div>
                  </div>
                  <ToggleSwitch
                    id="maintenance_mode"
                    checked={config.maintenance_mode}
                    onChange={(val) => updateField("maintenance_mode", val)}
                  />
                </div>

                {config.maintenance_mode && (
                  <div className="cfg-maintenance-message-area">
                    <FieldGroup
                      label="Maintenance Message"
                      icon="fas fa-comment-dots"
                      hint="This message will be shown to visitors while your site is offline."
                    >
                      <textarea
                        className="cfg-textarea"
                        rows={3}
                        value={config.maintenance_message}
                        onChange={(e) => updateField("maintenance_message", e.target.value)}
                        placeholder="Your maintenance message..."
                      />
                    </FieldGroup>
                  </div>
                )}
              </div>

              {config.maintenance_mode && (
                <div className="cfg-maintenance-warning">
                  <i className="fas fa-exclamation-circle" />
                  <div>
                    <strong>Warning!</strong>
                    <p>
                      Maintenance mode will prevent all visitors from accessing your site. 
                      Only logged-in administrators will be able to view the site.
                      Make sure to save changes before leaving this page.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
