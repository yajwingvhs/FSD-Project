import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { api } from './api';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import RequestModal from './components/RequestModal';
import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AddSkillPage from './pages/AddSkillPage';
import ExploreSkillsPage from './pages/ExploreSkillsPage';
import RequestsPage from './pages/RequestsPage';
import ProfilePage from './pages/ProfilePage';
import './App.css';

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
          <Route path="/" element={<HomePage user={user} onRequestClick={handleRequestClick} />} />
          <Route path="/register" element={<RegisterPage user={user} />} />
          <Route path="/login" element={<LoginPage user={user} onLoginSuccess={setUser} />} />
          <Route
            path="/explore"
            element={<ExploreSkillsPage user={user} onRequestClick={handleRequestClick} />}
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
