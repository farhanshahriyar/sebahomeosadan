import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MarqueeBar from "@/components/MarqueeBar";

export default function PublicLayout({ children }) {
  return (
    <>
      <div className="top-banner">
        <img src="/img/banner.png" alt="সেবা হোমিও সদন ব্যানার" />
      </div>
      <MarqueeBar />
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}
