"use client";
import { useState, useRef, useCallback } from "react";
import { useUploadThing } from "@/lib/uploadthing";

export default function CoverImageUpload({ value, onChange, label = "কভার ছবি" }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const { startUpload } = useUploadThing("imageUploader", {
    onUploadProgress: (p) => {
      setProgress(p);
    },
    onClientUploadComplete: (res) => {
      if (res && res.length > 0) {
        // The URL comes from the server callback (ufsUrl)
        const url = res[0].ufsUrl || res[0].url;
        onChange(url);
      }
      setUploading(false);
      setProgress(0);
      setError(null);
    },
    onUploadError: (err) => {
      console.error("Upload error:", err);
      setError(err.message || "আপলোড ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
      setUploading(false);
      setProgress(0);
    },
  });

  const handleUpload = useCallback(
    async (file) => {
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("শুধুমাত্র ছবি ফাইল আপলোড করা যাবে।");
        return;
      }

      // Validate file size (4MB)
      if (file.size > 4 * 1024 * 1024) {
        setError("ছবির সাইজ ৪MB এর বেশি হতে পারবে না।");
        return;
      }

      setUploading(true);
      setError(null);
      setProgress(0);

      try {
        await startUpload([file]);
      } catch (err) {
        console.error("Upload error:", err);
        setError("আপলোড ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
        setUploading(false);
        setProgress(0);
      }
    },
    [startUpload]
  );

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleRemove = () => {
    onChange("");
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ─── Preview Mode (image already uploaded) ───
  if (value) {
    return (
      <div className="cover-upload-wrapper">
        <label>{label}</label>
        <div className="cover-preview">
          <div className="cover-preview-image">
            <img src={value} alt="কভার ছবি প্রিভিউ" />
          </div>
          <div className="cover-preview-info">
            <div className="cover-preview-url">
              <i className="fas fa-link" />
              <span>
                {value.length > 55
                  ? value.substring(0, 55) + "..."
                  : value}
              </span>
            </div>
            <div className="cover-preview-actions">
              <button
                type="button"
                className="cover-btn cover-btn-remove"
                onClick={handleRemove}
              >
                <i className="fas fa-trash-alt" /> ছবি সরান
              </button>
              <button
                type="button"
                className="cover-btn cover-btn-change"
                onClick={() => fileInputRef.current?.click()}
              >
                <i className="fas fa-sync-alt" /> পরিবর্তন করুন
              </button>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
        </div>
      </div>
    );
  }

  // ─── Upload Zone (no image yet) ───
  return (
    <div className="cover-upload-wrapper">
      <label>{label}</label>
      <div
        className={`cover-dropzone${dragActive ? " drag-active" : ""}${uploading ? " uploading" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />

        {uploading ? (
          <div className="upload-progress-container">
            <div className="upload-spinner">
              <i className="fas fa-cloud-upload-alt" />
            </div>
            <p className="upload-progress-text">আপলোড হচ্ছে...</p>
            <div className="upload-progress-bar">
              <div
                className="upload-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="upload-progress-percent">{progress}%</span>
          </div>
        ) : (
          <>
            <div className="dropzone-icon">
              <i className="fas fa-cloud-upload-alt" />
            </div>
            <p className="dropzone-text">
              ছবি ড্র্যাগ করে এখানে ছাড়ুন অথবা{" "}
              <span className="dropzone-browse">ব্রাউজ করুন</span>
            </p>
            <p className="dropzone-hint">
              PNG, JPG, WEBP · সর্বোচ্চ ৪MB
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="cover-upload-error">
          <i className="fas fa-exclamation-circle" /> {error}
        </div>
      )}
    </div>
  );
}

