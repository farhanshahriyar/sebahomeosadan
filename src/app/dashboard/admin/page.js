import { createClient } from "@/lib/supabase/server";
import AddUserButton from "@/components/dashboard/AddUserButton";
import UserRoleSelect from "@/components/dashboard/UserRoleSelect";

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Fetch current user's role
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", currentUser?.id)
    .single();
  const callerRole = currentProfile?.role || "author";
  
  // Fetch all profiles
  const { data: users, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  // Get auth metadata to match emails (if possible via rpc, otherwise we just show profiles data)
  // Since `profiles` doesn't store email, we might have an issue displaying emails!
  // Supabase profiles table created earlier: id, full_name, role, avatar_url, created_at, updated_at
  // We can't fetch emails without admin access. For now, we'll display the ID or fetch emails if we use admin client.
  // Actually, we can fetch emails using supabaseAdmin in a server action, or we just don't show email.

  const adminCount = users?.filter(u => u.role === "admin" || u.role === "super_admin").length || 0;
  const authorCount = users?.filter(u => u.role === "author").length || 0;

  // Real database health check
  let dbOk = true;
  try {
    const { error: pingError } = await supabase.from("profiles").select("id").limit(1);
    if (pingError) dbOk = false;
  } catch {
    dbOk = false;
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
          <AddUserButton />
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
              {users?.map((user) => (
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
              {!users?.length && (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
