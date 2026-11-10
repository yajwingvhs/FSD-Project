import { useState, useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  NavLink,
  Navigate,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Configure Axios instance to send session cookies with every request
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
});

const CATEGORIES = [
  'Programming',
  'Web Development',
  'Design',
  'Data Science',
  'Languages',
  'Music & Arts',
  'Writing',
  'Other',
];

const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

// ==========================================
// REUSABLE COMPONENTS (Navbar, Footer, SkillCard, Modal)
// ==========================================

function Navbar({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogoutClick = async () => {
    setMenuOpen(false);
    await onLogout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand-logo" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark">SS</span>
          <span>SkillSwap</span>
        </Link>

        <button
          type="button"
          className="mobile-menu-btn"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? 'Close' : 'Menu'}
        </button>

        <nav className={`nav-links ${menuOpen ? 'open' : ''}`}>
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            Home
          </NavLink>
          <NavLink
            to="/explore"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            Explore Skills
          </NavLink>

          {user ? (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/add-skill"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                Add Skill
              </NavLink>
              <NavLink
                to="/requests"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                My Requests
              </NavLink>
              <NavLink
                to="/profile"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                Profile
              </NavLink>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleLogoutClick}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                Login
              </NavLink>
              <Link
                to="/register"
                className="btn btn-primary btn-sm"
                onClick={() => setMenuOpen(false)}
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div>
          <strong>SkillSwap</strong> — Student Skill Exchange Platform
        </div>
        <div>Built for peer-to-peer student learning</div>
      </div>
    </footer>
  );
}

function SkillCard({
  skill,
  currentUser,
  onRequestClick,
  showManageActions = false,
  onEdit,
  onDelete,
}) {
  const ownerId = skill.userId?._id || skill.userId;
  const isOwner = currentUser && String(ownerId) === String(currentUser._id);

  return (
    <div className="card skill-card">
      <div>
        <div className="skill-card-top">
          <h3>{skill.skillName}</h3>
        </div>

        <div className="badge-row">
          <span className="badge badge-primary">{skill.category}</span>
          <span className="badge badge-level">{skill.experienceLevel}</span>
        </div>

        <p className="skill-desc">{skill.description}</p>
      </div>

      <div className="skill-card-footer">
        <div className="student-meta">
          <div className="student-name">{skill.userId?.name || 'Student'}</div>
          {skill.userId?.college && (
            <div className="student-college">
              {skill.userId.department} • {skill.userId.college}
            </div>
          )}
        </div>

        {showManageActions ? (
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => onEdit(skill)}
            >
              Edit
            </button>
            <button
              type="button"
              className="btn btn-danger-outline btn-sm"
              onClick={() => onDelete(skill._id)}
            >
              Delete
            </button>
          </div>
        ) : isOwner ? (
          <span className="badge badge-accepted">Your Skill</span>
        ) : (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => onRequestClick(skill)}
          >
            Request Exchange
          </button>
        )}
      </div>
    </div>
  );
}

function RequestModal({ skill, user, onClose }) {
  const [mySkills, setMySkills] = useState([]);
  const [offeredSkill, setOfferedSkill] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    // Load the logged-in student's own skills to suggest as offered skills
    const fetchMySkills = async () => {
      try {
        const res = await api.get('/skills?mine=true');
        const list = res.data.skills || [];
        setMySkills(list);
        if (list.length > 0) {
          setOfferedSkill(list[0].skillName);
        }
      } catch (err) {
        console.error('Could not load your skills:', err);
      }
    };
    if (user) {
      fetchMySkills();
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!offeredSkill.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter the skill you want to offer.' });
      return;
    }

    setLoading(true);
    setStatusMessage({ type: '', text: '' });

    try {
      const res = await api.post('/requests', {
        receiverId: skill.userId._id,
        offeredSkill: offeredSkill.trim(),
        requestedSkill: skill.skillName,
      });
      setStatusMessage({ type: 'success', text: res.data.message });
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to send request.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Request Skill Exchange</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <p className="form-subtitle">
          Requesting <strong>{skill.skillName}</strong> from{' '}
          <strong>{skill.userId?.name}</strong>
        </p>

        {statusMessage.text && (
          <div className={`alert alert-${statusMessage.type}`}>{statusMessage.text}</div>
        )}

        <form onSubmit={handleSubmit}>
          {mySkills.length > 0 && (
            <div className="form-group">
              <label htmlFor="quickPickSkill">Pick one of your added skills</label>
              <select
                id="quickPickSkill"
                className="form-control"
                value={mySkills.some((s) => s.skillName === offeredSkill) ? offeredSkill : ''}
                onChange={(e) => setOfferedSkill(e.target.value)}
              >
                <option value="">-- Select a skill or type below --</option>
                {mySkills.map((s) => (
                  <option key={s._id} value={s.skillName}>
                    {s.skillName} ({s.experienceLevel})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="offeredSkillInput">Skill You Will Teach in Exchange</label>
            <input
              id="offeredSkillInput"
              type="text"
              className="form-control"
              placeholder="e.g., Python, Photoshop, Public Speaking"
              value={offeredSkill}
              onChange={(e) => setOfferedSkill(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Skill You Want to Learn</label>
            <input
              type="text"
              className="form-control"
              value={skill.skillName}
              disabled
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Sending...' : 'Send Request'}
            </button>
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// PAGES
// ==========================================

function HomePage({ user, onRequestClick }) {
  const [featuredSkills, setFeaturedSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        // Demonstrates query parameter limiting records (?limit=3)
        const res = await api.get('/skills?limit=3');
        setFeaturedSkills(res.data.skills || []);
      } catch (err) {
        console.error('Error loading featured skills:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container hero-content">
          <span className="hero-tag">Peer-to-Peer Student Learning</span>
          <h1>Share Your Skills. Discover New Possibilities.</h1>
          <p>
            SkillSwap helps college students trade knowledge directly with one another.
            Teach what you know—like Python or Guitar—and learn what you need—like
            Photoshop or Web Design—from fellow students.
          </p>
          <div className="hero-actions">
            <Link to={user ? '/dashboard' : '/register'} className="btn btn-primary">
              Get Started
            </Link>
            <Link to="/explore" className="btn btn-outline">
              Explore Skills
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="home-block">
        <div className="container">
          <div className="home-block-header">
            <h2>How It Works</h2>
          </div>

          <div className="grid-3">
            <div className="card step-card">
              <div className="step-number">1</div>
              <h3>Create Your Profile</h3>
              <p>
                Register with your college details and list the skills you are confident
                teaching to other students.
              </p>
            </div>
            <div className="card step-card">
              <div className="step-number">2</div>
              <h3>Explore Student Skills</h3>
              <p>
                Search by keyword, filter by category, and discover classmates offering the
                skills you want to learn.
              </p>
            </div>
            <div className="card step-card">
              <div className="step-number">3</div>
              <h3>Send & Accept Requests</h3>
              <p>
                Propose a skill swap, manage incoming requests, and start learning
                together once accepted.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Skills Section */}
      <section className="home-block" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="home-block-header">
            <h2>Featured Skills</h2>
            <Link to="/explore" className="btn btn-outline btn-sm">
              View All Skills
            </Link>
          </div>

          {loading ? (
            <div className="card">Loading featured skills...</div>
          ) : featuredSkills.length === 0 ? (
            <div className="empty-state">
              <h3>No skills added yet</h3>
              <p>Be the first student to add a skill to the platform!</p>
              <div style={{ marginTop: '14px' }}>
                <Link to={user ? '/add-skill' : '/register'} className="btn btn-primary btn-sm">
                  Add a Skill
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid-3">
              {featuredSkills.map((skill) => (
                <SkillCard
                  key={skill._id}
                  skill={skill}
                  currentUser={user}
                  onRequestClick={onRequestClick}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function RegisterPage({ user }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
    college: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/register', formData);
      navigate('/login', {
        state: { success: 'Registration successful! Please login with your credentials.' },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="auth-container">
        <div className="form-card">
          <h1>Create Student Account</h1>
          <p className="form-subtitle">Join SkillSwap and start exchanging skills</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                className="form-control"
                placeholder="e.g., Rahul Sharma"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-control"
                placeholder="e.g., rahul@college.edu"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                className="form-control"
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="department">Department</label>
              <input
                id="department"
                name="department"
                type="text"
                className="form-control"
                placeholder="e.g., Computer Science"
                value={formData.department}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="college">College Name</label>
              <input
                id="college"
                name="college"
                type="text"
                className="form-control"
                placeholder="e.g., ABC Engineering College"
                value={formData.college}
                onChange={handleChange}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </form>

          <div className="form-footer-link">
            Already have an account? <Link to="/login">Login here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginPage({ user, onLoginSuccess }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const successMessage = location.state?.success || '';
  const infoMessage = location.state?.info || '';

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/login', { email, password });
      onLoginSuccess(res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="auth-container">
        <div className="form-card">
          <h1>Welcome Back</h1>
          <p className="form-subtitle">Login to access your SkillSwap dashboard</p>

          {successMessage && <div className="alert alert-success">{successMessage}</div>}
          {infoMessage && <div className="alert alert-info">{infoMessage}</div>}
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="loginEmail">Email Address</label>
              <input
                id="loginEmail"
                type="email"
                className="form-control"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="loginPassword">Password</label>
              <input
                id="loginPassword"
                type="password"
                className="form-control"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="form-footer-link">
            New to SkillSwap? <Link to="/register">Register here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardPage({ user }) {
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

function AddSkillPage({ user }) {
  const [formData, setFormData] = useState({
    skillName: '',
    category: 'Programming',
    description: '',
    experienceLevel: 'Intermediate',
  });
  const [mySkills, setMySkills] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const loadMySkills = async () => {
    try {
      const res = await api.get('/skills?mine=true');
      setMySkills(res.data.skills || []);
    } catch (err) {
      console.error('Failed to fetch my skills:', err);
    }
  };

  useEffect(() => {
    let ignore = false;
    const initSkills = async () => {
      try {
        const res = await api.get('/skills?mine=true');
        if (!ignore) {
          setMySkills(res.data.skills || []);
        }
      } catch (err) {
        console.error('Failed to fetch my skills:', err);
      }
    };
    initSkills();
    return () => {
      ignore = true;
    };
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      skillName: '',
      category: 'Programming',
      description: '',
      experienceLevel: 'Intermediate',
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setLoading(true);

    try {
      if (editingId) {
        const res = await api.put(`/skills/${editingId}`, formData);
        setMessage({ type: 'success', text: res.data.message });
      } else {
        const res = await api.post('/skills', formData);
        setMessage({ type: 'success', text: res.data.message });
      }
      resetForm();
      await loadMySkills();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to save skill.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (skill) => {
    setEditingId(skill._id);
    setFormData({
      skillName: skill.skillName,
      category: skill.category,
      description: skill.description,
      experienceLevel: skill.experienceLevel,
    });
    setMessage({ type: '', text: '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (skillId) => {
    try {
      const res = await api.delete(`/skills/${skillId}`);
      setMessage({ type: 'success', text: res.data.message });
      if (editingId === skillId) {
        resetForm();
      }
      await loadMySkills();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to delete skill.',
      });
    }
  };

  return (
    <section className="page-section">
      <div className="container">
        <div className="section-header">
          <h1>{editingId ? 'Edit Your Skill' : 'Add a New Skill'}</h1>
          <p>Share a skill you know so other students can request a skill exchange.</p>
        </div>

        <div className="form-card" style={{ maxWidth: '640px', marginBottom: '40px' }}>
          {message.text && (
            <div className={`alert alert-${message.type}`}>{message.text}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="skillName">Skill Name</label>
              <input
                id="skillName"
                name="skillName"
                type="text"
                className="form-control"
                placeholder="e.g., Python Programming, Adobe Photoshop"
                value={formData.skillName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  className="form-control"
                  value={formData.category}
                  onChange={handleChange}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="experienceLevel">Experience Level</label>
                <select
                  id="experienceLevel"
                  name="experienceLevel"
                  className="form-control"
                  value={formData.experienceLevel}
                  onChange={handleChange}
                >
                  {EXPERIENCE_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                className="form-control"
                placeholder="Briefly describe what you can teach (topics, tools, project examples)..."
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading
                  ? 'Saving...'
                  : editingId
                  ? 'Update Skill'
                  : 'Add Skill'}
              </button>
              {editingId && (
                <button type="button" className="btn btn-outline" onClick={resetForm}>
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>

        {/* User's Existing Skills List */}
        <div className="home-block-header">
          <h2>My Offered Skills ({mySkills.length})</h2>
        </div>

        {mySkills.length === 0 ? (
          <div className="empty-state">
            <h3>You haven't added any skills yet</h3>
            <p>Use the form above to add your first skill.</p>
          </div>
        ) : (
          <div className="grid-3">
            {mySkills.map((skill) => (
              <SkillCard
                key={skill._id}
                skill={skill}
                currentUser={user}
                showManageActions
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ExploreSkillsPage({ user, onRequestClick }) {
  const [skills, setSkills] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/skills', {
          params: { search, category, sort },
        });
        setSkills(res.data.skills || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load skills.');
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [search, category, sort]);

  return (
    <section className="page-section">
      <div className="container">
        <div className="section-header">
          <h1>Explore Student Skills</h1>
          <p>Search, filter by category, and send exchange requests to fellow students.</p>
        </div>

        <div className="filter-bar">
          <input
            type="text"
            className="form-control"
            placeholder="Search skills (e.g., Python, Photoshop, Guitar)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="form-control"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            className="form-control"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="newest">Sort: Newest First</option>
            <option value="az">Sort: Name (A - Z)</option>
            <option value="za">Sort: Name (Z - A)</option>
          </select>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="card">Loading skills...</div>
        ) : skills.length === 0 ? (
          <div className="empty-state">
            <h3>No matching skills found</h3>
            <p>Try clearing your search or choosing another category.</p>
          </div>
        ) : (
          <div className="grid-3">
            {skills.map((skill) => (
              <SkillCard
                key={skill._id}
                skill={skill}
                currentUser={user}
                onRequestClick={onRequestClick}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function RequestsPage({ user }) {
  const [requests, setRequests] = useState([]);
  const [directionFilter, setDirectionFilter] = useState('all'); // all | received | sent
  const [statusFilter, setStatusFilter] = useState('All'); // All | Pending | Accepted | Rejected
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchRequests = async () => {
    try {
      const res = await api.get('/requests');
      setRequests(res.data.requests || []);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to load requests.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const initRequests = async () => {
      try {
        const res = await api.get('/requests');
        if (!ignore) {
          setRequests(res.data.requests || []);
        }
      } catch (err) {
        if (!ignore) {
          setMessage({
            type: 'error',
            text: err.response?.data?.message || 'Failed to load requests.',
          });
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };
    initRequests();
    return () => {
      ignore = true;
    };
  }, []);

  const handleStatusUpdate = async (requestId, newStatus) => {
    setMessage({ type: '', text: '' });
    try {
      const res = await api.put(`/requests/${requestId}`, { status: newStatus });
      setMessage({ type: 'success', text: res.data.message });
      await fetchRequests();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Could not update request.',
      });
    }
  };

  const filteredRequests = requests.filter((reqItem) => {
    const isSent = reqItem.senderId?._id === user._id;
    const isReceived = reqItem.receiverId?._id === user._id;

    if (directionFilter === 'sent' && !isSent) return false;
    if (directionFilter === 'received' && !isReceived) return false;
    if (statusFilter !== 'All' && reqItem.status !== statusFilter) return false;
    return true;
  });

  const getStatusBadgeClass = (status) => {
    if (status === 'Accepted') return 'badge-accepted';
    if (status === 'Rejected') return 'badge-rejected';
    return 'badge-pending';
  };

  return (
    <section className="page-section">
      <div className="container">
        <div className="section-header">
          <h1>My Exchange Requests</h1>
          <p>View sent and received requests, and accept or reject incoming skill swaps.</p>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type}`}>{message.text}</div>
        )}

        <div className="tabs-row">
          <div className="tab-group">
            <button
              type="button"
              className={`tab-btn ${directionFilter === 'all' ? 'active' : ''}`}
              onClick={() => setDirectionFilter('all')}
            >
              All ({requests.length})
            </button>
            <button
              type="button"
              className={`tab-btn ${directionFilter === 'received' ? 'active' : ''}`}
              onClick={() => setDirectionFilter('received')}
            >
              Received (
              {requests.filter((r) => r.receiverId?._id === user._id).length})
            </button>
            <button
              type="button"
              className={`tab-btn ${directionFilter === 'sent' ? 'active' : ''}`}
              onClick={() => setDirectionFilter('sent')}
            >
              Sent ({requests.filter((r) => r.senderId?._id === user._id).length})
            </button>
          </div>

          <div className="tab-group">
            {['All', 'Pending', 'Accepted', 'Rejected'].map((st) => (
              <button
                key={st}
                type="button"
                className={`tab-btn ${statusFilter === st ? 'active' : ''}`}
                onClick={() => setStatusFilter(st)}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="card">Loading requests...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="empty-state">
            <h3>No requests match this filter</h3>
            <p>Explore skills from other students to start a skill exchange.</p>
          </div>
        ) : (
          <div className="requests-list">
            {filteredRequests.map((reqItem) => {
              const isIncoming = reqItem.receiverId?._id === user._id;
              const otherStudent = isIncoming ? reqItem.senderId : reqItem.receiverId;

              return (
                <div key={reqItem._id} className="card request-card">
                  <div className="request-info">
                    <div className="badge-row">
                      <span className="badge badge-primary">
                        {isIncoming ? 'Received Request' : 'Sent Request'}
                      </span>
                      <span className={`badge ${getStatusBadgeClass(reqItem.status)}`}>
                        {reqItem.status}
                      </span>
                    </div>

                    <h3>
                      {isIncoming
                        ? `${otherStudent?.name} wants to learn ${reqItem.requestedSkill} and offers ${reqItem.offeredSkill}`
                        : `You offered ${reqItem.offeredSkill} to learn ${reqItem.requestedSkill} from ${otherStudent?.name}`}
                    </h3>

                    <p className="request-meta">
                      {otherStudent?.department} • {otherStudent?.college}
                      {reqItem.status === 'Accepted' && otherStudent?.email
                        ? ` • Contact: ${otherStudent.email}`
                        : ''}
                    </p>
                  </div>

                  {isIncoming && reqItem.status === 'Pending' && (
                    <div className="request-actions">
                      <button
                        type="button"
                        className="btn btn-accent btn-sm"
                        onClick={() => handleStatusUpdate(reqItem._id, 'Accepted')}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger-outline btn-sm"
                        onClick={() => handleStatusUpdate(reqItem._id, 'Rejected')}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function ProfilePage({ user, onProfileUpdate }) {
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

// ==========================================
// MAIN APP ROUTER & SESSION STATE
// ==========================================

function AppContent() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const navigate = useNavigate();

  // Check if the student already has an active session cookie
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await api.get('/me');
        setUser(res.data.user || null);
      } catch {
        setUser(null);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkSession();
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
    }
  };

  const handleRequestClick = (skill) => {
    if (!user) {
      navigate('/login', {
        state: { info: 'Please login first to send a skill exchange request.' },
      });
      return;
    }
    setSelectedSkill(skill);
  };

  if (checkingAuth) {
    return (
      <div className="app-wrapper">
        <div className="container page-section">
          <div className="card">Loading SkillSwap...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      <Navbar user={user} onLogout={handleLogout} />

      <main className="main-content">
        <Routes>
          <Route
            path="/"
            element={<HomePage user={user} onRequestClick={handleRequestClick} />}
          />
          <Route path="/register" element={<RegisterPage user={user} />} />
          <Route
            path="/login"
            element={<LoginPage user={user} onLoginSuccess={setUser} />}
          />
          <Route
            path="/explore"
            element={
              <ExploreSkillsPage user={user} onRequestClick={handleRequestClick} />
            }
          />
          <Route
            path="/dashboard"
            element={user ? <DashboardPage user={user} /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/add-skill"
            element={user ? <AddSkillPage user={user} /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/requests"
            element={user ? <RequestsPage user={user} /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/profile"
            element={
              user ? (
                <ProfilePage user={user} onProfileUpdate={setUser} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />

      {selectedSkill && (
        <RequestModal
          skill={selectedSkill}
          user={user}
          onClose={() => setSelectedSkill(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
