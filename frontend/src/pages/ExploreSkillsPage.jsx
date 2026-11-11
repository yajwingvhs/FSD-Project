import { useState, useEffect } from 'react';
import { api, CATEGORIES } from '../api';
import SkillCard from '../components/SkillCard';

export default function ExploreSkillsPage({ user, onRequestClick }) {
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

