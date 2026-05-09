import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer" id="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <h4>সাহায্য দরকার?</h4>
            <ul>
              <li>
                <a href="https://www.facebook.com/md.amirulislam.pramanik.7" target="_blank" rel="noopener noreferrer">
                  Md. Amirul Islam Pramanik
                </a>
              </li>
              <li><a href="tel:+8801989449877">+8801989449877</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>অন্যান্য</h4>
            <ul>
              <li><Link href="/contact">আমাদের সম্পর্কে জানুন</Link></li>
              <li><Link href="#">আমাদের পরিষেবা জানুন</Link></li>
              <li><Link href="#">গোপনীয়তা নীতি</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>আমাদের ঠিকানা</h4>
            <ul>
              <li><span>খঞ্জনপুর, জয়পুরহাট</span></li>
              <li><span>বাংলাদেশ</span></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Follow Us</h4>
            <div className="social-links">
              <a href="https://www.facebook.com/" className="social-link" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <i className="fab fa-facebook-f" />
              </a>
              <a href="https://twitter.com/" className="social-link" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <i className="fab fa-twitter" />
              </a>
              <a href="https://www.youtube.com/" className="social-link" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <i className="fab fa-youtube" />
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          © {new Date().getFullYear()} সেবা হোমিও সদন। সর্বস্বত্ব সংরক্ষিত।
        </div>
      </div>
    </footer>
  );
}
