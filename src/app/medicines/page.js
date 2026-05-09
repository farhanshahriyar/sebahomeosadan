import Link from "next/link";
import Sidebar from "@/components/Sidebar";

export const metadata = {
  title: "ওষুধ পরিচিতি | সেবা হোমিও সদন",
  description: "হোমিওপ্যাথি ওষুধের তালিকা এবং পরিচিতি। একোনাইটাম নেপেলাস, এ্যাকটিয়া রেসিমোসা সহ বিভিন্ন ওষুধ সম্পর্কে জানুন।",
};

const medicines = [
  { id: 1, name: "একোনাইটাম নেপেলাস [Aconitum Napellus]", href: "/medicines/aconitum-napellus" },
  { id: 2, name: "এ্যাকটিয়া রেসিমোসা [Actea Racemosa]", href: "/medicines/actea-racemosa" },
  { id: 3, name: "Allium Cepa", href: "#" },
  { id: 4, name: "Antimonium Tartaricum", href: "#" },
  { id: 5, name: "Apis Mellifica", href: "#" },
  { id: 6, name: "Argentum Nitricum", href: "#" },
  { id: 7, name: "Arnica Montana", href: "#" },
  { id: 8, name: "Arsenicum Album", href: "#" },
  { id: 9, name: "Belladonna", href: "#" },
  { id: 10, name: "Bryonia Alba", href: "#" },
  { id: 11, name: "Calcarea Carbonica", href: "#" },
  { id: 12, name: "Chamomilla", href: "#" },
  { id: 13, name: "China Officinalis", href: "#" },
  { id: 14, name: "Gelsemium", href: "#" },
  { id: 15, name: "Ignatia Amara", href: "#" },
  { id: 16, name: "Lycopodium", href: "#" },
  { id: 17, name: "Nux Vomica", href: "#" },
];

export default function MedicinesPage() {
  return (
    <div className="container">
      <div className="blog-layout">
        <div className="blog-content" id="medicines-list">
          <span className="category">ওষুধ পরিচিতি</span>
          <div className="post-meta">
            <span>শনিবার, 30 মে, 2021</span>
            <span>6:24:44 অপরাহ্ণ</span>
          </div>

          <table className="medicine-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>#</th>
                <th>ওষুধের নাম</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((med) => (
                <tr key={med.id}>
                  <td>{med.id}</td>
                  <td>
                    <Link href={med.href}>{med.name}</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

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
