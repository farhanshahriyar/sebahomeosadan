export default function DashboardOverview() {
  return (
    <>
      <div className="dashboard-header">
        <div>
          <h1>Dashboard Overview</h1>
          <div className="breadcrumb">
            <a href="/dashboard">Dashboard</a> / Overview
          </div>
        </div>
        <button className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '14px' }}>
          <i className="fas fa-plus"></i> New Post
        </button>
      </div>

      <div className="stat-cards">
        <div className="stat-card primary">
          <div className="stat-icon">
            <i className="fas fa-file-alt"></i>
          </div>
          <div className="stat-info">
            <h3>45</h3>
            <p>Total Posts</p>
          </div>
        </div>
        
        <div className="stat-card accent">
          <div className="stat-icon">
            <i className="fas fa-pills"></i>
          </div>
          <div className="stat-info">
            <h3>128</h3>
            <p>Medicines Listed</p>
          </div>
        </div>
        
        <div className="stat-card info">
          <div className="stat-icon">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-info">
            <h3>12</h3>
            <p>Authors</p>
          </div>
        </div>
        
        <div className="stat-card danger">
          <div className="stat-icon">
            <i className="fas fa-eye"></i>
          </div>
          <div className="stat-info">
            <h3>8.5k</h3>
            <p>Monthly Views</p>
          </div>
        </div>
      </div>

      <div className="dashboard-panel">
        <div className="panel-header">
          <h2>Recent Activity</h2>
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Category</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>একোনাইটাম নেপেলাস</strong></td>
                <td>Dr. Amirul Islam</td>
                <td>ওষুধ পরিচিতি</td>
                <td><span className="status-badge status-published">Published</span></td>
                <td>May 14, 2021</td>
                <td>
                  <button className="action-btn action-view"><i className="fas fa-eye"></i></button>
                  <button className="action-btn action-edit"><i className="fas fa-edit"></i></button>
                </td>
              </tr>
              <tr>
                <td><strong>দেহতন্ত্রের প্রাথমিক জ্ঞান</strong></td>
                <td>Admin</td>
                <td>এনাটমি</td>
                <td><span className="status-badge status-published">Published</span></td>
                <td>May 22, 2021</td>
                <td>
                  <button className="action-btn action-view"><i className="fas fa-eye"></i></button>
                  <button className="action-btn action-edit"><i className="fas fa-edit"></i></button>
                </td>
              </tr>
              <tr>
                <td><strong>নতুন আর্টিকেলের খসড়া</strong></td>
                <td>Guest Author</td>
                <td>স্বাস্থ্য কথা</td>
                <td><span className="status-badge status-draft">Draft</span></td>
                <td>Today, 10:30 AM</td>
                <td>
                  <button className="action-btn action-view"><i className="fas fa-eye"></i></button>
                  <button className="action-btn action-edit"><i className="fas fa-edit"></i></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
