import Sidebar from "@/components/Sidebar";

export const metadata = {
  title: "এ্যাকটিয়া রেসিমোসা | সেবা হোমিও সদন",
  description: "এ্যাকটিয়া রেসিমোসা [Actea Racemosa] - হোমিওপ্যাথি ওষুধের বিস্তারিত তথ্য।",
};

export default function ActeaRacemosaPage() {
  return (
    <div className="container">
      <div className="blog-layout">
        <div className="blog-content" id="actea-article">
          <span className="category">এ্যাকটিয়া রেসিমোসা [Actea Racemosa]</span>
          <div className="post-meta">
            <span>রবিবার, 30 মে, 2021</span>
            <span>7:30:00 PM</span>
          </div>

          <p>
            এ্যাকটিয়া রেসিমোসা একটি গুরুত্বপূর্ণ হোমিওপ্যাথি ওষুধ যা মূলত নারীদের বিভিন্ন রোগে ব্যবহৃত হয়। এটি বিশেষ করে ঋতুস্রাবজনিত সমস্যা, গর্ভাবস্থায় বিভিন্ন উপসর্গ এবং মানসিক অবসাদে কার্যকর।
          </p>
          <p>
            এই ওষুধের প্রধান বৈশিষ্ট্য হলো পেশী ও স্নায়ুবিক ব্যথা, বিশেষত ঘাড় ও পিঠের ব্যথায় এটি অত্যন্ত কার্যকর। রোগী সাধারণত উদ্বিগ্ন ও অস্থির থাকে এবং ঠান্ডায় রোগ বৃদ্ধি পায়।
          </p>

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
