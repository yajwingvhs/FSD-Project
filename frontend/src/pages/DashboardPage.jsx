import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function DashboardPage({ user }) {
  const [stats, setStats] = useState({
    totalSkills: 0,
    totalRequests: 0,
    acceptedRequests: 0,
    pendingRequests: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard');
        setStats(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard stats.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  return (
    <section className="page-section">
      <div className="container">
        <div className="dashboard-welcome">
          <div>
            <h1>Welcome, {user.name}!</h1>
            <p style={{ color: 'var(--text-muted)' }}>
              {user.department} • {user.college}
            </p>
          </div>
          <Link to="/profile" className="btn btn-outline btn-sm">
            Edit Profile
          </Link>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="card">Loading your dashboard statistics...</div>
        ) : (
          <div className="grid-3">
            <div className="card stat-card">
              <span className="stat-label">Total Skills Offered</span>
              <span className="stat-value">{stats.totalSkills}</span>
            </div>
            <div className="card stat-card">
              <span className="stat-label">Total Exchange Requests</span>
              <span className="stat-value">{stats.totalRequests}</span>
            </div>
            <div className="card stat-card">
              <span className="stat-label">Accepted Requests</span>
              <span className="stat-value accent">{stats.acceptedRequests}</span>
            </div>
          </div>
        )}

        <div className="card" style={{ marginTop: '24px' }}>
          <h2>Quick Actions</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '6px' }}>
            Manage your skills, discover what peers are teaching, or respond to incoming
            exchange requests ({stats.pendingRequests} pending).
          </p>
          <div className="quick-actions">
            <Link to="/add-skill" className="btn btn-primary">
              Add Skill
            </Link>
            <Link to="/explore" className="btn btn-outline">
              Explore Skills
            </Link>
            <Link to="/requests" className="btn btn-accent">
              My Requests
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

