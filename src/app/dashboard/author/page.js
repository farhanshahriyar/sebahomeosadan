"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthorDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/posts");
  }, [router]);

  return (
    <div style={{ padding: "100px", textAlign: "center", color: "#999" }}>
      <i className="fas fa-spinner fa-spin" style={{ fontSize: "32px", color: "var(--primary)" }} />
      <p style={{ marginTop: "16px" }}>রিডাইরেক্ট করা হচ্ছে...</p>
    </div>
  );
}
