import Link from "next/link";

export default function Sidebar() {
  return (
    <aside>
      <div className="sidebar-widget">
        <h3>সাম্প্রতিক পোস্ট</h3>
        <ul>
          <li>
            <Link href="/anatomy">
              <h5>এনাটমি, ফিজিওলাজি ও প্যাথলজি</h5>
              <span>May 31, 2020</span>
            </Link>
          </li>
          <li>
            <Link href="/medicines/actea-racemosa">
              <h5>এ্যাকটিয়া রেসিমোসা</h5>
              <span>May 28, 2020</span>
            </Link>
          </li>
          <li>
            <Link href="/medicines/aconitum-napellus">
              <h5>একোনাইটাম নেপেলাস</h5>
              <span>May 14, 2020</span>
            </Link>
          </li>
        </ul>
      </div>

      <div className="sidebar-widget">
        <h3>বিভাগসমূহ</h3>
        <ul>
          <li><Link href="#">স্বাস্থ্য কথা</Link></li>
          <li><Link href="#">হোমিওপ্যাথি</Link></li>
          <li><Link href="/medicines">ওষুধ পরিচিতি</Link></li>
          <li><Link href="#">অর্গানন অব মেডিসিন</Link></li>
          <li><Link href="#">বিবিধ ও প্রসঙ্গে</Link></li>
        </ul>
      </div>

      <div className="sidebar-widget">
        <h3>ট্যাগ</h3>
        <div className="tag-list">
          <Link href="#" className="tag-item">এনাটমি</Link>
          <Link href="#" className="tag-item">ফিজিওলজি</Link>
          <Link href="#" className="tag-item">প্যাথলজি</Link>
          <Link href="#" className="tag-item">হোমিওপ্যাথি</Link>
          <Link href="#" className="tag-item">ওষুধ</Link>
        </div>
      </div>
    </aside>
  );
}
