import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import MedicineTabs from "./MedicineTabs";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: medicine } = await supabase
    .from("medicines")
    .select("name")
    .eq("slug", slug)
    .single();

  if (!medicine) {
    return { title: "ওষুধ খুঁজে পাওয়া যায়নি | Popular Homeo Center" };
  }

  return {
    title: `${medicine.name} | Popular Homeo Center`,
    description: `${medicine.name} - হোমিওপ্যাথি ওষুধের বিস্তারিত তথ্য ও লক্ষণাবলী।`,
  };
}

export default async function MedicineDetailPage({ params }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: medicine, error } = await supabase
    .from("medicines")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !medicine) {
    notFound();
  }

  // Build tabs array from non-empty content fields
  const tabs = [];
  if (medicine.content_allen) {
    tabs.push({ id: "allen", label: "এলেন", content: medicine.content_allen });
  }
  if (medicine.content_roerick) {
    tabs.push({ id: "roerick", label: "রোরিক", content: medicine.content_roerick });
  }
  if (medicine.content_kent) {
    tabs.push({ id: "kent", label: "কেন্ট", content: medicine.content_kent });
  }
  if (medicine.content_nash) {
    tabs.push({ id: "nash", label: "ন্যাশ", content: medicine.content_nash });
  }
  if (medicine.content_note) {
    tabs.push({ id: "note", label: "হোমিওপ্যাথস নোট", content: medicine.content_note });
  }

  return (
    <div className="container">
      <div className="blog-layout">
        <div className="blog-content" id="medicine-detail">
          <span className="category">{medicine.name}</span>
          <div className="post-meta">
            <span>
              {new Date(medicine.created_at).toLocaleDateString("bn-BD", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>

          {tabs.length > 0 ? (
            <MedicineTabs tabs={tabs} />
          ) : (
            <div style={{
              padding: "40px 20px",
              textAlign: "center",
              background: "#fafafa",
              borderRadius: "12px",
              border: "2px dashed #e0e0e0",
              margin: "20px 0"
            }}>
              <i className="fas fa-file-medical" style={{ fontSize: "36px", color: "#ccc", marginBottom: "12px", display: "block" }} />
              <p style={{ color: "#999", fontSize: "15px", margin: 0 }}>
                এই ওষুধের বিস্তারিত বিবরণ এখনও যুক্ত করা হয়নি।
              </p>
            </div>
          )}

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
