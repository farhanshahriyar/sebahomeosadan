"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import AddUserButton from "@/components/dashboard/AddUserButton";
import UserRoleSelect from "@/components/dashboard/UserRoleSelect";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [callerRole, setCallerRole] = useState("author");
  
  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  const supabase = createClient();

  // 1. Authorize User and get caller role
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin" && profile?.role !== "super_admin") {
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

  // Derive stats
  const adminCount = users.filter(u => u.role === "admin" || u.role === "super_admin").length;
  const authorCount = users.filter(u => u.role === "author").length;
  const dbOk = !loading && users.length > 0;

  // Filter users based on search
  const filteredUsers = users.filter((user) => {
    const nameMatch = (user.full_name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const idMatch = user.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Friendly role translation search
    let roleText = user.role;
    if (user.role === "super_admin") roleText = "super admin";
    else if (user.role === "admin") roleText = "admin";
    else if (user.role === "author") roleText = "author";
    
    const roleMatch = roleText.includes(searchTerm.toLowerCase());
    return nameMatch || idMatch || roleMatch;
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
              {/* Local Search input aligned with other dashboard lists */}
              <div className="filter-bar" style={{ display: "flex", gap: "16px", padding: "16px 20px", background: "#f8f9fa", borderBottom: "1px solid #eee", alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "240px", position: "relative" }}>
                  <i className="fas fa-search" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#888", fontSize: "14px" }} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleLocalSearchChange(e.target.value)}
                    placeholder="নাম, আইডি বা রোল (Admin/Author/Super Admin) দিয়ে খুঁজুন..."
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
                  <h3 style={{ color: "#888", fontWeight: 500, marginBottom: "8px" }}>কোনো মিল পাওয়া যায়নি</h3>
                  <p style={{ color: "#bbb", fontSize: "14px", margin: 0 }}>আপনার ফিল্টার বা খোঁজা শব্দের সাথে কোনো ব্যবহারকারী মিলছে না।</p>
                </div>
              ) : (
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>User ID</th>
                      <th>Role</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td><strong>{user.full_name || "Unknown"}</strong></td>
                        <td style={{ fontSize: '12px', color: '#666' }}>{user.id.substring(0, 8)}...</td>
                        <td>
                          <UserRoleSelect userId={user.id} currentRole={user.role} callerRole={callerRole} />
                        </td>
                        <td>{new Date(user.created_at).toLocaleDateString()}</td>
                        <td>
                          <button className="action-btn action-delete"><i className="fas fa-ban"></i></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
