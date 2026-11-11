import { useState, useEffect } from 'react';
import { api } from '../api';

export default function ProfilePage({ user, onProfileUpdate }) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    department: user.department || '',
    college: user.college || '',
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/profile');
        if (res.data.user) {
          setFormData({
            name: res.data.user.name,
            email: res.data.user.email,
            department: res.data.user.department,
            college: res.data.user.college,
          });
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setLoading(true);

    try {
      const res = await api.put('/profile', formData);
      onProfileUpdate(res.data.user);
      setMessage({ type: 'success', text: res.data.message });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update profile.',
      });
    } finally {
      setLoading(false);
    }
  };

  const initials = (user.name || 'S')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <section className="page-section">
      <div className="container">
        <div className="section-header">
          <h1>Student Profile</h1>
          <p>View and update your personal details.</p>
        </div>

        <div className="profile-layout">
          <div className="card">
            <div className="profile-avatar">{initials}</div>
            <h2>{user.name}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
              {user.department}
            </p>

            <div className="profile-detail-item">
              <div className="profile-detail-label">Email</div>
              <div className="profile-detail-value">{user.email}</div>
            </div>
            <div className="profile-detail-item">
              <div className="profile-detail-label">Department</div>
              <div className="profile-detail-value">{user.department}</div>
            </div>
            <div className="profile-detail-item">
              <div className="profile-detail-label">College</div>
              <div className="profile-detail-value">{user.college}</div>
            </div>
          </div>

          <div className="form-card">
            <h2>Edit Profile</h2>
            <p className="form-subtitle">Keep your academic details up to date</p>

            {message.text && (
              <div className={`alert alert-${message.type}`}>{message.text}</div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="profileName">Full Name</label>
                <input
                  id="profileName"
                  name="name"
                  type="text"
                  className="form-control"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="profileEmail">Email Address</label>
                <input
                  id="profileEmail"
                  name="email"
                  type="email"
                  className="form-control"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="profileDepartment">Department</label>
                <input
                  id="profileDepartment"
                  name="department"
                  type="text"
                  className="form-control"
                  value={formData.department}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="profileCollege">College Name</label>
                <input
                  id="profileCollege"
                  name="college"
                  type="text"
                  className="form-control"
                  value={formData.college}
                  onChange={handleChange}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving Changes...' : 'Save Profile'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

