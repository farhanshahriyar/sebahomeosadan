export default function AuthorDashboard() {
  return (
    <>
      <div className="dashboard-header">
        <div>
          <h1>Author Dashboard</h1>
          <div className="breadcrumb">
            <a href="/dashboard">Dashboard</a> / Author Panel
          </div>
        </div>
        <button className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '14px' }}>
          <i className="fas fa-pen"></i> Write New Article
        </button>
      </div>

      <div className="stat-cards">
        <div className="stat-card primary">
          <div className="stat-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-info">
            <h3>14</h3>
            <p>Published Articles</p>
          </div>
        </div>
        
        <div className="stat-card accent">
          <div className="stat-icon">
            <i className="fas fa-file-signature"></i>
          </div>
          <div className="stat-info">
            <h3>3</h3>
            <p>Drafts</p>
          </div>
        </div>
        
        <div className="stat-card info">
          <div className="stat-icon">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-info">
            <h3>1</h3>
            <p>Pending Review</p>
          </div>
        </div>
      </div>

      <div className="dashboard-panel">
        <div className="panel-header">
          <h2>My Articles</h2>
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Views</th>
                <th>Last Modified</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>শিশুস্বাস্থ্য ও হোমিওপ্যাথি</strong></td>
                <td>স্বাস্থ্য কথা</td>
                <td><span className="status-badge status-review">In Review</span></td>
                <td>-</td>
                <td>Yesterday, 4:15 PM</td>
                <td>
                  <button className="action-btn action-edit"><i className="fas fa-edit"></i></button>
                  <button className="action-btn action-delete"><i className="fas fa-trash"></i></button>
                </td>
              </tr>
              <tr>
                <td><strong>মানসিক স্বাস্থ্য রক্ষায় করণীয়</strong></td>
                <td>স্বাস্থ্য কথা</td>
                <td><span className="status-badge status-draft">Draft</span></td>
                <td>-</td>
                <td>3 days ago</td>
                <td>
                  <button className="action-btn action-edit"><i className="fas fa-edit"></i></button>
                  <button className="action-btn action-delete"><i className="fas fa-trash"></i></button>
                </td>
              </tr>
              <tr>
                <td><strong>একোনাইটাম নেপেলাস</strong></td>
                <td>ওষুধ পরিচিতি</td>
                <td><span className="status-badge status-published">Published</span></td>
                <td>1,245</td>
                <td>May 14, 2021</td>
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
