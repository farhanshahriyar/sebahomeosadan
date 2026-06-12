"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/app/login/actions";
import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateOwnProfileAction, changeOwnPasswordAction } from "@/app/dashboard/admin/actions";

export default function DashboardShell({ userInfo, children }) {
  const pathname = usePathname();
  const router = useRouter();

  const isAdmin = userInfo.role === "admin" || userInfo.role === "super_admin";
  const roleBadge =
    userInfo.role === "super_admin"
      ? "Super Admin"
      : userInfo.role === "admin"
        ? "Admin"
        : "Author";

  // If user is admin/super-admin, they can toggle their view mode
  const [viewMode, setViewMode] = useState(
    userInfo.role === "super_admin"
      ? "super_admin"
      : userInfo.role === "admin"
        ? "admin"
        : "author"
  );
  const [viewDropdownOpen, setViewDropdownOpen] = useState(false);
  const viewDropdownRef = useRef(null);

  // Sidebar collapse state
  const [collapsed, setCollapsed] = useState(false);

  // Global Topbar Search State
  const [searchValue, setSearchValue] = useState("");

  // Notification States
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef(null);

  // Messages States
  const [messages, setMessages] = useState([]);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const messagesRef = useRef(null);

  const supabase = createClient();

  // Profile settings and password change states
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [profileSettingsOpen, setProfileSettingsOpen] = useState(false);
  const [passwordChangeOpen, setPasswordChangeOpen] = useState(false);
  const userDropdownRef = useRef(null);

  // Profile fields state
  const [displayName, setDisplayName] = useState(userInfo.name);
  const [profileName, setProfileName] = useState(userInfo.name);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileErrorState] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  // Password fields state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    setDisplayName(userInfo.name);
    setProfileName(userInfo.name);
  }, [userInfo.name]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileErrorState("");
    setProfileSuccess("");
    setProfileLoading(true);

    try {
      const res = await updateOwnProfileAction(profileName);
      if (res.error) {
        setProfileErrorState(res.error);
      } else {
        setProfileSuccess("প্রোফাইল সফলভাবে আপডেট করা হয়েছে!");
        setDisplayName(profileName.trim());
        router.refresh();
        setTimeout(() => {
          setProfileSettingsOpen(false);
          setProfileSuccess("");
        }, 1500);
      }
    } catch (err) {
      setProfileErrorState("প্রোফাইল আপডেট করতে সমস্যা হয়েছে।");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!newPassword || newPassword.length < 6) {
      setPasswordError("পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("পাসওয়ার্ড দুটি মেলেনি।");
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await changeOwnPasswordAction(newPassword);
      if (res.error) {
        setPasswordError(res.error);
      } else {
        setPasswordSuccess("পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          setPasswordChangeOpen(false);
          setPasswordSuccess("");
        }, 1500);
      }
    } catch (err) {
      setPasswordError("পাসওয়ার্ড পরিবর্তন করতে সমস্যা হয়েছে।");
    } finally {
      setPasswordLoading(false);
    }
  };

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

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (viewDropdownOpen && viewDropdownRef.current && !viewDropdownRef.current.contains(e.target)) {
        setViewDropdownOpen(false);
      }
      if (notificationsOpen && notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
      if (messagesOpen && messagesRef.current && !messagesRef.current.contains(e.target)) {
        setMessagesOpen(false);
      }
      if (userDropdownOpen && userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [viewDropdownOpen, notificationsOpen, messagesOpen, userDropdownOpen]);

  // Sync search value from URL query param if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const search = params.get("search") || "";
      setSearchValue(search);
    }
  }, [pathname]);

  // Listen for local search sync events from child pages
  useEffect(() => {
    const handleSync = (e) => {
      setSearchValue(e.detail || "");
    };
    window.addEventListener("dashboard-search-sync", handleSync);
    return () => window.removeEventListener("dashboard-search-sync", handleSync);
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchValue(val);

    // Broadcast search value to client pages
    window.dispatchEvent(new CustomEvent("dashboard-search", { detail: val }));

    // Normalize paths by stripping trailing slashes for robust matching
    const cleanPathname = (pathname || "").replace(/\/$/, "");

    const searchablePaths = [
      "/dashboard/posts",
      "/dashboard/admin",
      "/dashboard/admin/categories",
      "/dashboard/admin/topics"
    ];

    const isSearchable = searchablePaths.some(path => {
      const cleanPath = path.replace(/\/$/, "");
      return cleanPathname === cleanPath || cleanPathname.startsWith(cleanPath + "/");
    });

    // If typing on a non-searchable page, automatically redirect to posts search
    if (!isSearchable && val.trim() !== "") {
      router.push(`/dashboard/posts?search=${encodeURIComponent(val)}`);
    }
  };

  // Load read notifications from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("read-notifications");
    if (saved) {
      try {
        setReadIds(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Fetch notifications
  useEffect(() => {
    async function fetchNotifications() {
      const newNotifications = [];

      try {
        if (isAdmin) {
          // 1. Articles in 'review' status
          const { data: reviewArticles } = await supabase
            .from("articles")
            .select("id, title, author_name, created_at")
            .eq("status", "review");

          if (reviewArticles) {
            reviewArticles.forEach((art) => {
              newNotifications.push({
                id: `review-${art.id}`,
                title: "রিভিউ অনুরোধ (Review Request)",
                text: `"${art.title}" আর্টিকেলটি রিভিউয়ের জন্য জমা দেওয়া হয়েছে।`,
                link: "/dashboard/admin/review",
                icon: "fas fa-clipboard-check",
                color: "#3498db",
                time: new Date(art.created_at),
              });
            });
          }

          // 2. Inactive Categories / Topics suggested by authors
          const { data: inactiveCats } = await supabase
            .from("categories")
            .select("id, name, parent_id, created_at")
            .eq("is_active", false);

          if (inactiveCats) {
            inactiveCats.forEach((cat) => {
              const isTopic = cat.parent_id !== null;
              newNotifications.push({
                id: `cat-${cat.id}`,
                title: isTopic ? "নতুন টপিক প্রস্তাব" : "নতুন ক্যাটাগরি প্রস্তাব",
                text: `"${cat.name}" নামক ${isTopic ? "টপিকটি" : "ক্যাটাগরি"} অনুমোদনের জন্য পেন্ডিং রয়েছে।`,
                link: isTopic ? "/dashboard/admin/topics" : "/dashboard/admin/categories",
                icon: isTopic ? "fas fa-tags" : "fas fa-folder",
                color: "#f1c40f",
                time: new Date(cat.created_at),
              });
            });
          }
        } else {
          // For Author role:
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            // 3. Author's published articles
            const { data: myPublished } = await supabase
              .from("articles")
              .select("id, title, published_at")
              .eq("author_id", user.id)
              .eq("status", "published")
              .order("published_at", { ascending: false })
              .limit(5);

            if (myPublished) {
              myPublished.forEach((art) => {
                newNotifications.push({
                  id: `pub-${art.id}`,
                  title: "আর্টিকেল প্রকাশিত হয়েছে",
                  text: `আপনার "${art.title}" আর্টিকেলটি সফলভাবে প্রকাশিত হয়েছে।`,
                  link: `/articles/${art.id}`,
                  icon: "fas fa-check-circle",
                  color: "#2ecc71",
                  time: new Date(art.published_at),
                });
              });
            }

            // 4. Approved categories/topics created by this user
            const { data: myCats } = await supabase
              .from("categories")
              .select("id, name, parent_id, created_at")
              .eq("created_by", user.id)
              .eq("is_active", true)
              .limit(5);

            if (myCats) {
              myCats.forEach((cat) => {
                const isTopic = cat.parent_id !== null;
                newNotifications.push({
                  id: `cat-appr-${cat.id}`,
                  title: isTopic ? "টপিক অনুমোদিত হয়েছে" : "ক্যাটাগরি অনুমোদিত হয়েছে",
                  text: `আপনার প্রস্তাবিত "${cat.name}" ${isTopic ? "টপিকটি" : "ক্যাটাগরি"} অনুমোদিত ও সক্রিয় করা হয়েছে।`,
                  link: "/dashboard/posts",
                  icon: isTopic ? "fas fa-tags" : "fas fa-folder",
                  color: "#2ecc71",
                  time: new Date(cat.created_at),
                });
              });
            }
          }
        }
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }

      // Sort notifications by date descending
      newNotifications.sort((a, b) => b.time - a.time);
      setNotifications(newNotifications);
    }

    fetchNotifications();
    // Poll every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [isAdmin, supabase]);

  // Load and refresh messages from Supabase
  const loadMessages = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const list = (data || []).map(msg => ({
        id: msg.id,
        name: msg.name,
        email: msg.email,
        subject: msg.subject || "কোনো বিষয় নেই",
        message: msg.message,
        isRead: msg.is_read,
        date: msg.created_at
      }));

      setMessages(list);
    } catch (err) {
      console.error("Error loading messages from Supabase:", err);
    }
  }, [isAdmin, supabase]);

  useEffect(() => {
    if (isAdmin) {
      loadMessages();
      // Poll for new messages every 30 seconds
      const interval = setInterval(loadMessages, 30000);
      return () => clearInterval(interval);
    }
  }, [isAdmin, loadMessages]);

  const unreadNotifications = notifications.filter(n => !readIds.includes(n.id));
  const unreadCount = unreadNotifications.length;

  const unreadMessagesCount = messages.filter(m => !m.isRead).length;

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    setReadIds(allIds);
    localStorage.setItem("read-notifications", JSON.stringify(allIds));
  };

  const handleNotificationClick = (id) => {
    if (!readIds.includes(id)) {
      const updated = [...readIds, id];
      setReadIds(updated);
      localStorage.setItem("read-notifications", JSON.stringify(updated));
    }
    setNotificationsOpen(false);
  };

  const toggleMessagesDropdown = () => {
    if (isAdmin) {
      loadMessages();
      setMessagesOpen((prev) => !prev);
    }
  };

  const markAllMessagesAsRead = async () => {
    try {
      const unreadIds = messages.filter(m => !m.isRead).map(m => m.id);
      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from("contacts")
        .update({ is_read: true })
        .in("id", unreadIds);

      if (error) throw error;

      const updated = messages.map(m => ({ ...m, isRead: true }));
      setMessages(updated);
    } catch (err) {
      console.error("Error marking all messages as read:", err);
    }
  };

  const handleMessageClick = async (msg) => {
    if (msg.isRead) {
      setSelectedMessage(msg);
      setMessagesOpen(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("contacts")
        .update({ is_read: true })
        .eq("id", msg.id);

      if (error) throw error;

      const updated = messages.map(m => m.id === msg.id ? { ...m, isRead: true } : m);
      setMessages(updated);
      setSelectedMessage({ ...msg, isRead: true });
    } catch (err) {
      console.error("Error marking message as read:", err);
      setSelectedMessage(msg);
    }
    setMessagesOpen(false);
  };

  const handleDeleteMessage = async (id) => {
    if (!confirm("আপনি কি নিশ্চিত যে এই বার্তাটি মুছে ফেলতে চান?")) return;

    try {
      const { error } = await supabase
        .from("contacts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      const updated = messages.filter(m => m.id !== id);
      setMessages(updated);
      setSelectedMessage(null);
    } catch (err) {
      console.error("Error deleting message:", err);
      alert("বার্তাটি মুছে ফেলা যায়নি।");
    }
  };

  const formatTimeAgo = (date) => {
    const diffMs = new Date() - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "এইমাত্র";
    if (diffMins < 60) return `${diffMins} মিনিট আগে`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} ঘণ্টা আগে`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} দিন আগে`;
  };

  // Determine if admin/super_admin features should be visible
  const showAdminFeatures = isAdmin && (viewMode === "admin" || viewMode === "super_admin");
  const showSuperAdminFeatures = userInfo.role === "super_admin" && viewMode === "super_admin";

  const viewModes =
    userInfo.role === "super_admin"
      ? [
        { key: "author", label: "Author", icon: "fas fa-pen-nib", description: "Write & manage posts" },
        { key: "admin", label: "Admin", icon: "fas fa-user-shield", description: "Content & editorial controls" },
        { key: "super_admin", label: "Super Admin", icon: "fas fa-shield-alt", description: "System & user controls" },
      ]
      : userInfo.role === "admin"
        ? [
          { key: "author", label: "Author", icon: "fas fa-pen-nib", description: "Write & manage posts" },
          { key: "admin", label: "Admin", icon: "fas fa-shield-alt", description: "Full admin controls" },
        ]
        : [
          { key: "author", label: "Author", icon: "fas fa-pen-nib", description: "Write & manage posts" }
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
          <i className="fas fa-leaf"></i> <span>Popular Homeo Center</span>
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
          {showSuperAdminFeatures && (
            <Link
              href="/dashboard/admin"
              className={`dashboard-nav-item ${pathname === "/dashboard/admin" ? "active" : ""}`}
            >
              <i className="fas fa-users-cog"></i> <span>Manage Users</span>
            </Link>
          )}
          {showAdminFeatures && (
            <>
              <Link
                href="/dashboard/admin/pages"
                className={`dashboard-nav-item ${pathname?.startsWith("/dashboard/admin/pages") ? "active" : ""}`}
              >
                <i className="fas fa-copy"></i> <span>Manage Pages</span>
              </Link>
              <Link
                href="/dashboard/admin/categories"
                className={`dashboard-nav-item ${pathname?.startsWith("/dashboard/admin/categories") ? "active" : ""}`}
              >
                <i className="fas fa-folder"></i> <span>Manage Categories</span>
              </Link>
              <Link
                href="/dashboard/admin/messages"
                className={`dashboard-nav-item ${pathname?.startsWith("/dashboard/admin/messages") ? "active" : ""}`}
              >
                <i className="fas fa-envelope"></i> <span>Manage Messages</span>
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
          <Link
            href="/dashboard/medicines"
            className={`dashboard-nav-item ${pathname?.startsWith("/dashboard/medicines") ? "active" : ""}`}
          >
            <i className="fas fa-pills"></i> <span>Medicines</span>
          </Link>
          {showSuperAdminFeatures && (
            <>
              <Link
                href="/dashboard/admin/testimonials"
                className={`dashboard-nav-item ${pathname?.startsWith("/dashboard/admin/testimonials") ? "active" : ""}`}
              >
                <i className="fas fa-comments"></i> <span>Testimonials</span>
              </Link>
              <Link
                href="/dashboard/admin/landing"
                className={`dashboard-nav-item ${pathname?.startsWith("/dashboard/admin/landing") ? "active" : ""}`}
              >
                <i className="fas fa-desktop"></i> <span>Landing Page</span>
              </Link>
            </>
          )}

          <div className="dashboard-nav-title"><span>Settings</span></div>
          {showSuperAdminFeatures && (
            <Link
              href="/dashboard/status"
              className={`dashboard-nav-item ${pathname?.startsWith("/dashboard/status") ? "active" : ""}`}
            >
              <i className="fas fa-server"></i> <span>Status</span>
            </Link>
          )}
          <Link
            href="/dashboard/configuration"
            className={`dashboard-nav-item ${pathname?.startsWith("/dashboard/configuration") ? "active" : ""}`}
          >
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
            <input
              type="text"
              placeholder="Search dashboard..."
              value={searchValue}
              onChange={handleSearchChange}
            />
          </div>
          <div className="topbar-actions">
            {/* Notifications Bell Dropdown */}
            <div className="notifications-container" ref={notificationsRef}>
              <button
                className="topbar-btn"
                onClick={() => setNotificationsOpen((prev) => !prev)}
                title="Notifications"
              >
                <i className="fas fa-bell"></i>
                {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
              </button>

              {notificationsOpen && (
                <div className="notifications-dropdown">
                  <div className="notifications-header">
                    <h4>
                      <i className="fas fa-bell"></i> নোটিফিকেশন ({unreadCount})
                    </h4>
                    {unreadCount > 0 && (
                      <button className="mark-read-btn" onClick={markAllAsRead}>
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="notifications-list">
                    {notifications.length === 0 ? (
                      <div className="notifications-empty">
                        <i className="fas fa-bell-slash"></i>
                        <span>কোনো নোটিফিকেশন পাওয়া যায়নি</span>
                      </div>
                    ) : (
                      notifications.map((notif) => {
                        const isUnread = !readIds.includes(notif.id);
                        return (
                          <Link
                            key={notif.id}
                            href={notif.link}
                            className={`notification-item ${isUnread ? "unread" : ""}`}
                            onClick={() => handleNotificationClick(notif.id)}
                          >
                            <div
                              className="notification-icon-wrapper"
                              style={{ backgroundColor: notif.color }}
                            >
                              <i className={notif.icon}></i>
                            </div>
                            <div className="notification-info">
                              <span className="notification-title">{notif.title}</span>
                              <span className="notification-text">{notif.text}</span>
                              <span className="notification-time">
                                <i className="far fa-clock"></i> {formatTimeAgo(notif.time)}
                              </span>
                            </div>
                          </Link>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Messages Inbox Dropdown - Only for Admins in Admin/SuperAdmin View */}
            {showAdminFeatures && (
              <div className="notifications-container" ref={messagesRef}>
                <button
                  className="topbar-btn"
                  onClick={toggleMessagesDropdown}
                  title="Messages"
                >
                  <i className="fas fa-envelope"></i>
                  {unreadMessagesCount > 0 && <span className="badge">{unreadMessagesCount}</span>}
                </button>

                {messagesOpen && (
                  <div className="notifications-dropdown">
                    <div className="notifications-header">
                      <h4>
                        <i className="fas fa-envelope"></i> ইনবক্স (Messages)
                      </h4>
                      {unreadMessagesCount > 0 && (
                        <button className="mark-read-btn" onClick={markAllMessagesAsRead}>
                          Mark read
                        </button>
                      )}
                    </div>

                    <div className="notifications-list">
                      {messages.length === 0 ? (
                        <div className="notifications-empty">
                          <i className="fas fa-envelope-open"></i>
                          <span>ইনবক্স খালি</span>
                        </div>
                      ) : (
                        messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`notification-item ${!msg.isRead ? "unread" : ""}`}
                            onClick={() => handleMessageClick(msg)}
                            style={{ cursor: "pointer" }}
                          >
                            <div
                              className="notification-icon-wrapper"
                              style={{ backgroundColor: "#e67e22" }}
                            >
                              <i className="fas fa-user"></i>
                            </div>
                            <div className="notification-info">
                              <span className="notification-title">{msg.name}</span>
                              <span className="notification-text" style={{ fontWeight: !msg.isRead ? "bold" : "normal" }}>
                                {msg.subject}
                              </span>
                              <span className="notification-text" style={{ fontSize: "11px", color: "#666" }}>
                                {msg.message.substring(0, 60)}{msg.message.length > 60 ? "..." : ""}
                              </span>
                              <span className="notification-time">
                                <i className="far fa-clock"></i> {formatTimeAgo(new Date(msg.date))}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="profile-dropdown-container" ref={userDropdownRef}>
              <div className="user-profile" onClick={() => setUserDropdownOpen(!userDropdownOpen)}>
                <div className="user-avatar-placeholder">
                  {userInfo.avatar ? (
                    <img src={userInfo.avatar} alt={displayName} />
                  ) : (
                    displayName.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="user-profile-info">
                  <span className="name">{displayName}</span>
                  <span className="role">{roleBadge}</span>
                </div>
                <i className={`fas fa-chevron-${userDropdownOpen ? "up" : "down"} profile-chevron`} style={{ fontSize: "11px", color: "#888", marginLeft: "5px" }} />
              </div>

              {userDropdownOpen && (
                <div className="profile-dropdown">
                  <div className="profile-dropdown-header">
                    <div className="profile-dropdown-avatar">
                      {userInfo.avatar ? (
                        <img src={userInfo.avatar} alt={displayName} />
                      ) : (
                        displayName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="profile-dropdown-user-details">
                      <span className="profile-dropdown-name">{displayName}</span>
                      <span className="profile-dropdown-email">{userInfo.email}</span>
                      <span className="profile-dropdown-role-badge">{roleBadge}</span>
                    </div>
                  </div>
                  <div className="profile-dropdown-divider"></div>
                  <div className="profile-dropdown-menu">
                    <button className="profile-dropdown-item" onClick={() => { setProfileSettingsOpen(true); setUserDropdownOpen(false); }}>
                      <i className="fas fa-user-cog"></i>
                      <span>প্রোফাইল সেটিংস (Profile Settings)</span>
                    </button>
                    <button className="profile-dropdown-item" onClick={() => { setPasswordChangeOpen(true); setUserDropdownOpen(false); }}>
                      <i className="fas fa-key"></i>
                      <span>পাসওয়ার্ড পরিবর্তন (Change Password)</span>
                    </button>
                    <div className="profile-dropdown-divider"></div>
                    <form action={logout}>
                      <button type="submit" className="profile-dropdown-item logout">
                        <i className="fas fa-sign-out-alt"></i>
                        <span>লগআউট (Logout)</span>
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="dashboard-content">{children}</div>
      </main>

      {/* Message Details Modal Overlay */}
      {selectedMessage && (
        <div className="modal-overlay" style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 11000
        }}>
          <div className="modal-content" style={{
            background: "white", padding: "30px", borderRadius: "12px",
            width: "100%", maxWidth: "500px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            color: "#333", position: "relative"
          }}>
            <div className="modal-header" style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              borderBottom: "1px solid #eee", paddingBottom: "10px", marginBottom: "15px"
            }}>
              <h2 style={{ margin: 0, fontSize: "1.3rem", color: "var(--primary-dark)" }}>বার্তা বিবরণ (Message Details)</h2>
              <button className="close-btn" style={{
                background: "none", border: "none", fontSize: "1.6rem", cursor: "pointer", color: "#666"
              }} onClick={() => setSelectedMessage(null)}>
                &times;
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px" }}>
              <div><strong>প্রেরক (From):</strong> {selectedMessage.name} ({selectedMessage.email})</div>
              <div><strong>বিষয় (Subject):</strong> {selectedMessage.subject}</div>
              <div><strong>তারিখ (Date):</strong> {new Date(selectedMessage.date).toLocaleString("bn-BD")}</div>
              <div style={{
                background: "#f9f9f9", padding: "12px", borderRadius: "8px",
                border: "1px solid #eee", whiteSpace: "pre-wrap", marginTop: "8px",
                lineHeight: "1.5", fontSize: "13.5px"
              }}>
                {selectedMessage.message}
              </div>
            </div>

            <div className="modal-actions" style={{
              display: "flex", justifyContent: "flex-end", gap: "10px",
              marginTop: "25px", borderTop: "1px solid #eee", paddingTop: "15px"
            }}>
              <button
                className="btn btn-secondary btn-compact"
                onClick={() => handleDeleteMessage(selectedMessage.id)}
                style={{ background: "#e74c3c", color: "white", border: "none", cursor: "pointer" }}
              >
                <i className="fas fa-trash"></i> মুছুন (Delete)
              </button>
              <a
                href={`mailto:${selectedMessage.email}?subject=RE: ${encodeURIComponent(selectedMessage.subject)}`}
                className="btn btn-primary btn-compact"
                style={{ textDecoration: "none" }}
              >
                <i className="fas fa-reply"></i> উত্তর দিন (Reply)
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Profile Settings Modal Overlay */}
      {profileSettingsOpen && (
        <div className="modal-overlay" style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 11000
        }}>
          <div className="modal-content" style={{
            background: "white", padding: "30px", borderRadius: "12px",
            width: "100%", maxWidth: "450px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            color: "#333", position: "relative"
          }}>
            <div className="modal-header" style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              borderBottom: "1px solid #eee", paddingBottom: "10px", marginBottom: "15px"
            }}>
              <h2 style={{ margin: 0, fontSize: "1.3rem", color: "var(--primary-dark)" }}>প্রোফাইল সেটিংস (Profile Settings)</h2>
              <button className="close-btn" style={{
                background: "none", border: "none", fontSize: "1.6rem", cursor: "pointer", color: "#666"
              }} onClick={() => { setProfileSettingsOpen(false); setProfileErrorState(""); setProfileSuccess(""); }}>
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateProfile}>
              {profileError && (
                <div className="modal-alert modal-alert-danger">
                  <i className="fas fa-exclamation-circle"></i>
                  <span>{profileError}</span>
                </div>
              )}
              {profileSuccess && (
                <div className="modal-alert modal-alert-success">
                  <i className="fas fa-check-circle"></i>
                  <span>{profileSuccess}</span>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>পূর্ণ নাম (Full Name)</label>
                  <input
                    type="text"
                    className="cfg-input"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    required
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #ddd" }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>ইমেইল অ্যাড্রেস (Email Address)</label>
                  <input
                    type="email"
                    className="cfg-input"
                    value={userInfo.email}
                    disabled
                    style={{
                      width: "100%", padding: "10px 12px", borderRadius: "8px",
                      border: "1px solid #ddd", background: "#f5f5f5", cursor: "not-allowed"
                    }}
                  />
                  <span style={{ fontSize: "11px", color: "#888", marginTop: "4px", display: "block" }}>
                    নিরাপত্তাজনিত কারণে সরাসরি ইমেইল পরিবর্তন করা যাবে না।
                  </span>
                </div>
              </div>

              <div className="modal-actions" style={{
                display: "flex", justifyContent: "flex-end", gap: "10px",
                marginTop: "25px", borderTop: "1px solid #eee", paddingTop: "15px"
              }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-compact"
                  onClick={() => { setProfileSettingsOpen(false); setProfileErrorState(""); setProfileSuccess(""); }}
                  disabled={profileLoading}
                >
                  বাতিল (Cancel)
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-compact"
                  disabled={profileLoading}
                >
                  {profileLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>} সংরক্ষণ করুন (Save)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Change Modal Overlay */}
      {passwordChangeOpen && (
        <div className="modal-overlay" style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 11000
        }}>
          <div className="modal-content" style={{
            background: "white", padding: "30px", borderRadius: "12px",
            width: "100%", maxWidth: "450px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            color: "#333", position: "relative"
          }}>
            <div className="modal-header" style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              borderBottom: "1px solid #eee", paddingBottom: "10px", marginBottom: "15px"
            }}>
              <h2 style={{ margin: 0, fontSize: "1.3rem", color: "var(--primary-dark)" }}>পাসওয়ার্ড পরিবর্তন (Change Password)</h2>
              <button className="close-btn" style={{
                background: "none", border: "none", fontSize: "1.6rem", cursor: "pointer", color: "#666"
              }} onClick={() => { setPasswordChangeOpen(false); setPasswordError(""); setPasswordSuccess(""); }}>
                &times;
              </button>
            </div>

            <form onSubmit={handleChangePassword}>
              {passwordError && (
                <div className="modal-alert modal-alert-danger">
                  <i className="fas fa-exclamation-circle"></i>
                  <span>{passwordError}</span>
                </div>
              )}
              {passwordSuccess && (
                <div className="modal-alert modal-alert-success">
                  <i className="fas fa-check-circle"></i>
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>নতুন পাসওয়ার্ড (New Password)</label>
                  <input
                    type="password"
                    className="cfg-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="কমপক্ষে ৬টি ক্যারেক্টার"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #ddd" }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>পাসওয়ার্ড নিশ্চিত করুন (Confirm Password)</label>
                  <input
                    type="password"
                    className="cfg-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="পাসওয়ার্ডটি পুনরায় টাইপ করুন"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #ddd" }}
                  />
                </div>
              </div>

              <div className="modal-actions" style={{
                display: "flex", justifyContent: "flex-end", gap: "10px",
                marginTop: "25px", borderTop: "1px solid #eee", paddingTop: "15px"
              }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-compact"
                  onClick={() => { setPasswordChangeOpen(false); setPasswordError(""); setPasswordSuccess(""); }}
                  disabled={passwordLoading}
                >
                  বাতিল (Cancel)
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-compact"
                  disabled={passwordLoading}
                >
                  {passwordLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-key"></i>} পরিবর্তন করুন (Update)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
