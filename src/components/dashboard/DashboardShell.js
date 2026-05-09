"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";
import { useState } from "react";

export default function DashboardShell({ userInfo, children }) {
  const pathname = usePathname();

  const isAdmin = userInfo.role === "admin" || userInfo.role === "super_admin";
  const roleBadge =
    userInfo.role === "super_admin"
      ? "Super Admin"
      : userInfo.role === "admin"
        ? "Admin"
        : "Author";

  // If user is admin, they can toggle their view mode
  const [viewMode, setViewMode] = useState(isAdmin ? "admin" : "author");

  // Determine if admin features should be visible
  const showAdminFeatures = isAdmin && viewMode === "admin";

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <Link href="/dashboard" className="dashboard-brand">
          <i className="fas fa-leaf"></i> Good Health Homeo Care
        </Link>
        
        {/* View Switcher (Only for Admins) */}
        {isAdmin && (
          <div className="view-switcher-container">
            <div className="view-switcher">
              <button 
                className={`view-btn ${viewMode === 'author' ? 'active' : ''}`}
                onClick={() => setViewMode('author')}
              >
                Author
              </button>
              <button 
                className={`view-btn ${viewMode === 'admin' ? 'active' : ''}`}
                onClick={() => setViewMode('admin')}
              >
                Admin
              </button>
            </div>
          </div>
        )}

        <div className="dashboard-nav">
          <div className="dashboard-nav-title">Menu</div>
          <Link
            href="/dashboard"
            className={`dashboard-nav-item ${pathname === "/dashboard" ? "active" : ""}`}
          >
            <i className="fas fa-home"></i> Overview
          </Link>
          <Link
            href="/dashboard/author"
            className={`dashboard-nav-item ${pathname?.startsWith("/dashboard/author") ? "active" : ""}`}
          >
            <i className="fas fa-pen-nib"></i> Author Panel
          </Link>
          {showAdminFeatures && (
            <Link
              href="/dashboard/admin"
              className={`dashboard-nav-item ${pathname?.startsWith("/dashboard/admin") ? "active" : ""}`}
            >
              <i className="fas fa-users-cog"></i> Manage Users
            </Link>
          )}

          <div className="dashboard-nav-title">Content</div>
          <Link href="/dashboard" className="dashboard-nav-item">
            <i className="fas fa-file-alt"></i> Posts
          </Link>
          <Link href="/dashboard" className="dashboard-nav-item">
            <i className="fas fa-pills"></i> Medicines
          </Link>
          <Link href="/dashboard" className="dashboard-nav-item">
            <i className="fas fa-comments"></i> Testimonials
          </Link>

          <div className="dashboard-nav-title">Settings</div>
          {showAdminFeatures && (
            <Link 
              href="/dashboard/status" 
              className={`dashboard-nav-item ${pathname?.startsWith("/dashboard/status") ? "active" : ""}`}
            >
              <i className="fas fa-server"></i> Status
            </Link>
          )}
          <Link href="/dashboard" className="dashboard-nav-item">
            <i className="fas fa-cog"></i> Configuration
          </Link>
          <Link href="/" className="dashboard-nav-item">
            <i className="fas fa-globe"></i> View Website
          </Link>
          <form action={logout}>
            <button type="submit" className="dashboard-nav-item" style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}>
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Topbar */}
        <header className="dashboard-topbar">
          <div className="topbar-search">
            <i className="fas fa-search"></i>
            <input type="text" placeholder="Search dashboard..." />
          </div>
          <div className="topbar-actions">
            <button className="topbar-btn">
              <i className="fas fa-bell"></i>
              <span className="badge">3</span>
            </button>
            <button className="topbar-btn">
              <i className="fas fa-envelope"></i>
            </button>
            <div className="user-profile">
              <div className="user-avatar-placeholder">
                {userInfo.name.charAt(0).toUpperCase()}
              </div>
              <div className="user-profile-info">
                <span className="name">{userInfo.name}</span>
                <span className="role">{roleBadge}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="dashboard-content">{children}</div>
      </main>
    </div>
  );
}
