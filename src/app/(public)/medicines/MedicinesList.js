"use client";
import { useState } from "react";
import Link from "next/link";

export default function MedicinesList({ medicines }) {
  const [search, setSearch] = useState("");

  const filtered = medicines.filter((med) =>
    med.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="medicine-search-box">
        <i className="fas fa-search" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ওষুধের নাম দিয়ে খুঁজুন... (Search medicines)"
        />
      </div>

      <table className="medicine-table">
        <thead>
          <tr>
            <th style={{ width: 60 }}>#</th>
            <th>ওষুধের নাম</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length > 0 ? (
            filtered.map((med, idx) => (
              <tr key={med.id}>
                <td>{idx + 1}</td>
                <td>
                  <Link href={`/medicines/${med.slug}`}>{med.name}</Link>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="2" style={{ textAlign: "center", padding: "30px", color: "#999" }}>
                <i className="fas fa-search" style={{ marginRight: "8px" }} />
                কোনো ওষুধ পাওয়া যায়নি
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
