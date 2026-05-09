"use client";
import { useState, useEffect } from "react";

export default function SystemLogsWidget() {
  const [logs, setLogs] = useState([]);

  // Generate some realistic looking Supabase Edge Logs
  useEffect(() => {
    const methods = ["GET", "POST", "GET", "GET", "PATCH", "DELETE"];
    const endpoints = [
      "/rest/v1/profiles",
      "/auth/v1/user",
      "/auth/v1/admin/users",
      "/rest/v1/posts?select=*",
      "/rest/v1/medicines?id=eq.1",
      "/graphql/v1"
    ];

    const generateLog = (id) => {
      const now = new Date(Date.now() - id * 5000 - Math.random() * 10000);
      const method = methods[Math.floor(Math.random() * methods.length)];
      const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
      const status = Math.random() > 0.05 ? 200 : (Math.random() > 0.5 ? 201 : (Math.random() > 0.5 ? 401 : 500));
      const latency = Math.floor(Math.random() * 120) + 15; // 15ms to 135ms
      
      return {
        id: id,
        timestamp: now.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        method,
        status,
        endpoint,
        latency
      };
    };

    const initialLogs = Array.from({ length: 12 }, (_, i) => generateLog(i));
    setLogs(initialLogs);

    // Simulate incoming logs
    const interval = setInterval(() => {
      setLogs(prev => {
        const newLog = generateLog(Math.random() * 1000);
        return [newLog, ...prev].slice(0, 12);
      });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="status-dashboard">
      <div className="status-metrics">
        <div className="metric-card">
          <div className="metric-header">API Requests (24h)</div>
          <div className="metric-value">124.5k</div>
          <div className="metric-trend positive"><i className="fas fa-arrow-up"></i> 12% vs last day</div>
        </div>
        <div className="metric-card">
          <div className="metric-header">Avg. Latency</div>
          <div className="metric-value">42ms</div>
          <div className="metric-trend positive"><i className="fas fa-arrow-down"></i> 3ms faster</div>
        </div>
        <div className="metric-card">
          <div className="metric-header">Error Rate (5xx)</div>
          <div className="metric-value">0.02%</div>
          <div className="metric-trend stable"><i className="fas fa-minus"></i> Stable</div>
        </div>
        <div className="metric-card">
          <div className="metric-header">Database Load</div>
          <div className="metric-value">14%</div>
          <div className="metric-trend positive"><i className="fas fa-arrow-down"></i> Normal</div>
        </div>
      </div>

      <div className="dashboard-panel logs-panel">
        <div className="panel-header" style={{ borderBottom: '1px solid #333' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-terminal"></i> Live Edge Logs
          </h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <span className="live-indicator"><span className="dot"></span> Live</span>
          </div>
        </div>
        
        {/* Mock Chart Area */}
        <div className="chart-area">
          <div className="chart-placeholder">
            {Array.from({ length: 40 }).map((_, i) => {
              const height = Math.random() * 60 + 10;
              const isError = Math.random() > 0.95;
              return (
                <div 
                  key={i} 
                  className="chart-bar" 
                  style={{ 
                    height: `${height}%`, 
                    backgroundColor: isError ? '#e74c3c' : '#2ecc71',
                    opacity: 0.8
                  }}
                />
              );
            })}
          </div>
          <div className="chart-labels">
            <span>1 Hour Ago</span>
            <span>Now</span>
          </div>
        </div>

        <div className="panel-body" style={{ padding: 0, background: '#141414' }}>
          <table className="logs-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Status</th>
                <th>Method</th>
                <th>Endpoint</th>
                <th style={{ textAlign: 'right' }}>Latency</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ color: '#888' }}>{log.timestamp}</td>
                  <td>
                    <span className={`status-badge-sm ${log.status === 200 || log.status === 201 ? 'success' : (log.status === 401 ? 'warning' : 'error')}`}>
                      {log.status}
                    </span>
                  </td>
                  <td style={{ color: log.method === 'GET' ? '#3498db' : (log.method === 'POST' ? '#f39c12' : (log.method === 'PATCH' ? '#9b59b6' : '#e74c3c')), fontWeight: 'bold' }}>
                    {log.method}
                  </td>
                  <td style={{ color: '#e0e0e0', fontFamily: 'monospace' }}>{log.endpoint}</td>
                  <td style={{ color: '#888', textAlign: 'right', fontFamily: 'monospace' }}>{log.latency}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .status-dashboard {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        
        /* Metrics */
        .status-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }
        .metric-card {
          background: #fff;
          border-radius: var(--radius);
          padding: 20px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
          border: 1px solid #eee;
        }
        .metric-header {
          font-size: 13px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }
        .metric-value {
          font-size: 2rem;
          font-weight: 700;
          color: #111;
          margin-bottom: 8px;
        }
        .metric-trend {
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .metric-trend.positive { color: #2ecc71; }
        .metric-trend.negative { color: #e74c3c; }
        .metric-trend.stable { color: #95a5a6; }

        /* Logs Panel */
        .logs-panel {
          background: #141414;
          color: #fff;
          border-radius: var(--radius);
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          border: 1px solid #333;
          overflow: hidden;
        }
        .logs-panel .panel-header {
          background: #1c1c1c;
          padding: 16px 24px;
        }
        .logs-panel .panel-header h2 {
          color: #fff;
          font-size: 1.1rem;
          margin: 0;
        }
        
        /* Live Indicator */
        .live-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #2ecc71;
          font-weight: 600;
          text-transform: uppercase;
          background: rgba(46, 204, 113, 0.1);
          padding: 4px 10px;
          border-radius: 12px;
          border: 1px solid rgba(46, 204, 113, 0.2);
        }
        .live-indicator .dot {
          width: 8px;
          height: 8px;
          background: #2ecc71;
          border-radius: 50%;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.7); }
          70% { box-shadow: 0 0 0 6px rgba(46, 204, 113, 0); }
          100% { box-shadow: 0 0 0 0 rgba(46, 204, 113, 0); }
        }

        /* Mock Chart */
        .chart-area {
          background: #1a1a1a;
          padding: 24px;
          border-bottom: 1px solid #333;
        }
        .chart-placeholder {
          height: 80px;
          display: flex;
          align-items: flex-end;
          gap: 4px;
          margin-bottom: 10px;
        }
        .chart-bar {
          flex: 1;
          border-radius: 2px 2px 0 0;
          min-width: 4px;
          transition: height 0.5s ease;
        }
        .chart-labels {
          display: flex;
          justify-content: space-between;
          color: #666;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        /* Table */
        .logs-table {
          width: 100%;
          border-collapse: collapse;
          font-family: 'JetBrains Mono', 'Consolas', 'Monaco', monospace;
          font-size: 13px;
        }
        .logs-table th {
          text-align: left;
          padding: 12px 24px;
          color: #888;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 1px;
          border-bottom: 1px solid #2a2a2a;
          background: #171717;
        }
        .logs-table td {
          padding: 12px 24px;
          border-bottom: 1px solid #222;
        }
        .logs-table tr:hover {
          background: #1f1f1f;
        }
        .logs-table tr:last-child td {
          border-bottom: none;
        }
        
        .status-badge-sm {
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: bold;
        }
        .status-badge-sm.success { background: rgba(46, 204, 113, 0.15); color: #2ecc71; }
        .status-badge-sm.warning { background: rgba(243, 156, 18, 0.15); color: #f39c12; }
        .status-badge-sm.error { background: rgba(231, 76, 60, 0.15); color: #e74c3c; }
      `}</style>
    </div>
  );
}
