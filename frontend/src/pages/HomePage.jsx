import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import SkillCard from '../components/SkillCard';

export default function HomePage({ user, onRequestClick }) {
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

