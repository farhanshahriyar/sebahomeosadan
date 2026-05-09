"use client";
import { useState } from "react";
import Link from "next/link";

const testimonials = [
  { name: "Samuel Hahnemann", title: "Founder of Homeopathy", img: "/img/homeo scientist/s1.jpg", text: "চিকিৎসা বিজ্ঞান হলো অভিজ্ঞতার বিজ্ঞান; এর উদ্দেশ্য হলো ওষুধের মাধ্যমে রোগ নির্মূল করা। রোগের জ্ঞান, ওষুধের জ্ঞান এবং তাদের প্রয়োগের জ্ঞান - এই তিনটি মিলে চিকিৎসা বিজ্ঞান গঠিত।" },
  { name: "J.T. Kent", title: "Homeopathy Scientist", img: "/img/homeo scientist/s2.jpg", text: "হোমিওপ্যাথি হলো একমাত্র চিকিৎসা পদ্ধতি যা রোগীর সামগ্রিক অবস্থা বিবেচনা করে চিকিৎসা করে। এটি শুধু রোগ নয়, রোগীকে চিকিৎসা করে।" },
  { name: "William Boericke", title: "Homeopathy Author", img: "/img/homeo scientist/s3.png", text: "হোমিওপ্যাথির মূলনীতি হলো 'সদৃশ দ্বারা সদৃশের চিকিৎসা'। এই নীতি অনুসরণ করে সঠিক ওষুধ নির্বাচন করলে রোগ আরোগ্য সম্ভব।" },
  { name: "E.B. Nash", title: "Clinical Practitioner", img: "/img/homeo scientist/s4.jpg", text: "হোমিওপ্যাথি চিকিৎসায় সর্বোপরি মানসিক লক্ষণাবলী লক্ষ্য রাখতে হবে। মানসিক ও দৈহিক উদ্বেগ, অস্থিরতা বর্তমান আছে কি না তা পর্যবেক্ষণ করতে হবে।" },
];

export default function HomePage() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  return (
    <>
      {/* Hero Section */}
      <section className="hero" id="hero-section">
        <div className="container">
          <div className="hero-text">
            <h1>
              <span className="highlight">আপনার সঠিক সিদ্ধান্তই আপনাকে</span>
              রাখতে পারে সুস্থ এবং সুরক্ষিত।
            </h1>
            <div className="quote">
              <p>
                &ldquo;Medicine is a science of experience; its object is to
                eradicate diseases by means of remedies. The knowledge of
                disease, the knowledge of remedies and the knowledge of their
                employment, constitute medicine.&rdquo;
              </p>
              <p>— Samuel Hahnemann</p>
            </div>
            <a href="tel:+8801720970031" className="btn btn-primary" id="contact-btn">
              <i className="fa fa-phone" /> যোগাযোগ করুন
            </a>
          </div>
          <div className="hero-img">
            <img src="/img/img2.png" alt="হোমিওপ্যাথি চিকিৎসা" />
          </div>
        </div>
      </section>

      {/* Latest News Section */}
      <section className="section news-section" id="latest-news">
        <div className="container">
          <div className="section-header">
            <h2>সাম্প্রতিক পোস্ট</h2>
            <p>আমাদের সর্বশেষ ব্লগ পোস্ট দেখুন</p>
          </div>
          <div className="news-grid">
            <div className="news-card" id="news-card-1">
              <img src="/img/latest news/sim1.JPG" alt="হোমিওপ্যাথি চিকিৎসা সংবাদ" />
              <div className="news-card-body">
                <h3>হোমিওপ্যাথি চিকিৎসাকে জনপ্রিয় করা হবে</h3>
                <span className="author">রাইজিংবিডি.কম</span>
                <p>
                  চিকিৎসা ক্ষেত্রে হোমিওপ্যাথি ব্যবস্থাকে জনপ্রিয় এবং সাধারন
                  মানুষের দোড়গোড়ায় পৌঁছে দেওয়ার উদ্যোগ নেওয়া হবে বলে
                  জানিয়েছেন অর্থমন্ত্রী।
                </p>
                <a href="https://www.risingbd.com/health/news/251846" className="read-more" target="_blank" rel="noopener noreferrer">
                  আরও পড়ুন →
                </a>
              </div>
            </div>

            <div className="news-card" id="news-card-2">
              <img src="/img/img1.png" alt="এনাটমি ফিজিওলজি" />
              <div className="news-card-body">
                <h3>এনাটমি, ফিজিওলজি - দেহতন্ত্রের প্রাথমিক জ্ঞান</h3>
                <span className="author">মোঃ আমিরুল ইসলাম প্রামানিক</span>
                <p>
                  এনাটমি হলো শরীরের গঠন সম্পর্কে জ্ঞান এবং বিভিন্ন অংশের সঙ্গে
                  অন্যটির সম্পর্ক। স্থানিক বা Regional এনাটমি হলো...
                </p>
                <Link href="/anatomy" className="read-more">
                  আরও পড়ুন →
                </Link>
              </div>
            </div>

            <div className="news-card" id="news-card-3">
              <img src="/img/img2.png" alt="একোনাইটাম নেপেলাস" />
              <div className="news-card-body">
                <h3>একোনাইটাম নেপেলাস</h3>
                <span className="author">মোঃ আমিরুল ইসলাম প্রামানিক</span>
                <p>
                  যুবক-যুবতীদের বিশেষতঃ বালিকাদের যারা পূর্ণ রক্তপ্রধান
                  ধাতুবিশিষ্ট এবং অলসভাবে সময় কাটায়...
                </p>
                <Link href="/medicines/aconitum-napellus" className="read-more">
                  আরও পড়ুন →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section testimonial-section" id="testimonials">
        <div className="container">
          <div className="section-header">
            <h2>হোমিওপ্যাথি সম্পর্কে জ্ঞানী লোকেরা কী বলেন</h2>
          </div>
          <div className="testimonial-card">
            <div className="testimonial-avatar">
              <img
                src={testimonials[activeTestimonial].img}
                alt={testimonials[activeTestimonial].name}
              />
              <h4>{testimonials[activeTestimonial].name}</h4>
              <span>{testimonials[activeTestimonial].title}</span>
            </div>
            <div className="testimonial-text">
              <p>{testimonials[activeTestimonial].text}</p>
            </div>
          </div>
          <div className="testimonial-dots">
            {testimonials.map((_, i) => (
              <button
                key={i}
                className={`testimonial-dot ${i === activeTestimonial ? "active" : ""}`}
                onClick={() => setActiveTestimonial(i)}
                aria-label={`Testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
