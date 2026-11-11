import { useState, useEffect } from 'react';
import { api, CATEGORIES, EXPERIENCE_LEVELS } from '../api';
import SkillCard from '../components/SkillCard';

export default function AddSkillPage({ user }) {
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

