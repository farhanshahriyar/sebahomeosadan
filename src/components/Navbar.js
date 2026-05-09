"use client";
import { useState } from "react";
import Link from "next/link";

const navItems = [
  { label: "প্রধান সূচি", href: "/" },
  {
    label: "স্বাস্থ্য কথা",
    children: [
      { label: "মানসিক স্বাস্থ্য", href: "#" },
      { label: "শিশুস্বাস্থ্য", href: "#" },
      { label: "কৈশোরের স্বাস্থ্য", href: "#" },
      { label: "পুরুষদের স্বাস্থ্য", href: "#" },
      { label: "নারীদের স্বাস্থ্য", href: "#" },
      { label: "প্রবণীদের স্বাস্থ্য", href: "#" },
    ],
  },
  { label: "এনাটমি, ফিজিওলাজি ও প্যাথলজি", href: "/anatomy" },
  {
    label: "হোমিওপ্যাথি",
    children: [
      { label: "হোমিওপ্যাথি কী?", href: "#" },
      { label: "হোমিওপ্যাথির আবিষ্কার", href: "#" },
      { label: "আবিষ্কারকের সংক্ষিপ্ত জীবনী", href: "#" },
      { label: "চিকিৎসা সেবায় হোমিওপ্যাতির অবদান", href: "#" },
      { label: "হোমিওপ্যাথি চিকিৎসা বিষয়ে সেলিব্রেটিদের মন্তব্য", href: "#" },
    ],
  },
  {
    label: "অর্গানন অব মেডিসিন",
    children: [
      { label: "চিকিৎসা বিজ্ঞান অংশ", href: "#" },
      { label: "চিকিৎসা কলা", href: "#" },
    ],
  },
  {
    label: "রোগ পরিচিতি",
    children: [
      { label: "মানসিক স্বাস্থ্য", href: "#" },
      { label: "শিশুস্বাস্থ্য", href: "#" },
      { label: "কৈশোরের স্বাস্থ্য", href: "#" },
      { label: "পুরুষদের স্বাস্থ্য", href: "#" },
      { label: "নারীদের স্বাস্থ্য", href: "#" },
      { label: "প্রবণীদের স্বাস্থ্য", href: "#" },
    ],
  },
  { label: "ওষুধ পরিচিতি", href: "/medicines" },
  {
    label: "বিবিধ প্রসঙ্গে",
    children: [
      { label: "ব্যক্তিত্ব", href: "#" },
      { label: "অপুষ্টি", href: "#" },
      { label: "রক্তশূন্যতা", href: "#" },
      { label: "কৃমি", href: "#" },
      { label: "জলবায়ু", href: "#" },
      { label: "খাবার-দাবার", href: "#" },
    ],
  },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar" id="main-navbar">
      <div className="container">
        <Link href="/" className="nav-brand">
          Good Health Homeo Care
        </Link>
        <button
          className="nav-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          <i className={menuOpen ? "fas fa-times" : "fas fa-bars"} />
        </button>
        <ul className={`nav-menu ${menuOpen ? "open" : ""}`}>
          {navItems.map((item, i) => (
            <li className="nav-item" key={i}>
              {item.children ? (
                <>
                  <span className="nav-link" style={{ cursor: "pointer" }}>
                    {item.label} <i className="fas fa-chevron-down" style={{ fontSize: 10, marginLeft: 4 }} />
                  </span>
                  <ul className="dropdown-menu">
                    {item.children.map((child, j) => (
                      <li key={j}>
                        <Link href={child.href} className="dropdown-item">
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <Link href={item.href} className="nav-link">
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
