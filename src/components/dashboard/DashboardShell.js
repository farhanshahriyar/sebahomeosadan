"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";
import { useState, useEffect, useRef } from "react";

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
  const [viewDropdownOpen, setViewDropdownOpen] = useState(false);
  const viewDropdownRef = useRef(null);

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

  // Close dropdown on outside click
  useEffect(() => {
    if (!viewDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (viewDropdownRef.current && !viewDropdownRef.current.contains(e.target)) {
        setViewDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [viewDropdownOpen]);

  // Determine if admin features should be visible
  const showAdminFeatures = isAdmin && viewMode === "admin";

  const viewModes = [
    { key: "author", label: "Author", icon: "fas fa-pen-nib", description: "Write & manage posts" },
    { key: "admin", label: "Admin", icon: "fas fa-shield-alt", description: "Full admin controls" },
  ];

  const currentMode = viewModes.find((m) => m.key === viewMode) || viewModes[0];

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
        
        {/* View Switcher Dropdown (Only for Admins) */}
        {isAdmin && (
          <div className="view-switcher-container" ref={viewDropdownRef}>
            <button
              className="view-switcher-trigger"
              onClick={() => setViewDropdownOpen((prev) => !prev)}
            >
              <div className="view-switcher-trigger-left">
                <div className="view-switcher-icon">
                  <i className={currentMode.icon} />
                </div>
                <div className="view-switcher-info">
                  <span className="view-switcher-label">{currentMode.label} View</span>
                  <span className="view-switcher-desc">{currentMode.description}</span>
                </div>
              </div>
              <i className={`fas fa-chevron-${viewDropdownOpen ? "up" : "down"} view-switcher-chevron`} />
            </button>

            {viewDropdownOpen && (
              <div className="view-switcher-dropdown">
                <div className="view-dropdown-header">Switch View</div>
                {viewModes.map((mode) => (
                  <button
                    key={mode.key}
                    className={`view-dropdown-item ${viewMode === mode.key ? "active" : ""}`}
                    onClick={() => {
                      setViewMode(mode.key);
                      setViewDropdownOpen(false);
                    }}
                  >
                    <i className={mode.icon} />
                    <div className="view-dropdown-item-info">
                      <span className="view-dropdown-item-label">{mode.label}</span>
                      <span className="view-dropdown-item-desc">{mode.description}</span>
                    </div>
                    {viewMode === mode.key && (
                      <i className="fas fa-check view-dropdown-check" />
                    )}
                  </button>
                ))}
              </div>
            )}
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
                <i className="fas fa-folder"></i> <span>Manage Categories</span>
              </Link>
              <Link
                href="/dashboard/admin/topics"
                className={`dashboard-nav-item ${pathname?.startsWith("/dashboard/admin/topics") ? "active" : ""}`}
              >
                <i className="fas fa-tags"></i> <span>Manage Topics</span>
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
          <Link 
            href="/dashboard/posts" 
            className={`dashboard-nav-item ${pathname?.startsWith("/dashboard/posts") || pathname?.startsWith("/dashboard/author") ? "active" : ""}`}
          >
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
