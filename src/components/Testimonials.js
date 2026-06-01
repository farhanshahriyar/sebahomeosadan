"use client";
import { useState, useEffect } from "react";

const fallbackTestimonials = [
  { name: "Samuel Hahnemann", title: "Founder of Homeopathy", img: "/img/homeo scientist/s1.jpg", text: "চিকিৎসা বিজ্ঞান হলো অভিজ্ঞতার বিজ্ঞান; এর উদ্দেশ্য হলো ওষুধের মাধ্যমে রোগ নির্মূল করা। রোগের জ্ঞান, ওষুধের জ্ঞান এবং তাদের প্রয়োগের জ্ঞান - এই তিনটি মিলে চিকিৎসা বিজ্ঞান গঠিত।" },
  { name: "J.T. Kent", title: "Homeopathy Scientist", img: "/img/homeo scientist/s2.jpg", text: "হোমিওপ্যাথি হলো একমাত্র চিকিৎসা পদ্ধতি যা রোগীর সামগ্রিক অবস্থা বিবেচনা করে চিকিৎসা করে। এটি শুধু রোগ নয়, রোগীকে চিকিৎসা করে।" },
  { name: "William Boericke", title: "Homeopathy Author", img: "/img/homeo scientist/s3.png", text: "হোমিওপ্যাথির মূলনীতি হলো 'সদৃশ দ্বারা সদৃশের চিকিৎসা'। এই নীতি অনুসরণ করে সঠিক ওষুধ নির্বাচন করলে রোগ আরোগ্য সম্ভব।" },
  { name: "E.B. Nash", title: "Clinical Practitioner", img: "/img/homeo scientist/s4.jpg", text: "হোমিওপ্যাথি চিকিৎসায় সর্বোপরি মানসিক লক্ষণাবলী লক্ষ্য রাখতে হবে। মানসিক ও দৈহিক উদ্বেগ, অস্থিরতা বর্তমান আছে কি না তা পর্যবেক্ষণ করতে হবে।" },
];

export default function Testimonials({ initialTestimonials }) {
  const testimonials = (initialTestimonials && initialTestimonials.length > 0) ? initialTestimonials : fallbackTestimonials;
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const activeIdx = activeTestimonial >= testimonials.length ? 0 : activeTestimonial;

  useEffect(() => {
    if (testimonials.length <= 1) return;

    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [activeIdx, testimonials.length]);

  return (
    <section className="section testimonial-section" id="testimonials">
      <div className="container">
        <div className="section-header">
          <h2>হোমিওপ্যাথি সম্পর্কে জ্ঞানী লোকেরা কী বলেন</h2>
        </div>
        {testimonials.length > 0 && (
          <div className="testimonial-card">
            <div className="testimonial-avatar">
              {testimonials[activeIdx].img ? (
                <img
                  src={testimonials[activeIdx].img}
                  alt={testimonials[activeIdx].name}
                />
              ) : (
                <div className="testimonial-avatar-placeholder">
                  {testimonials[activeIdx].name ? testimonials[activeIdx].name.charAt(0).toUpperCase() : "?"}
                </div>
              )}
              <h4>{testimonials[activeIdx].name}</h4>
              <span>{testimonials[activeIdx].title}</span>
            </div>
            <div className="testimonial-text">
              <p>{testimonials[activeIdx].text}</p>
            </div>
          </div>
        )}
        <div className="testimonial-dots">
          {testimonials.map((_, i) => (
            <button
              key={i}
              className={`testimonial-dot ${i === activeIdx ? "active" : ""}`}
              onClick={() => setActiveTestimonial(i)}
              aria-label={`Testimonial ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
