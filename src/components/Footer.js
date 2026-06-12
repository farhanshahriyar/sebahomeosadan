import Link from "next/link";

export default function Footer({ siteConfig }) {
  const siteName = siteConfig?.site_name || "Popular Homeo Center";
  const phone = siteConfig?.contact_phone || "+8801720970031";
  const email = siteConfig?.contact_email || "";
  const address = siteConfig?.contact_address || "খঞ্জনপুর, জয়পুরহাট";

  const facebookUrl = siteConfig?.facebook_url || "https://www.facebook.com/";
  const youtubeUrl = siteConfig?.youtube_url || "https://www.youtube.com/";
  const twitterUrl = siteConfig?.twitter_url || "https://twitter.com/";
  const instagramUrl = siteConfig?.instagram_url || "";

  // Only show social links that have a URL
  const socialLinks = [
    { url: facebookUrl, icon: "fab fa-facebook-f", label: "Facebook" },
    { url: twitterUrl, icon: "fab fa-twitter", label: "Twitter" },
    { url: youtubeUrl, icon: "fab fa-youtube", label: "YouTube" },
    { url: instagramUrl, icon: "fab fa-instagram", label: "Instagram" },
  ].filter((s) => s.url && s.url.trim() !== "");

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
              {phone && <li><a href={`tel:${phone}`}>{phone}</a></li>}
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
              <li><span>{address}</span></li>
              {email && <li><a href={`mailto:${email}`}>{email}</a></li>}
            </ul>
          </div>
          <div className="footer-col">
            <h4>Follow Us</h4>
            <div className="social-links">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.url}
                  className="social-link"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                >
                  <i className={social.icon} />
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          © {new Date().getFullYear()} {siteName}। সর্বস্বত্ব সংরক্ষিত।
        </div>
      </div>
    </footer>
  );
}
