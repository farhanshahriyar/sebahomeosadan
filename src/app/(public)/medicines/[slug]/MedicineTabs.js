"use client";
import { useState } from "react";

export default function MedicineTabs({ tabs }) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || "");

  if (!tabs || tabs.length === 0) return null;

  return (
    <div className="tabs-container">
      <div className="tab-buttons">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`tab-panel ${activeTab === tab.id ? "active" : ""}`}
        >
          <h4>{tab.label}</h4>
          {tab.content.split("\n\n").map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      ))}
    </div>
  );
}
