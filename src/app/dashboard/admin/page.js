"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import AddUserButton from "@/components/dashboard/AddUserButton";
import UserRoleSelect from "@/components/dashboard/UserRoleSelect";
import { updateUserNameAction, deleteUserAction, toggleBanUserAction } from "./actions";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [callerRole, setCallerRole] = useState("author");
  const [currentUserId, setCurrentUserId] = useState(null);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  // Edit Name modal state
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState(null);

  // Delete modal state
  const [deletingUser, setDeletingUser] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Ban modal state
  const [banningUser, setBanningUser] = useState(null);
  const [banning, setBanning] = useState(false);
  const [banError, setBanError] = useState(null);

  const supabase = createClient();

  // 1. Authorize User and get caller role
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
        return;
      }
      setCurrentUserId(user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "super_admin") {
        window.location.href = "/dashboard";
        return;
      }
      setCallerRole(profile.role);
      setAuthChecking(false);
    }
    checkAuth();
  }, [supabase]);

  // 2. Fetch all profiles
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setUsers(data);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (!authChecking) {
      fetchUsers();
    }
  }, [authChecking, fetchUsers]);

  // 3. Sync search query parameter on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("search");
      if (q) {
        setSearchTerm(q);
        window.dispatchEvent(new CustomEvent("dashboard-search-sync", { detail: q }));
      }
    }
  }, []);

  // 4. Listen to global topbar search events
  useEffect(() => {
    const handleGlobalSearch = (e) => {
      setSearchTerm(e.detail || "");
    };
    window.addEventListener("dashboard-search", handleGlobalSearch);
    return () => window.removeEventListener("dashboard-search", handleGlobalSearch);
  }, []);

  const handleLocalSearchChange = (val) => {
    setSearchTerm(val);
    window.dispatchEvent(new CustomEvent("dashboard-search-sync", { detail: val }));
  };

  // Edit Name handlers
  const handleOpenEditName = (user) => {
    setEditingUser(user);
    setEditName(user.full_name || "");
    setEditError(null);
  };

  const handleSaveEditName = async () => {
    if (!editingUser) return;
    if (!editName.trim()) {
      setEditError("নাম খালি রাখা যাবে না।");
      return;
    }
    setEditSaving(true);
    setEditError(null);
    const result = await updateUserNameAction(editingUser.id, editName.trim());
    if (result?.error) {
      setEditError(result.error);
      setEditSaving(false);
    } else {
      setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, full_name: editName.trim() } : u));
      setEditingUser(null);
      setEditName("");
      setEditSaving(false);
    }
  };

  // Delete handlers
  const handleOpenDelete = (user) => {
    setDeletingUser(user);
    setDeleteConfirmText("");
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    if (deleteConfirmText !== "DELETE") {
      setDeleteError("অনুগ্রহ করে নিশ্চিত করতে 'DELETE' টাইপ করুন।");
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteUserAction(deletingUser.id);
    if (result?.error) {
      setDeleteError(result.error);
      setDeleting(false);
    } else {
      setUsers(prev => prev.filter(u => u.id !== deletingUser.id));
      setDeletingUser(null);
      setDeleteConfirmText("");
      setDeleting(false);
    }
  };

  // Ban/Unban handlers
  const handleOpenBan = (user) => {
    setBanningUser(user);
    setBanError(null);
  };

  const handleConfirmBan = async () => {
    if (!banningUser) return;
    const shouldBan = !banningUser.is_banned;
    setBanning(true);
    setBanError(null);
    const result = await toggleBanUserAction(banningUser.id, shouldBan);
    if (result?.error) {
      setBanError(result.error);
      setBanning(false);
    } else {
      setUsers(prev => prev.map(u => u.id === banningUser.id ? { ...u, is_banned: shouldBan } : u));
      setBanningUser(null);
      setBanning(false);
    }
  };

  // Derive stats
  const adminCount = users.filter(u => u.role === "admin" || u.role === "super_admin").length;
  const authorCount = users.filter(u => u.role === "author").length;
  const bannedCount = users.filter(u => u.is_banned).length;
  const dbOk = !loading && users.length > 0;

  // Filter users based on search
  const filteredUsers = users.filter((user) => {
    const nameMatch = (user.full_name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const idMatch = user.id.toLowerCase().includes(searchTerm.toLowerCase());

    let roleText = user.role;
    if (user.role === "super_admin") roleText = "super admin";
    else if (user.role === "admin") roleText = "admin";
    else if (user.role === "author") roleText = "author";

    const roleMatch = roleText.includes(searchTerm.toLowerCase());
    const banMatch = user.is_banned && "banned".includes(searchTerm.toLowerCase());
    return nameMatch || idMatch || roleMatch || banMatch;
  });

  if (authChecking) {
    return (
      <div style={{ padding: "100px", textAlign: "center", color: "#999" }}>
        <i className="fas fa-shield-alt fa-spin" style={{ fontSize: "32px", color: "var(--primary)" }} />
        <p style={{ marginTop: "16px" }}>অনুমোদন যাচাই করা হচ্ছে...</p>
      </div>
    );
  }

  return (
    <>
      <div className="dashboard-header">
        <div>
          <h1>Manage Users</h1>
          <div className="breadcrumb">
            <a href="/dashboard">Dashboard</a> / Manage Users
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-accent" style={{ padding: '10px 20px', fontSize: '14px' }}>
            <i className="fas fa-cog"></i> Site Settings
          </button>
          <AddUserButton onUserAdded={fetchUsers} />
        </div>
      </div>

      <div className="stat-cards">
        <div className="stat-card primary">
          <div className="stat-icon">
            <i className="fas fa-users-cog"></i>
          </div>
          <div className="stat-info">
            <h3>{adminCount}</h3>
            <p>Admin Users</p>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon">
            <i className="fas fa-user-edit"></i>
          </div>
          <div className="stat-info">
            <h3>{authorCount}</h3>
            <p>Active Authors</p>
          </div>
        </div>

        {bannedCount > 0 && (
          <div className="stat-card danger">
            <div className="stat-icon">
              <i className="fas fa-user-slash"></i>
            </div>
            <div className="stat-info">
              <h3>{bannedCount}</h3>
              <p>Banned Users</p>
            </div>
          </div>
        )}

        <a href="/dashboard/status" style={{ textDecoration: 'none' }}>
          <div className={`stat-card ${dbOk ? 'accent' : 'danger'}`}>
            <div className="stat-icon">
              <i className={`fas ${dbOk ? 'fa-shield-alt' : 'fa-exclamation-triangle'}`}></i>
            </div>
            <div className="stat-info">
              <h3>System</h3>
              <p>{dbOk ? 'Healthy' : 'Issue Detected'}</p>
            </div>
          </div>
        </a>
      </div>

      <div className="dashboard-panel">
        <div className="panel-header">
          <h2>User Management</h2>
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#999" }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: "24px" }} />
              <p style={{ marginTop: "12px" }}>লোড হচ্ছে...</p>
            </div>
          ) : (
            <>
              <div className="filter-bar" style={{ display: "flex", gap: "16px", padding: "16px 20px", background: "#f8f9fa", borderBottom: "1px solid #eee", alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "240px", position: "relative" }}>
                  <i className="fas fa-search" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#888", fontSize: "14px" }} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleLocalSearchChange(e.target.value)}
                    placeholder="নাম, আইডি বা রোল (Admin/Author/Super Admin) দিয়ে খুঁজুন..."
                    style={{
                      width: "100%",
                      padding: "10px 12px 10px 38px",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      fontSize: "14px",
                      outline: "none",
                      transition: "all 0.2s ease"
                    }}
                  />
                </div>
              </div>

              {filteredUsers.length === 0 ? (
                <div style={{ padding: "60px 40px", textAlign: "center", color: "#999" }}>
                  <i className="fas fa-search" style={{ fontSize: "40px", color: "#ddd", marginBottom: "16px", display: "block" }} />
                  <h3 style={{ color: "#888", fontWeight: 500, marginBottom: "8px" }}>কোনো মিল পাওয়া যায়নি</h3>
                  <p style={{ color: "#bbb", fontSize: "14px", margin: 0 }}>আপনার ফিল্টার বা খোঁজা শব্দের সাথে কোনো ব্যবহারকারী মিলছে না।</p>
                </div>
              ) : (
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>User ID</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => {
                      const isSelf = user.id === currentUserId;
                      const isSuperAdmin = user.role === "super_admin";
                      const isBanned = user.is_banned;
                      return (
                        <tr key={user.id} style={isBanned ? { background: "#fef2f2", opacity: 0.85 } : {}}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <strong style={isBanned ? { textDecoration: "line-through", color: "#999" } : {}}>
                                {user.full_name || "Unknown"}
                              </strong>
                              {isBanned && (
                                <span style={{
                                  fontSize: "10px", fontWeight: 700,
                                  color: "#dc2626", background: "#fef2f2",
                                  border: "1px solid #fecaca",
                                  padding: "2px 6px", borderRadius: "4px",
                                  textTransform: "uppercase", letterSpacing: "0.5px"
                                }}>
                                  BANNED
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ fontSize: '12px', color: '#666' }}>{user.id.substring(0, 8)}...</td>
                          <td>
                            <UserRoleSelect userId={user.id} currentRole={user.role} callerRole={callerRole} />
                          </td>
                          <td>
                            {isBanned ? (
                              <span className="status-badge status-draft" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                                <i className="fas fa-ban" style={{ marginRight: "4px", fontSize: "10px" }} /> Banned
                              </span>
                            ) : (
                              <span className="status-badge status-published">
                                <i className="fas fa-check-circle" style={{ marginRight: "4px", fontSize: "10px" }} /> Active
                              </span>
                            )}
                          </td>
                          <td>{new Date(user.created_at).toLocaleDateString()}</td>
                          <td>
                            <div style={{ display: "flex", gap: "6px" }}>
                              {/* Edit Name */}
                              <button
                                onClick={() => handleOpenEditName(user)}
                                title="নাম সম্পাদনা করুন"
                                style={{
                                  width: "30px", height: "30px",
                                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                                  border: "1px solid #d0d5dd", borderRadius: "6px",
                                  background: "#fff", cursor: "pointer",
                                  color: "#3b82f6", transition: "all 0.2s ease"
                                }}
                              >
                                <i className="fas fa-pen" style={{ fontSize: "12px" }} />
                              </button>

                              {/* Ban/Unban */}
                              <button
                                onClick={() => handleOpenBan(user)}
                                title={
                                  isSelf ? "নিজেকে ব্যান করতে পারবেন না" :
                                  isSuperAdmin ? "Super Admin ব্যান করা যাবে না" :
                                  isBanned ? "আনব্যান করুন" : "ব্যান করুন"
                                }
                                disabled={isSelf || isSuperAdmin}
                                style={{
                                  width: "30px", height: "30px",
                                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                                  border: `1px solid ${isBanned ? "#bbf7d0" : "#fed7aa"}`,
                                  borderRadius: "6px",
                                  background: isBanned ? "#f0fdf4" : "#fff7ed",
                                  cursor: (isSelf || isSuperAdmin) ? "not-allowed" : "pointer",
                                  color: isBanned ? "#16a34a" : "#ea580c",
                                  opacity: (isSelf || isSuperAdmin) ? 0.4 : 1,
                                  transition: "all 0.2s ease"
                                }}
                              >
                                <i className={isBanned ? "fas fa-user-check" : "fas fa-ban"} style={{ fontSize: "12px" }} />
                              </button>

                              {/* Delete User */}
                              <button
                                onClick={() => handleOpenDelete(user)}
                                title={isSelf ? "নিজের অ্যাকাউন্ট মুছতে পারবেন না" : (isSuperAdmin ? "Super Admin মুছতে পারবেন না" : "ব্যবহারকারী মুছুন")}
                                disabled={isSelf || isSuperAdmin}
                                style={{
                                  width: "30px", height: "30px",
                                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                                  border: "1px solid #d0d5dd", borderRadius: "6px",
                                  background: "#fff", cursor: (isSelf || isSuperAdmin) ? "not-allowed" : "pointer",
                                  color: (isSelf || isSuperAdmin) ? "#ccc" : "#ef4444",
                                  opacity: (isSelf || isSuperAdmin) ? 0.4 : 1,
                                  transition: "all 0.2s ease"
                                }}
                              >
                                <i className="fas fa-trash-alt" style={{ fontSize: "12px" }} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>

      {/* ===== Edit Name Modal ===== */}
      {editingUser && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "440px" }}>
            <div className="modal-header">
              <h2 style={{ fontSize: "1.2rem", margin: 0, color: "var(--primary-dark)" }}>
                <i className="fas fa-pen" style={{ marginRight: "8px", fontSize: "16px" }} />
                নাম সম্পাদনা করুন
              </h2>
              <button
                className="close-btn"
                onClick={() => { setEditingUser(null); setEditError(null); }}
                style={{ background: "none", border: "none", fontSize: "1.6rem", cursor: "pointer" }}
              >
                &times;
              </button>
            </div>
            <div style={{ marginTop: "15px" }}>
              {editError && (
                <div style={{ color: "#e74c3c", background: "rgba(231,76,60,0.08)", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "14px", border: "1px solid rgba(231,76,60,0.15)" }}>
                  <i className="fas fa-exclamation-circle" style={{ marginRight: "6px" }} />{editError}
                </div>
              )}

              <div style={{ marginBottom: "12px" }}>
                <p style={{ fontSize: "13px", color: "#667085", margin: "0 0 6px 0" }}>User ID</p>
                <p style={{ fontSize: "12px", color: "#999", fontFamily: "monospace", margin: 0, background: "#f8f9fa", padding: "6px 10px", borderRadius: "6px" }}>
                  {editingUser.id}
                </p>
              </div>

              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600", color: "#333" }}>পুরো নাম (Full Name)</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="ব্যবহারকারীর নাম লিখুন..."
                  autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter") handleSaveEditName(); }}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px" }}
                />
              </div>

              <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px", borderTop: "1px solid #eee", paddingTop: "14px" }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-compact"
                  onClick={() => { setEditingUser(null); setEditError(null); }}
                  disabled={editSaving}
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-compact"
                  onClick={handleSaveEditName}
                  disabled={editSaving || !editName.trim()}
                >
                  {editSaving ? (
                    <><i className="fas fa-spinner fa-spin" style={{ marginRight: "6px" }} /> সংরক্ষণ হচ্ছে...</>
                  ) : (
                    <><i className="fas fa-check" style={{ marginRight: "6px" }} /> সংরক্ষণ করুন</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Delete User Modal ===== */}
      {deletingUser && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "460px" }}>
            <div className="modal-header">
              <h2 style={{ fontSize: "1.2rem", margin: 0, color: "#dc2626" }}>
                <i className="fas fa-exclamation-triangle" style={{ marginRight: "8px", fontSize: "16px" }} />
                ব্যবহারকারী মুছুন
              </h2>
              <button
                className="close-btn"
                onClick={() => { setDeletingUser(null); setDeleteError(null); }}
                style={{ background: "none", border: "none", fontSize: "1.6rem", cursor: "pointer" }}
              >
                &times;
              </button>
            </div>
            <div style={{ marginTop: "15px" }}>
              {deleteError && (
                <div style={{ color: "#e74c3c", background: "rgba(231,76,60,0.08)", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "14px", border: "1px solid rgba(231,76,60,0.15)" }}>
                  <i className="fas fa-exclamation-circle" style={{ marginRight: "6px" }} />{deleteError}
                </div>
              )}

              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "16px", marginBottom: "16px" }}>
                <p style={{ margin: "0 0 8px 0", fontWeight: 600, color: "#991b1b", fontSize: "14px" }}>
                  ⚠️ এই অ্যাকশনটি ফেরত নেওয়া যাবে না!
                </p>
                <p style={{ margin: 0, fontSize: "13px", color: "#7f1d1d", lineHeight: 1.5 }}>
                  <strong>{deletingUser.full_name || "Unknown"}</strong> ({deletingUser.role}) ব্যবহারকারীকে স্থায়ীভাবে মুছে ফেলা হবে। তার সমস্ত ডেটা, আর্টিকেল, এবং প্রোফাইল তথ্য মুছে যাবে।
                </p>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <p style={{ fontSize: "13px", color: "#667085", margin: "0 0 6px 0" }}>User ID</p>
                <p style={{ fontSize: "12px", color: "#999", fontFamily: "monospace", margin: 0, background: "#f8f9fa", padding: "6px 10px", borderRadius: "6px" }}>
                  {deletingUser.id}
                </p>
              </div>

              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600", color: "#333" }}>
                  নিশ্চিত করতে <span style={{ color: "#dc2626", fontFamily: "monospace", fontWeight: 700 }}>DELETE</span> টাইপ করুন
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter" && deleteConfirmText === "DELETE") handleConfirmDelete(); }}
                  style={{
                    width: "100%", padding: "10px 12px",
                    border: `1px solid ${deleteConfirmText === "DELETE" ? "#22c55e" : "#ddd"}`,
                    borderRadius: "6px", fontSize: "14px", fontFamily: "monospace",
                    transition: "border-color 0.2s ease"
                  }}
                />
              </div>

              <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px", borderTop: "1px solid #eee", paddingTop: "14px" }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-compact"
                  onClick={() => { setDeletingUser(null); setDeleteError(null); }}
                  disabled={deleting}
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  className="btn btn-compact"
                  onClick={handleConfirmDelete}
                  disabled={deleting || deleteConfirmText !== "DELETE"}
                  style={{
                    background: deleteConfirmText === "DELETE" ? "#dc2626" : "#fca5a5",
                    color: "#fff", border: "none", padding: "8px 18px",
                    borderRadius: "8px", fontWeight: 600,
                    cursor: (deleting || deleteConfirmText !== "DELETE") ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  {deleting ? (
                    <><i className="fas fa-spinner fa-spin" style={{ marginRight: "6px" }} /> মুছে ফেলা হচ্ছে...</>
                  ) : (
                    <><i className="fas fa-trash-alt" style={{ marginRight: "6px" }} /> স্থায়ীভাবে মুছুন</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Ban/Unban User Modal ===== */}
      {banningUser && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "460px" }}>
            <div className="modal-header">
              <h2 style={{ fontSize: "1.2rem", margin: 0, color: banningUser.is_banned ? "#16a34a" : "#ea580c" }}>
                <i className={banningUser.is_banned ? "fas fa-user-check" : "fas fa-ban"} style={{ marginRight: "8px", fontSize: "16px" }} />
                {banningUser.is_banned ? "ব্যবহারকারী আনব্যান করুন" : "ব্যবহারকারী ব্যান করুন"}
              </h2>
              <button
                className="close-btn"
                onClick={() => { setBanningUser(null); setBanError(null); }}
                style={{ background: "none", border: "none", fontSize: "1.6rem", cursor: "pointer" }}
              >
                &times;
              </button>
            </div>
            <div style={{ marginTop: "15px" }}>
              {banError && (
                <div style={{ color: "#e74c3c", background: "rgba(231,76,60,0.08)", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "14px", border: "1px solid rgba(231,76,60,0.15)" }}>
                  <i className="fas fa-exclamation-circle" style={{ marginRight: "6px" }} />{banError}
                </div>
              )}

              {banningUser.is_banned ? (
                /* Unban UI */
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "16px", marginBottom: "16px" }}>
                  <p style={{ margin: "0 0 8px 0", fontWeight: 600, color: "#166534", fontSize: "14px" }}>
                    ✅ আনব্যান নিশ্চিতকরণ
                  </p>
                  <p style={{ margin: 0, fontSize: "13px", color: "#14532d", lineHeight: 1.5 }}>
                    <strong>{banningUser.full_name || "Unknown"}</strong> ({banningUser.role}) ব্যবহারকারীকে আনব্যান করলে সে আবার লগইন করতে ও ড্যাশবোর্ড ব্যবহার করতে পারবে।
                  </p>
                </div>
              ) : (
                /* Ban UI */
                <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "10px", padding: "16px", marginBottom: "16px" }}>
                  <p style={{ margin: "0 0 8px 0", fontWeight: 600, color: "#9a3412", fontSize: "14px" }}>
                    🚫 ব্যান নিশ্চিতকরণ
                  </p>
                  <p style={{ margin: 0, fontSize: "13px", color: "#7c2d12", lineHeight: 1.5 }}>
                    <strong>{banningUser.full_name || "Unknown"}</strong> ({banningUser.role}) ব্যবহারকারীকে ব্যান করলে:
                  </p>
                  <ul style={{ margin: "8px 0 0 0", padding: "0 0 0 18px", fontSize: "13px", color: "#7c2d12", lineHeight: 1.8 }}>
                    <li>সে আর লগইন করতে পারবে না</li>
                    <li>তার সক্রিয় সেশন বাতিল হবে</li>
                    <li>ড্যাশবোর্ড অ্যাক্সেস বন্ধ হবে</li>
                    <li>তবে তার ডেটা ও আর্টিকেল সংরক্ষিত থাকবে</li>
                  </ul>
                </div>
              )}

              <div style={{ marginBottom: "12px" }}>
                <p style={{ fontSize: "13px", color: "#667085", margin: "0 0 6px 0" }}>User Details</p>
                <div style={{ background: "#f8f9fa", padding: "10px 14px", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                    <span style={{ color: "#888" }}>Name:</span>
                    <strong style={{ color: "#333" }}>{banningUser.full_name || "Unknown"}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                    <span style={{ color: "#888" }}>Role:</span>
                    <span style={{ color: "#333" }}>{banningUser.role}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                    <span style={{ color: "#888" }}>ID:</span>
                    <span style={{ color: "#999", fontFamily: "monospace", fontSize: "11px" }}>{banningUser.id}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                    <span style={{ color: "#888" }}>Current Status:</span>
                    <span style={{ color: banningUser.is_banned ? "#dc2626" : "#16a34a", fontWeight: 600 }}>
                      {banningUser.is_banned ? "🚫 Banned" : "✅ Active"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px", borderTop: "1px solid #eee", paddingTop: "14px" }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-compact"
                  onClick={() => { setBanningUser(null); setBanError(null); }}
                  disabled={banning}
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  className="btn btn-compact"
                  onClick={handleConfirmBan}
                  disabled={banning}
                  style={{
                    background: banningUser.is_banned ? "#16a34a" : "#ea580c",
                    color: "#fff", border: "none", padding: "8px 18px",
                    borderRadius: "8px", fontWeight: 600,
                    cursor: banning ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  {banning ? (
                    <><i className="fas fa-spinner fa-spin" style={{ marginRight: "6px" }} /> প্রক্রিয়াকরণ হচ্ছে...</>
                  ) : banningUser.is_banned ? (
                    <><i className="fas fa-user-check" style={{ marginRight: "6px" }} /> আনব্যান করুন</>
                  ) : (
                    <><i className="fas fa-ban" style={{ marginRight: "6px" }} /> ব্যান করুন</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
