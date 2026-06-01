import Sidebar from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";
import MedicinesList from "./MedicinesList";

export const metadata = {
  title: "ওষুধ পরিচিতি | Good Health Homeo Care",
  description: "হোমিওপ্যাথি ওষুধের তালিকা এবং পরিচিতি। একোনাইটাম নেপেলাস, এ্যাকটিয়া রেসিমোসা সহ বিভিন্ন ওষুধ সম্পর্কে জানুন।",
};

export default async function MedicinesPage() {
  const supabase = await createClient();

  const { data: medicines } = await supabase
    .from("medicines")
    .select("id, name, slug")
    .order("name", { ascending: true });

  return (
    <div className="container">
      <div className="blog-layout">
        <div className="blog-content" id="medicines-list">
          <span className="category">ওষুধ পরিচিতি</span>
          <div className="post-meta">
            <span>মোট ওষুধ: {medicines?.length || 0} টি</span>
          </div>

          <MedicinesList medicines={medicines || []} />

          <div className="post-navigation">
            <div className="post-share">
              <i className="fa fa-share-alt" />
              <a href="https://www.facebook.com/md.amirulislam.pramanik.7" target="_blank" rel="noopener noreferrer">Facebook</a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">Twitter</a>
            </div>
          </div>
        </div>
        <Sidebar />
      </div>
    </div>
  );
}
