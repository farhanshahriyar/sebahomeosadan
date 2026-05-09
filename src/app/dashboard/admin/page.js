export default function AdminDashboard() {
  return (
    <>
      <div className="dashboard-header">
        <div>
          <h1>Admin Dashboard</h1>
          <div className="breadcrumb">
            <a href="/dashboard">Dashboard</a> / Admin Panel
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-accent" style={{ padding: '10px 20px', fontSize: '14px' }}>
            <i className="fas fa-cog"></i> Site Settings
          </button>
          <button className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '14px' }}>
            <i className="fas fa-user-plus"></i> Add User
          </button>
        </div>
      </div>

      <div className="stat-cards">
        <div className="stat-card primary">
          <div className="stat-icon">
            <i className="fas fa-users-cog"></i>
          </div>
          <div className="stat-info">
            <h3>4</h3>
            <p>Admin Users</p>
          </div>
        </div>
        
        <div className="stat-card info">
          <div className="stat-icon">
            <i className="fas fa-user-edit"></i>
          </div>
          <div className="stat-info">
            <h3>12</h3>
            <p>Active Authors</p>
          </div>
        </div>
        
        <div className="stat-card accent">
          <div className="stat-icon">
            <i className="fas fa-shield-alt"></i>
          </div>
          <div className="stat-info">
            <h3>System</h3>
            <p>Healthy</p>
          </div>
        </div>
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
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Md. Amirul Islam</strong></td>
                <td>amirul1068@gmail.com</td>
                <td><span className="status-badge status-published">Super Admin</span></td>
                <td>Active</td>
                <td>Jan 10, 2021</td>
                <td>
                  <button className="action-btn action-edit"><i className="fas fa-edit"></i></button>
                </td>
              </tr>
              <tr>
                <td><strong>Dr. Farhan</strong></td>
                <td>farhan@sebahomeo.com</td>
                <td><span className="status-badge status-review">Author</span></td>
                <td>Active</td>
                <td>Feb 22, 2021</td>
                <td>
                  <button className="action-btn action-edit"><i className="fas fa-edit"></i></button>
                  <button className="action-btn action-delete"><i className="fas fa-ban"></i></button>
                </td>
              </tr>
              <tr>
                <td><strong>Guest User</strong></td>
                <td>guest@example.com</td>
                <td><span className="status-badge status-draft">Subscriber</span></td>
                <td>Inactive</td>
                <td>Mar 05, 2021</td>
                <td>
                  <button className="action-btn action-edit"><i className="fas fa-edit"></i></button>
                  <button className="action-btn action-delete"><i className="fas fa-ban"></i></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
