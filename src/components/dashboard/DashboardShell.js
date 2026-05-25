"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";
import { useState, useEffect } from "react";

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

  // Sidebar collapse state
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      localStorage.setItem("sidebar-collapsed", String(!prev));
      return !prev;
    });
  };

  // Determine if admin features should be visible
  const showAdminFeatures = isAdmin && viewMode === "admin";

  return (
    <div className={`dashboard-layout${collapsed ? " sidebar-collapsed" : ""}`}>
      {/* Sidebar */}
      <aside className={`dashboard-sidebar${collapsed ? " collapsed" : ""}`}>
        {/* Collapse Toggle */}
        <button
          className="sidebar-toggle"
          onClick={toggleSidebar}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <i className={`fas fa-chevron-${collapsed ? "right" : "left"}`} />
        </button>
        <Link href="/dashboard" className="dashboard-brand">
          <i className="fas fa-leaf"></i> <span>Good Health Homeo Care</span>
        </Link>
        
        {/* View Switcher (Only for Admins) */}
        {isAdmin && (
          <div className="view-switcher-container">
            <div className="view-switcher">
              <button 
                className={`view-btn ${viewMode === 'author' ? 'active' : ''}`}
                onClick={() => setViewMode('author')}
              >
                <span>Author</span>
              </button>
              <button 
                className={`view-btn ${viewMode === 'admin' ? 'active' : ''}`}
                onClick={() => setViewMode('admin')}
              >
                <span>Admin</span>
              </button>
            </div>
          </div>
        )}

        <div className="dashboard-nav">
          <div className="dashboard-nav-title"><span>Menu</span></div>
          <Link
            href="/dashboard"
            className={`dashboard-nav-item ${pathname === "/dashboard" ? "active" : ""}`}
          >
            <i className="fas fa-home"></i> <span>Overview</span>
          </Link>
          <Link
            href="/dashboard/author"
            className={`dashboard-nav-item ${pathname?.startsWith("/dashboard/author") ? "active" : ""}`}
          >
            <i className="fas fa-pen-nib"></i> <span>Author Panel</span>
          </Link>
          {showAdminFeatures && (
            <>
              <Link
                href="/dashboard/admin"
                className={`dashboard-nav-item ${pathname === "/dashboard/admin" ? "active" : ""}`}
              >
                <i className="fas fa-users-cog"></i> <span>Manage Users</span>
              </Link>
              <Link
                href="/dashboard/admin/categories"
                className={`dashboard-nav-item ${pathname?.startsWith("/dashboard/admin/categories") ? "active" : ""}`}
              >
                <i className="fas fa-tags"></i> <span>Manage Categories</span>
              </Link>
              <Link
                href="/dashboard/admin/review"
                className={`dashboard-nav-item ${pathname?.startsWith("/dashboard/admin/review") ? "active" : ""}`}
              >
                <i className="fas fa-clipboard-check"></i> <span>Editorial Review</span>
              </Link>
            </>
          )}

          <div className="dashboard-nav-title"><span>Content</span></div>
          <Link href="/dashboard" className="dashboard-nav-item">
            <i className="fas fa-file-alt"></i> <span>Posts</span>
          </Link>
          <Link href="/dashboard" className="dashboard-nav-item">
            <i className="fas fa-pills"></i> <span>Medicines</span>
          </Link>
          <Link href="/dashboard" className="dashboard-nav-item">
            <i className="fas fa-comments"></i> <span>Testimonials</span>
          </Link>

          <div className="dashboard-nav-title"><span>Settings</span></div>
          {showAdminFeatures && (
            <Link 
              href="/dashboard/status" 
              className={`dashboard-nav-item ${pathname?.startsWith("/dashboard/status") ? "active" : ""}`}
            >
              <i className="fas fa-server"></i> <span>Status</span>
            </Link>
          )}
          <Link href="/dashboard" className="dashboard-nav-item">
            <i className="fas fa-cog"></i> <span>Configuration</span>
          </Link>
          <Link href="/" className="dashboard-nav-item">
            <i className="fas fa-globe"></i> <span>View Website</span>
          </Link>
          <form action={logout}>
            <button type="submit" className="dashboard-nav-item" style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}>
              <i className="fas fa-sign-out-alt"></i> <span>Logout</span>
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
