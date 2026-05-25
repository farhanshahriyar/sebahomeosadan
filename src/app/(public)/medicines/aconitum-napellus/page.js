import Sidebar from "@/components/Sidebar";
import AconitumTabs from "./AconitumTabs";

export const metadata = {
  title: "একোনাইটাম নেপেলাস | Good Health Homeo Care",
  description: "একোনাইটাম নেপেলাস [Aconitum Napellus] - হোমিওপ্যাথি ওষুধের বিস্তারিত তথ্য ও লক্ষণাবলী।",
};

export default function AconitumPage() {
  return (
    <div className="container">
      <div className="blog-layout">
        <div className="blog-content" id="aconitum-article">
          <span className="category">একোনাইটাম নেপেলাস [Aconitum Napellus]</span>
          <div className="post-meta">
            <span>রবিবার, 30 মে, 2021</span>
            <span>7:28:49 PM</span>
          </div>

          <AconitumTabs />

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
