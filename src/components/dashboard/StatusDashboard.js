"use client";
import { useState, useEffect, useCallback } from "react";
import { fetchSystemStatus } from "@/app/dashboard/status/actions";
import SystemLogsWidget from "./SystemLogsWidget";

export default function StatusDashboard({ initialData }) {
  const [data, setData] = useState(initialData);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const newData = await fetchSystemStatus();
      setData(newData);
      setLastRefresh(new Date());
    } catch {
      // silent fail
    }
    setRefreshing(false);
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  if (data?.error) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#e74c3c" }}>
        <i className="fas fa-exclamation-triangle" style={{ fontSize: 40, marginBottom: 16 }}></i>
        <h2>Configuration Error</h2>
        <p>{data.error}</p>
      </div>
    );
  }

  const { database, auth, users, activity } = data;

  const getStatusColor = (status) => {
    if (status === "Healthy") return "#2ecc71";
    if (status === "Error") return "#f39c12";
    return "#e74c3c";
  };

  const getStatusIcon = (status) => {
    if (status === "Healthy") return "fa-check-circle";
    if (status === "Error") return "fa-exclamation-circle";
    return "fa-times-circle";
  };

  return (
    <div className="status-dashboard">
      {/* Refresh Bar */}
      <div className="refresh-bar">
        <span style={{ fontSize: 13, color: "#888" }}>
          Last updated: {lastRefresh.toLocaleTimeString()} · Auto-refreshes every 30s
        </span>
        <button
          className="btn btn-primary"
          onClick={refresh}
          disabled={refreshing}
          style={{ padding: "6px 16px", fontSize: 13 }}
        >
          <i className={`fas fa-sync-alt ${refreshing ? "fa-spin" : ""}`}></i>
          {refreshing ? " Refreshing..." : " Refresh Now"}
        </button>
      </div>

      {/* Service Health Cards */}
      <div className="health-grid">
        <div className="health-card">
          <div className="health-icon" style={{ background: `${getStatusColor(database.status)}18`, color: getStatusColor(database.status) }}>
            <i className={`fas ${getStatusIcon(database.status)}`}></i>
          </div>
          <div className="health-details">
            <h3>Database (PostgreSQL)</h3>
            <div className="health-status" style={{ color: getStatusColor(database.status) }}>
              {database.status}
            </div>
          </div>
          <div className="health-latency">
            <span className="latency-value">{database.latency}ms</span>
            <span className="latency-label">Latency</span>
          </div>
        </div>

        <div className="health-card">
          <div className="health-icon" style={{ background: `${getStatusColor(auth.status)}18`, color: getStatusColor(auth.status) }}>
            <i className={`fas ${getStatusIcon(auth.status)}`}></i>
          </div>
          <div className="health-details">
            <h3>Auth Service</h3>
            <div className="health-status" style={{ color: getStatusColor(auth.status) }}>
              {auth.status}
            </div>
          </div>
          <div className="health-latency">
            <span className="latency-value">{auth.latency}ms</span>
            <span className="latency-label">Latency</span>
          </div>
        </div>

        <div className="health-card">
          <div className="health-icon" style={{ background: "#3498db18", color: "#3498db" }}>
            <i className="fas fa-database"></i>
          </div>
          <div className="health-details">
            <h3>Storage (Supabase)</h3>
            <div className="health-status" style={{ color: "#2ecc71" }}>
              Connected
            </div>
          </div>
          <div className="health-latency">
            <span className="latency-value">—</span>
            <span className="latency-label">Region: Auto</span>
          </div>
        </div>
      </div>

      {/* User Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon" style={{ background: "rgba(13,122,62,0.1)", color: "var(--primary)" }}>
            <i className="fas fa-users"></i>
          </div>
          <div>
            <div className="metric-value">{users.total}</div>
            <div className="metric-label">Total Users</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon" style={{ background: "rgba(231,76,60,0.1)", color: "#e74c3c" }}>
            <i className="fas fa-user-shield"></i>
          </div>
          <div>
            <div className="metric-value">{users.roleCounts.super_admin}</div>
            <div className="metric-label">Super Admins</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon" style={{ background: "rgba(52,152,219,0.1)", color: "#3498db" }}>
            <i className="fas fa-user-cog"></i>
          </div>
          <div>
            <div className="metric-value">{users.roleCounts.admin}</div>
            <div className="metric-label">Admins</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon" style={{ background: "rgba(243,156,18,0.1)", color: "#f39c12" }}>
            <i className="fas fa-pen-nib"></i>
          </div>
          <div>
            <div className="metric-value">{users.roleCounts.author}</div>
            <div className="metric-label">Authors</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon" style={{ background: "rgba(155,89,182,0.1)", color: "#9b59b6" }}>
            <i className="fas fa-user-plus"></i>
          </div>
          <div>
            <div className="metric-value">{users.recentSignups}</div>
            <div className="metric-label">New (7 days)</div>
          </div>
        </div>
      </div>

      {/* Recent Auth Activity */}
      <div className="dashboard-panel activity-panel">
        <div className="panel-header">
          <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <i className="fas fa-history"></i> Recent Auth Activity
          </h2>
          <span className="live-badge"><span className="live-dot"></span> Live</span>
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          <table className="dashboard-table activity-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Provider</th>
                <th>Last Sign-In</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {activity?.length > 0 ? (
                activity.map((u) => (
                  <tr key={u.id}>
                    <td><strong>{u.fullName}</strong></td>
                    <td style={{ fontSize: 13, color: "#666" }}>{u.email}</td>
                    <td>
                      <span className={`role-badge role-${u.role}`}>
                        {u.role === "super_admin" ? "Super Admin" : u.role === "admin" ? "Admin" : "Author"}
                      </span>
                    </td>
                    <td style={{ fontSize: 13 }}>
                      <i className={`fas ${u.provider === "email" ? "fa-envelope" : "fa-globe"}`} style={{ marginRight: 4 }}></i>
                      {u.provider}
                    </td>
                    <td style={{ fontSize: 13, color: "#444" }}>
                      {new Date(u.lastSignIn).toLocaleString("en-US", {
                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                      })}
                    </td>
                    <td style={{ fontSize: 13, color: "#888" }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: 30, color: "#888" }}>
                    No recent activity found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SystemLogsWidget showMetrics={false} />

      <style jsx>{`
        .status-dashboard {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Refresh Bar */
        .refresh-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        /* Health Grid */
        .health-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }
        .health-card {
          background: #fff;
          border-radius: var(--radius);
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
          border: 1px solid #eee;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .health-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.08);
        }
        .health-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          flex-shrink: 0;
        }
        .health-details {
          flex: 1;
        }
        .health-details h3 {
          font-size: 14px;
          font-weight: 600;
          color: #333;
          margin: 0 0 4px 0;
        }
        .health-status {
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .health-latency {
          text-align: right;
          flex-shrink: 0;
        }
        .latency-value {
          display: block;
          font-size: 1.3rem;
          font-weight: 700;
          color: #222;
        }
        .latency-label {
          font-size: 11px;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Metrics Grid */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 16px;
        }
        .metric-card {
          background: #fff;
          border-radius: var(--radius);
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.04);
          border: 1px solid #f0f0f0;
        }
        .metric-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          flex-shrink: 0;
        }
        .metric-value {
          font-size: 1.6rem;
          font-weight: 700;
          color: #111;
          line-height: 1;
          margin-bottom: 4px;
        }
        .metric-label {
          font-size: 12px;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Activity Panel */
        .activity-panel {
          background: #fff;
          border-radius: var(--radius);
          box-shadow: 0 4px 15px rgba(0,0,0,0.06);
          border: 1px solid #eee;
          overflow: hidden;
        }
        .activity-panel .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 24px;
          border-bottom: 1px solid #eee;
        }
        .activity-panel .panel-header h2 {
          margin: 0;
          font-size: 1.1rem;
          color: #222;
        }

        .live-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          color: #2ecc71;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: rgba(46, 204, 113, 0.08);
          padding: 4px 10px;
          border-radius: 12px;
          border: 1px solid rgba(46, 204, 113, 0.15);
        }
        .live-dot {
          width: 7px;
          height: 7px;
          background: #2ecc71;
          border-radius: 50%;
          animation: livePulse 1.5s infinite;
        }
        @keyframes livePulse {
          0% { box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.6); }
          70% { box-shadow: 0 0 0 5px rgba(46, 204, 113, 0); }
          100% { box-shadow: 0 0 0 0 rgba(46, 204, 113, 0); }
        }

        /* Role Badges */
        .role-badge {
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .role-super_admin {
          background: rgba(231, 76, 60, 0.1);
          color: #e74c3c;
        }
        .role-admin {
          background: rgba(52, 152, 219, 0.1);
          color: #3498db;
        }
        .role-author {
          background: rgba(243, 156, 18, 0.1);
          color: #f39c12;
        }
      `}</style>
    </div>
  );
}
