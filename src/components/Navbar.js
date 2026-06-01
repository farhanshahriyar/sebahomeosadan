"use client";
import { useState } from "react";
import Link from "next/link";

// Fixed navigation items that always appear (not category-driven)
const fixedItemsBefore = [
  { label: "প্রধান সূচি", href: "/" },
];

const fixedItemsAfter = [
  { label: "এনাটমি ও ফিজিওলজি", href: "/anatomy" },
  { label: "ওষুধ পরিচিতি", href: "/medicines" },
];

export default function Navbar({ categories = [] }) {
  const [menuOpen, setMenuOpen] = useState(false);

  // Build nav items: fixed items + dynamic categories from DB
  const dynamicCategoryItems = categories.map((cat) => ({
    label: cat.name,
    href: `/articles?category=${cat.slug}`,
    children: cat.children || null,
  }));

  const navItems = [
    ...fixedItemsBefore,
    ...dynamicCategoryItems,
    ...fixedItemsAfter,
  ];

  return (
    <nav className="navbar" id="main-navbar">
      <div className="container" style={{ justifyContent: "center" }}>
        <Link href="/" className="nav-brand mobile-brand">
          <i className="fas fa-leaf" /> সেবা হোমিওসদন
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
            <li className="nav-item" key={item.href || i}>
              {item.children ? (
                <>
                  <span className="nav-link" style={{ cursor: "pointer" }}>
                    {item.label}{" "}
                    <i
                      className="fas fa-chevron-down"
                      style={{ fontSize: 10, marginLeft: 4 }}
                    />
                  </span>
                  <ul className="dropdown-menu">
                    {item.children.map((child, j) => (
                      <li key={j}>
                        <Link
                          href={child.href}
                          className="dropdown-item"
                          onClick={() => setMenuOpen(false)}
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <Link
                  href={item.href}
                  className="nav-link"
                  onClick={() => setMenuOpen(false)}
                >
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
