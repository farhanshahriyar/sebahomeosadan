"use client";
import Link from "next/link";

export default function FloatingContact() {
  return (
    <Link href="/contact" className="floating-contact-btn" aria-label="Contact Us">
      <div className="floating-contact-icon">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="currentColor" 
          stroke="none"
          width="24" 
          height="24"
          style={{ display: "block" }}
        >
          <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
        </svg>
      </div>
      <span className="floating-contact-label">যোগাযোগ করুন</span>
    </Link>
  );
}
