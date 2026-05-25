import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

function formatDate(dateString) {
  if (!dateString) return "—";
  const d = new Date(dateString);
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  return d.toLocaleDateString("bn-BD", options);
}

export default async function DashboardOverview() {
  const supabase = await createClient();

  // 1. Fetch Total Articles
  const { count: totalArticles, error: countError } = await supabase
    .from("articles")
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.error("Error fetching total articles count:", countError);
  }

  // 2. Fetch Total Views (Sum of views)
  const { data: viewsData, error: viewsError } = await supabase
    .from("articles")
    .select("views");

  if (viewsError) {
    console.error("Error fetching views data:", viewsError);
  }
  const totalViews = viewsData?.reduce((sum, item) => sum + (item.views || 0), 0) || 0;

  // 3. Fetch Active Authors count
  const { count: totalAuthors, error: authorsError } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "author");

  if (authorsError) {
    console.error("Error fetching authors count:", authorsError);
  }

  // 4. Fetch Recent Articles
  const { data: recentArticles, error: recentError } = await supabase
    .from("articles")
    .select("*, categories(name)")
    .order("updated_at", { ascending: false })
    .limit(5);

  if (recentError) {
    console.error("Error fetching recent articles:", recentError);
  }

  // Static medicines list count matches the 17 listed in public medicines list
  const medicinesCount = 17;

  // Status mapping
  const statusLabel = {
    published: { text: "Published", class: "status-published" },
    draft: { text: "Draft", class: "status-draft" },
    review: { text: "In Review", class: "status-review" },
  };

  return (
    <>
      <div className="dashboard-header">
        <div>
          <h1>Dashboard Overview</h1>
          <div className="breadcrumb">
            <a href="/dashboard">Dashboard</a> / Overview
          </div>
        </div>
        <Link href="/dashboard/author" className="btn btn-primary btn-compact" style={{ textDecoration: 'none' }}>
          <i className="fas fa-plus"></i> New Post
        </Link>
      </div>

      <div className="stat-cards">
        <div className="stat-card primary">
          <div className="stat-icon">
            <i className="fas fa-file-alt"></i>
          </div>
          <div className="stat-info">
            <h3>{totalArticles || 0}</h3>
            <p>Total Posts</p>
          </div>
        </div>
        
        <div className="stat-card accent">
          <div className="stat-icon">
            <i className="fas fa-pills"></i>
          </div>
          <div className="stat-info">
            <h3>{medicinesCount}</h3>
            <p>Medicines Listed</p>
          </div>
        </div>
        
        <div className="stat-card info">
          <div className="stat-icon">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-info">
            <h3>{totalAuthors || 0}</h3>
            <p>Authors</p>
          </div>
        </div>
        
        <div className="stat-card danger">
          <div className="stat-icon">
            <i className="fas fa-eye"></i>
          </div>
          <div className="stat-info">
            <h3>{totalViews.toLocaleString("bn-BD")}</h3>
            <p>Total Views</p>
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
              {recentArticles && recentArticles.length > 0 ? (
                recentArticles.map((article) => (
                  <tr key={article.id}>
                    <td><strong>{article.title}</strong></td>
                    <td>{article.author_name || "Unknown"}</td>
                    <td>{article.categories?.name || "—"}</td>
                    <td>
                      <span className={`status-badge ${statusLabel[article.status]?.class || ""}`}>
                        {statusLabel[article.status]?.text || article.status}
                      </span>
                    </td>
                    <td>{formatDate(article.updated_at)}</td>
                    <td>
                      {article.status === "published" && (
                        <a 
                          href={`/articles/${article.slug}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="action-btn action-view"
                          title="View on site"
                          style={{ marginRight: '6px' }}
                        >
                          <i className="fas fa-eye"></i>
                        </a>
                      )}
                      <Link 
                        href="/dashboard/author" 
                        className="action-btn action-edit"
                        title="Edit in Author Panel"
                      >
                        <i className="fas fa-edit"></i>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "30px", color: "#999" }}>
                    No recent activity found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
