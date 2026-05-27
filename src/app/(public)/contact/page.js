"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ContactPage() {
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const name = document.getElementById("contact-name").value;
    const email = document.getElementById("contact-email").value;
    const subject = document.getElementById("contact-subject").value;
    const message = document.getElementById("contact-message").value;

    try {
      const supabase = createClient();
      const { error: insertError } = await supabase
        .from("contacts")
        .insert([
          {
            name,
            email,
            subject: subject || "কোনো বিষয় নেই",
            message,
            is_read: false
          }
        ]);

      if (insertError) throw insertError;

      setSuccess(true);
      e.target.reset();

      // Hide success message after 5 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err) {
      console.error("Error submitting contact message:", err);
      setError("বার্তাটি পাঠানো যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="contact-hero" id="contact-hero">
        <div className="container">
          <h4>যোগাযোগ করুন</h4>
          <h2>চল একসাথে থাকি!</h2>
        </div>
      </section>

      <div className="container">
        <div className="contact-grid">
          <div className="contact-form" id="contact-form">
            <h2>আমাদের একটি বার্তা পাঠান</h2>
            {success ? (
              <div 
                style={{ 
                  background: "#e8f5e9", 
                  color: "#0d7a3e", 
                  padding: "16px", 
                  borderRadius: "8px", 
                  marginBottom: "20px", 
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                <i className="fas fa-check-circle" style={{ fontSize: "20px" }}></i>
                আপনার বার্তাটি সফলভাবে পাঠানো হয়েছে! ধন্যবাদ।
              </div>
            ) : null}
            {error ? (
              <div 
                style={{ 
                  background: "#ffebee", 
                  color: "#c62828", 
                  padding: "16px", 
                  borderRadius: "8px", 
                  marginBottom: "20px", 
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                <i className="fas fa-exclamation-circle" style={{ fontSize: "20px" }}></i>
                {error}
              </div>
            ) : null}
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <input type="text" placeholder="নাম" required id="contact-name" disabled={loading} />
                </div>
                <div className="form-group">
                  <input type="email" placeholder="ইমেইল" required id="contact-email" disabled={loading} />
                </div>
              </div>
              <div className="form-group">
                <input type="text" placeholder="বিষয়" id="contact-subject" disabled={loading} />
              </div>
              <div className="form-group">
                <textarea placeholder="বার্তা" required id="contact-message" style={{ minHeight: "120px" }} disabled={loading} />
              </div>
              <button type="submit" className="btn btn-accent" id="contact-submit" disabled={loading}>
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin" style={{ marginRight: "8px" }}></i>
                    বার্তা পাঠানো হচ্ছে...
                  </>
                ) : (
                  "বার্তা পাঠান"
                )}
              </button>
            </form>
          </div>

          <div className="contact-info" id="contact-info">
            <h2>যোগাযোগের তথ্য</h2>
            <ul>
              <li>
                <h5>01720970031</h5>
                <span>ফোন নম্বর</span>
              </li>
              <li>
                <h5>amirul1068@gmail.com</h5>
                <span>ইমেইল ঠিকানা</span>
              </li>
              <li>
                <h5>খঞ্জনপুর, জয়পুরহাট<br />বাংলাদেশ</h5>
                <span>রাস্তার ঠিকানা</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="map-container" id="google-map">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14452.090196255396!2d88.99680482504839!3d25.101098024376792!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39fc91e5a27bc89d%3A0xaa1008c50e27f342!2sKhanjanpur!5e0!3m2!1sen!2sbd!4v1622114571933!5m2!1sen!2sbd"
            allowFullScreen
            loading="lazy"
            title="Good Health Homeo Care মানচিত্র"
          />
        </div>
      </div>
    </>
  );
}
